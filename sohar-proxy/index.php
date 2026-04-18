<?php
// =========================
// CONFIG
// =========================
const TARGET_HOST = 'gpass.soharportandfreezone.om';
const TARGET_PORT = 443;
const LOG_DIR = __DIR__ . '/logs';
/** Save raw JSON body + multipart files under logs/incoming/{traceId}/ */
const SAVE_INCOMING_PAYLOADS = true;
/** Max bytes written per upstream response dump file (avoid filling disk) */
const UPSTREAM_RESPONSE_BODY_FILE_MAX = 524288;

if (!is_dir(LOG_DIR)) {
    @mkdir(LOG_DIR, 0775, true);
}

// =========================
// HELPERS
// =========================
function getTimestamp() {
    return (new DateTime())->format('Y-m-d\TH:i:s.v\Z');
}

function writeLog($level, $data) {
    $date = date('Y-m-d');
    $fileName = ($level === 'ERROR') ? "error-$date.log" : "access-$date.log";
    $filePath = LOG_DIR . '/' . $fileName;

    $entry = array_merge([
        'level' => $level,
        'timestamp' => getTimestamp()
    ], $data);

    $written = @file_put_contents($filePath, json_encode($entry) . "\n", FILE_APPEND | LOCK_EX);
    if ($written === false) {
        error_log('[gatepassproxy] log write failed: ' . $filePath);
    }
}

function maskHeaders($headers) {
    foreach ($headers as $key => $value) {
        if (strtolower($key) === 'authorization') {
            $headers[$key] = '***MASKED***';
        }
    }
    return $headers;
}

/** Client → proxy: safe header subset for troubleshooting (no secrets). */
function incomingHeadersForLog() {
    return array_filter([
        'User-Agent' => $_SERVER['HTTP_USER_AGENT'] ?? null,
        'X-Forwarded-For' => $_SERVER['HTTP_X_FORWARDED_FOR'] ?? null,
        'X-Real-IP' => $_SERVER['HTTP_X_REAL_IP'] ?? null,
        'X-Trace-Id' => $_SERVER['HTTP_X_TRACE_ID'] ?? null,
        'Authorization' => !empty($_SERVER['HTTP_AUTHORIZATION']) ? '***MASKED***' : null,
        'Referer' => $_SERVER['HTTP_REFERER'] ?? null,
        'Accept' => $_SERVER['HTTP_ACCEPT'] ?? null,
    ], function ($v) {
        return $v !== null && $v !== '';
    });
}

function truncateForLog($str, $max) {
    if ($str === '' || $str === null) {
        return '';
    }
    if (strlen($str) <= $max) {
        return $str;
    }
    return substr($str, 0, $max) . '…[truncated,len=' . strlen($str) . ']';
}

function sanitizeTraceDirId($traceId) {
    $s = preg_replace('/[^a-zA-Z0-9_-]/', '', $traceId);
    return $s !== '' ? $s : 'unknown';
}

/** Parse "Header-Name: value" block from curl (with optional continuation lines). */
function parseHttpHeaderLines($rawHeaders) {
    $lines = preg_split('/\r\n|\n|\r/', $rawHeaders);
    $out = [];
    $lastKey = null;
    foreach ($lines as $line) {
        if ($line === '' || strpos($line, 'HTTP/') === 0) {
            continue;
        }
        if (preg_match('/^([\w-]+):\s*(.*)$/', $line, $m)) {
            $k = $m[1];
            $v = $m[2];
            if (strcasecmp($k, 'Set-Cookie') === 0) {
                $v = '[redacted]';
            }
            $out[$k] = $v;
            $lastKey = $k;
        } elseif ($lastKey !== null && (substr($line, 0, 1) === ' ' || substr($line, 0, 1) === "\t")) {
            $out[$lastKey] .= trim($line);
        }
    }
    return $out;
}

function curlInfoForLog($info) {
    if (!is_array($info)) {
        return [];
    }
    $keys = [
        'url', 'http_code', 'total_time', 'namelookup_time', 'connect_time',
        'appconnect_time', 'pretransfer_time', 'starttransfer_time',
        'primary_ip', 'primary_port', 'size_download', 'speed_download',
        'ssl_verify_result', 'redirect_count', 'redirect_url',
    ];
    $pick = [];
    foreach ($keys as $k) {
        if (array_key_exists($k, $info)) {
            $pick[$k] = $info[$k];
        }
    }
    return $pick;
}

/**
 * Copy multipart upload to logs/incoming/{traceId}/ for verification.
 * @return array<int, array<string, mixed>>
 */
function saveIncomingMultipartFiles($traceId, array $fileKeys) {
    $saved = [];
    $dir = LOG_DIR . '/incoming/' . sanitizeTraceDirId($traceId);
    if (!is_dir($dir)) {
        @mkdir($dir, 0775, true);
    }
    foreach ($fileKeys as $fieldKey) {
        if (empty($_FILES[$fieldKey]) || !is_array($_FILES[$fieldKey])) {
            continue;
        }
        $f = $_FILES[$fieldKey];
        if (($f['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK || empty($f['tmp_name'])) {
            $saved[] = ['field' => $fieldKey, 'error' => 'upload_err_' . ($f['error'] ?? '?')];
            continue;
        }
        if (!is_uploaded_file($f['tmp_name'])) {
            $saved[] = ['field' => $fieldKey, 'error' => 'not_uploaded_file'];
            continue;
        }
        $safeBase = preg_replace('/[^a-zA-Z0-9._-]/', '_', basename($f['name']));
        $destName = $fieldKey . '_' . $safeBase;
        $dest = $dir . '/' . $destName;
        if (!@copy($f['tmp_name'], $dest)) {
            $saved[] = ['field' => $fieldKey, 'error' => 'copy_failed'];
            continue;
        }
        $bytes = @filesize($dest) ?: 0;
        $sha256 = @hash_file('sha256', $dest);
        $saved[] = [
            'field' => $fieldKey,
            'savedPath' => $dest,
            'originalName' => $f['name'],
            'bytes' => $bytes,
            'sha256' => $sha256 ?: null,
        ];
    }
    return $saved;
}

function saveIncomingJsonBody($traceId, $rawJson) {
    if (!SAVE_INCOMING_PAYLOADS || $rawJson === '' || $rawJson === null) {
        return null;
    }
    $dir = LOG_DIR . '/incoming/' . sanitizeTraceDirId($traceId);
    if (!is_dir($dir)) {
        @mkdir($dir, 0775, true);
    }
    $path = $dir . '/request-body.json';
    if (@file_put_contents($path, $rawJson) === false) {
        return null;
    }
    return $path;
}

function saveMetadataSnapshot($traceId, $metadataJsonString) {
    if (!SAVE_INCOMING_PAYLOADS || $metadataJsonString === '') {
        return null;
    }
    $dir = LOG_DIR . '/incoming/' . sanitizeTraceDirId($traceId);
    if (!is_dir($dir)) {
        @mkdir($dir, 0775, true);
    }
    $path = $dir . '/metadata.json';
    @file_put_contents($path, $metadataJsonString);
    return $path;
}

/** Write upstream response snapshot for debugging (body capped). */
function saveUpstreamResponseArtifact($traceId, array $curlInfoSubset, $rawHeaders, $body, $upstreamContentType) {
    $day = date('Y-m-d');
    $base = LOG_DIR . '/upstream-responses/' . $day;
    if (!is_dir($base)) {
        @mkdir($base, 0775, true);
    }
    $id = sanitizeTraceDirId($traceId);
    $metaPath = $base . '/' . $id . '.meta.json';
    $bodyPath = $base . '/' . $id . '.body.txt';
    $headersParsed = parseHttpHeaderLines($rawHeaders);
    $bodyLen = strlen($body);
    $truncated = false;
    $bodyForFile = $body;
    if ($bodyLen > UPSTREAM_RESPONSE_BODY_FILE_MAX) {
        $bodyForFile = substr($body, 0, UPSTREAM_RESPONSE_BODY_FILE_MAX);
        $truncated = true;
    }
    $meta = [
        'traceId' => $traceId,
        'savedAt' => getTimestamp(),
        'upstreamContentType' => $upstreamContentType,
        'curlInfo' => $curlInfoSubset,
        'responseHeaders' => $headersParsed,
        'responseBodyBytes' => $bodyLen,
        'bodyFile' => basename($bodyPath),
        'bodyTruncatedInFile' => $truncated,
    ];
    @file_put_contents($metaPath, json_encode($meta, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    @file_put_contents($bodyPath, $bodyForFile);
    return ['metaPath' => $metaPath, 'bodyPath' => $bodyPath];
}

// Clean logs older than 7 days (glob can return false — must not foreach it on PHP 8+)
$logFiles = glob(LOG_DIR . '/*.log');
if (is_array($logFiles)) {
    foreach ($logFiles as $file) {
        if (is_file($file) && time() - filemtime($file) > (7 * 86400)) {
            @unlink($file);
        }
    }
}
// Drop old incoming attachment folders + dated upstream-response dirs
$incomingDirs = glob(LOG_DIR . '/incoming/*', GLOB_ONLYDIR);
if (is_array($incomingDirs)) {
    foreach ($incomingDirs as $dir) {
        if (is_dir($dir) && time() - filemtime($dir) > (7 * 86400)) {
            foreach (glob($dir . '/*') ?: [] as $f) {
                if (is_file($f)) {
                    @unlink($f);
                }
            }
            @rmdir($dir);
        }
    }
}
$upstreamDays = glob(LOG_DIR . '/upstream-responses/*', GLOB_ONLYDIR);
if (is_array($upstreamDays)) {
    foreach ($upstreamDays as $dayDir) {
        if (!is_dir($dayDir)) {
            continue;
        }
        $dayName = basename($dayDir);
        $ts = strtotime($dayName . ' 00:00:00 UTC');
        if ($ts !== false && (time() - $ts) > (8 * 86400)) {
            foreach (glob($dayDir . '/*') ?: [] as $f) {
                if (is_file($f)) {
                    @unlink($f);
                }
            }
            @rmdir($dayDir);
        }
    }
}

// Diagnostic only: GET .../gatepassproxy/?proxy_ping=1 — confirms rewrite + writable logs (remove in production if desired)
if (!empty($_GET['proxy_ping'])) {
    writeLog('REQUEST', [
        'proxy_ping' => true,
        'uri' => $_SERVER['REQUEST_URI'] ?? '',
        'remote' => $_SERVER['REMOTE_ADDR'] ?? '',
    ]);
    header('Content-Type: application/json; charset=utf-8');
    header('X-Gatepass-Proxy: php');
    echo json_encode([
        'ok' => true,
        'logDir' => LOG_DIR,
        'dirExists' => is_dir(LOG_DIR),
        'writable' => is_writable(LOG_DIR),
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// =========================
// PROXY LOGIC
// =========================
$startTime = microtime(true);
$traceId = $_SERVER['HTTP_X_TRACE_ID'] ?? bin2hex(random_bytes(5));

// Capture Request Path
$requestUri = $_SERVER['REQUEST_URI'];
$pathUrl = parse_url($requestUri, PHP_URL_PATH);
$queryRaw = parse_url($requestUri, PHP_URL_QUERY);
$queryString = $queryRaw ? '?' . $queryRaw : '';
$queryParams = [];
if ($queryRaw !== null && $queryRaw !== '') {
    parse_str($queryRaw, $queryParams);
}

// Handle prefix stripping
if (strpos($pathUrl, '/gatepassproxy') === 0) {
    $pathUrl = substr($pathUrl, strlen('/gatepassproxy')) ?: '/';
}

$contentType = $_SERVER['CONTENT_TYPE'] ?? '';
$isMultipart = (strpos(strtolower($contentType), 'multipart/form-data') !== false);
$isMultipartCreate = ($isMultipart && $pathUrl === '/api/gatepass/post-multipart');

$forwardPath = ($pathUrl === '/api/gatepass/post-multipart') ? '/api/gatepass/post' : $pathUrl;
$upstreamUrl = "https://" . TARGET_HOST . $forwardPath . $queryString;

// Process Body
$outgoingBodyStr = '';
$incomingAttachmentsSaved = [];
$metadataSavedPath = null;
$incomingJsonSavedPath = null;

if ($isMultipartCreate) {
    // Preserve raw metadata + uploaded files on disk before building upstream JSON
    if (SAVE_INCOMING_PAYLOADS) {
        $metadataSavedPath = saveMetadataSnapshot($traceId, $_POST['metadata'] ?? '');
        $incomingAttachmentsSaved = saveIncomingMultipartFiles($traceId, [
            'identification_file',
            'photo_file',
            'other_file_1',
            'other_file_2',
        ]);
    }

    // PHP automatically parses multipart into $_POST and $_FILES
    $meta = json_decode($_POST['metadata'] ?? '{}', true);
    $payload = $meta;

    $fileMappings = [
        'identification_file' => ['attachment' => 'identification_attachment', 'name' => 'identification_document'],
        'photo_file'          => ['attachment' => 'photo_attachment',          'name' => 'photo'],
        'other_file_1'        => ['attachment' => 'other_attachment',          'name' => 'other_documents'],
        'other_file_2'        => ['attachment' => 'other_attachment2',         'name' => 'other_documents2'],
    ];

    foreach ($fileMappings as $formKey => $outKeys) {
        if (isset($_FILES[$formKey]) && $_FILES[$formKey]['size'] > 0) {
            $payload[$outKeys['attachment']] = base64_encode(file_get_contents($_FILES[$formKey]['tmp_name']));
            if (empty($payload[$outKeys['name']])) {
                $payload[$outKeys['name']] = basename($_FILES[$formKey]['name']);
            }
        }
    }
    
    // Logic fallback for photo
    if (!isset($payload['photo_attachment']) && isset($payload['identification_attachment'])) {
        $payload['photo_attachment'] = $payload['identification_attachment'];
    }

    $outgoingBodyStr = json_encode($payload);
} else {
    $outgoingBodyStr = file_get_contents('php://input');
}

if (SAVE_INCOMING_PAYLOADS && !$isMultipart && strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST' && strlen($outgoingBodyStr) > 0) {
    $incomingJsonSavedPath = saveIncomingJsonBody($traceId, $outgoingBodyStr);
}

// Log incoming request (full enough to debug 404 / path issues; body truncated)
$incomingBodyLog = $isMultipart
    ? '[multipart parsed to JSON upstream; POST keys: ' . implode(',', array_keys($_POST)) . '; files saved: ' . count($incomingAttachmentsSaved) . ']'
    : truncateForLog($outgoingBodyStr, 16000);

writeLog('REQUEST', [
    'traceId' => $traceId,
    'method' => $_SERVER['REQUEST_METHOD'],
    'clientIp' => $_SERVER['REMOTE_ADDR'] ?? '',
    'host' => $_SERVER['HTTP_HOST'] ?? '',
    'https' => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'),
    'requestUri' => $requestUri,
    'pathAfterProxy' => $pathUrl,
    'queryString' => $queryRaw !== null && $queryRaw !== '' ? $queryRaw : '',
    'queryParams' => $queryParams,
    'contentType' => $contentType,
    'contentLengthIncoming' => $_SERVER['CONTENT_LENGTH'] ?? null,
    'clientHeaders' => incomingHeadersForLog(),
    'forwardPath' => $forwardPath,
    'forwardTo' => $upstreamUrl,
    'bodyPreview' => $incomingBodyLog,
    'incomingMetadataPath' => $metadataSavedPath,
    'incomingAttachments' => $incomingAttachmentsSaved,
    'incomingJsonBodyPath' => $incomingJsonSavedPath,
]);

// =========================
// CURL UPSTREAM
// =========================
$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

$ch = curl_init($upstreamUrl);

$headers = [
    'Authorization: Basic ' . base64_encode('MISC.API:@p1_2M@jee$'),
    'X-Trace-Id: ' . $traceId,
];
if ($method !== 'HEAD' && $method !== 'GET') {
    $headers[] = 'Content-Type: application/json; charset=utf-8';
    $headers[] = 'Content-Length: ' . strlen($outgoingBodyStr);
}

curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // Match "rejectUnauthorized: false"
curl_setopt($ch, CURLOPT_TIMEOUT, 60);
curl_setopt($ch, CURLOPT_HEADER, true); // We want to capture response headers
curl_setopt($ch, CURLOPT_ENCODING, ''); // Accept gzip/deflate — avoids odd transfer errors on large HTML

// HEAD: upstream often sends Content-Length matching GET but no body — libcurl waits → "transfer closed with N bytes remaining"
if ($method === 'HEAD') {
    curl_setopt($ch, CURLOPT_NOBODY, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'HEAD');
} elseif ($method === 'GET') {
    curl_setopt($ch, CURLOPT_HTTPGET, true);
} else {
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $outgoingBodyStr);
}

$response = curl_exec($ch);
$info = curl_getinfo($ch);
$err = curl_error($ch);

if ($err) {
    writeLog('ERROR', [
        'traceId' => $traceId,
        'stage' => 'UPSTREAM_ERROR',
        'message' => $err
    ]);
    http_response_code(502);
    echo json_encode(['error' => 'Proxy failed', 'traceId' => $traceId]);
    exit;
}

// Split headers and body
$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$resHeaders = substr($response, 0, $headerSize);
$resBody = substr($response, $headerSize);

curl_close($ch);

// Prefer upstream Content-Type so Node/axios parses JSON vs text correctly
$upstreamContentType = 'application/json';
if (preg_match('/^Content-Type:\s*([^\r\n]+)/mi', $resHeaders, $ctMatch)) {
    $upstreamContentType = trim($ctMatch[1]);
}

$curlInfoSubset = curlInfoForLog($info);
$parsedRespHeaders = parseHttpHeaderLines($resHeaders);

// Persist full upstream snapshot (body capped) under logs/upstream-responses/{date}/
$upstreamArtifacts = saveUpstreamResponseArtifact($traceId, $curlInfoSubset, $resHeaders, $resBody, $upstreamContentType);

// Log upstream response (larger body slice on errors for 404 diagnosis)
$httpCode = (int) $info['http_code'];
$resBodyLimit = ($httpCode >= 400) ? 48000 : 4000;
$responseEntry = [
    'traceId' => $traceId,
    'statusCode' => $httpCode,
    'curlEffectiveUrl' => $info['url'] ?? '',
    'curlInfo' => $curlInfoSubset,
    'upstreamResponseHeaders' => $parsedRespHeaders,
    'durationMs' => round((microtime(true) - $startTime) * 1000),
    'responseBodyBytes' => strlen($resBody),
    'bodyPreview' => truncateForLog($resBody, $resBodyLimit),
    'upstreamArtifactMetaPath' => $upstreamArtifacts['metaPath'] ?? null,
    'upstreamArtifactBodyPath' => $upstreamArtifacts['bodyPath'] ?? null,
];
if ($httpCode >= 400) {
    $responseEntry['upstreamResponseHeadersRawPreview'] = truncateForLog($resHeaders, 4000);
}
writeLog('RESPONSE', $responseEntry);
if ($httpCode >= 400) {
    writeLog('ERROR', [
        'traceId' => $traceId,
        'stage' => 'UPSTREAM_HTTP_ERROR',
        'statusCode' => $httpCode,
        'forwardTo' => $upstreamUrl,
        'message' => 'Upstream returned ' . $httpCode . '; see RESPONSE row for body',
    ]);
}

// Finalize Output
http_response_code($info['http_code']);
header('Content-Type: ' . $upstreamContentType);
echo $resBody;