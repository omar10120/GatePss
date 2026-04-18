<?php
// =========================
// CONFIG
// =========================
const TARGET_HOST = 'gpass.soharportandfreezone.om';
const LOG_DIR = __DIR__ . '/logs';

/**
 * إعدادات محلية (cPanel غالبًا لا يمرّر SetEnv لـ getenv): عيّن القيم هنا إذا لم تُضبط على الخادم.
 * متغيرات البيئة على السيرفر تبقى لها الأولوية إذا كانت معرّفة وغير فارغة.
 */
const GATEPASS_LOCAL_TRUSTED_UPLOAD_DOMAIN = 'majis.om'; // أو '' ثم ضبط على الخادم فقط
const GATEPASS_LOCAL_FETCH_ALLOWED_HOSTS = ''; // مثال: 'gatepass.majis.om'
const GATEPASS_LOCAL_PROXY_MAX_ATTACHMENT_BYTES = '';

/** Save raw JSON body + multipart files under logs/incoming/{traceId}/ */
const SAVE_INCOMING_PAYLOADS = true;
/** Max bytes written per upstream response dump file (avoid filling disk) */
const UPSTREAM_RESPONSE_BODY_FILE_MAX = 524288;
/** Max bytes per attachment when fetching by URL or reading from local root (default 15 MiB). */
function gatepassMaxAttachmentBytes() {
    $v = getenv('GATEPASS_PROXY_MAX_ATTACHMENT_BYTES');
    if ($v !== false && ctype_digit(trim($v))) {
        return max(1024, (int) trim($v));
    }
    return 15728640;
}

/**
 * يطبّق GATEPASS_LOCAL_* عبر putenv فقط عندما لا يكون المفتاح معرّفًا من الخادم (Apache SetEnv / php-fpm pool).
 */
function gatepassBootstrapLocalEnvFromConstants() {
    if (GATEPASS_LOCAL_TRUSTED_UPLOAD_DOMAIN !== '') {
        $cur = getenv('GATEPASS_TRUSTED_UPLOAD_DOMAIN');
        if ($cur === false || trim((string) $cur) === '') {
            putenv('GATEPASS_TRUSTED_UPLOAD_DOMAIN=' . GATEPASS_LOCAL_TRUSTED_UPLOAD_DOMAIN);
            $_ENV['GATEPASS_TRUSTED_UPLOAD_DOMAIN'] = GATEPASS_LOCAL_TRUSTED_UPLOAD_DOMAIN;
        }
    }
    if (GATEPASS_LOCAL_FETCH_ALLOWED_HOSTS !== '') {
        $cur = getenv('GATEPASS_FETCH_ALLOWED_HOSTS');
        if ($cur === false || trim((string) $cur) === '') {
            putenv('GATEPASS_FETCH_ALLOWED_HOSTS=' . GATEPASS_LOCAL_FETCH_ALLOWED_HOSTS);
            $_ENV['GATEPASS_FETCH_ALLOWED_HOSTS'] = GATEPASS_LOCAL_FETCH_ALLOWED_HOSTS;
        }
    }
    if (GATEPASS_LOCAL_PROXY_MAX_ATTACHMENT_BYTES !== '' && ctype_digit(trim(GATEPASS_LOCAL_PROXY_MAX_ATTACHMENT_BYTES))) {
        $cur = getenv('GATEPASS_PROXY_MAX_ATTACHMENT_BYTES');
        if ($cur === false || trim((string) $cur) === '') {
            $v = trim(GATEPASS_LOCAL_PROXY_MAX_ATTACHMENT_BYTES);
            putenv('GATEPASS_PROXY_MAX_ATTACHMENT_BYTES=' . $v);
            $_ENV['GATEPASS_PROXY_MAX_ATTACHMENT_BYTES'] = $v;
        }
    }
}

if (!is_dir(LOG_DIR)) {
    @mkdir(LOG_DIR, 0775, true);
}

gatepassBootstrapLocalEnvFromConstants();

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

/**
 * ASP.NET rejects JSON with malformed UTF-8 ("Unable to translate bytes [FF]…").
 * Strip lone surrogate bytes / invalid sequences before json_encode upstream.
 */
function sanitizeUtf8String($s) {
    if ($s === null || $s === '') {
        return $s;
    }
    if (!is_string($s)) {
        return $s;
    }
    // Prefer mb_scrub / mb_convert_encoding — iconv false + preg fallback left invalid UTF-8 bytes (0xFF etc.), which broke ASP.NET model bind.
    if (function_exists('mb_scrub')) {
        return mb_scrub($s, 'UTF-8');
    }
    if (function_exists('mb_convert_encoding')) {
        $t = @mb_convert_encoding($s, 'UTF-8', 'UTF-8');
        if ($t !== false) {
            return $t;
        }
    }
    if (function_exists('iconv')) {
        $clean = @iconv('UTF-8', 'UTF-8//IGNORE', $s);
        if ($clean !== false) {
            return $clean;
        }
    }
    return preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $s);
}

function sanitizeUtf8Deep($data) {
    if (is_array($data)) {
        $out = [];
        foreach ($data as $k => $v) {
            $nk = is_string($k) ? sanitizeUtf8String($k) : $k;
            $out[$nk] = sanitizeUtf8Deep($v);
        }
        return $out;
    }
    if (is_string($data)) {
        return sanitizeUtf8String($data);
    }
    return $data;
}

function sanitizeTraceDirId($traceId) {
    $s = preg_replace('/[^a-zA-Z0-9_-]/', '', $traceId);
    return $s !== '' ? $s : 'unknown';
}

/**
 * Parse comma-separated host list from env (lowercase, deduped).
 */
function gatepassParseHostListEnv($envName) {
    $raw = getenv($envName);
    if ($raw === false || trim($raw) === '') {
        return [];
    }
    $hosts = [];
    foreach (explode(',', $raw) as $h) {
        $h = strtolower(trim($h));
        if ($h !== '') {
            $hosts[$h] = true;
        }
    }
    return array_keys($hosts);
}

/**
 * Hosts allowed for gatepass attachment HTTP fetch (comma-separated GATEPASS_FETCH_ALLOWED_HOSTS).
 * Additionally: GATEPASS_TRUSTED_UPLOAD_DOMAIN suffix (e.g. majis.om) allows *.majis.om without listing each host.
 */
function gatepassAllowedFetchHosts() {
    return gatepassParseHostListEnv('GATEPASS_FETCH_ALLOWED_HOSTS');
}

/**
 * True if host equals domain or is a subdomain of domain (e.g. gatepass.majis.om under majis.om).
 */
function gatepassHostUnderTrustedDomain($host, $registeredDomain) {
    $host = strtolower((string) $host);
    $registeredDomain = strtolower(trim((string) $registeredDomain));
    if ($host === '' || $registeredDomain === '') {
        return false;
    }
    if ($host === $registeredDomain) {
        return true;
    }
    $suffix = '.' . $registeredDomain;
    return strlen($host) > strlen($suffix) && substr($host, -strlen($suffix)) === $suffix;
}

function gatepassHostAllowedForFetch($host) {
    $host = strtolower((string) $host);
    if ($host === '') {
        return false;
    }
    $allowed = gatepassAllowedFetchHosts();
    if (in_array($host, $allowed, true)) {
        return true;
    }
    $trusted = getenv('GATEPASS_TRUSTED_UPLOAD_DOMAIN');
    if (is_string($trusted) && trim($trusted) !== '' && gatepassHostUnderTrustedDomain($host, $trusted)) {
        return true;
    }
    return false;
}

/**
 * Fetch binary from https? URL if host is allowlisted. Returns raw bytes or null.
 */
function gatepassFetchAttachmentFromUrl($url, $traceId) {
    if (!is_string($url) || $url === '') {
        return null;
    }
    $url = trim($url);
    $p = @parse_url($url);
    if (!is_array($p) || empty($p['scheme']) || empty($p['host'])) {
        writeLog('ERROR', ['traceId' => $traceId, 'stage' => 'ATTACHMENT_FETCH_BAD_URL', 'url' => truncateForLog($url, 200)]);
        return null;
    }
    $scheme = strtolower((string) $p['scheme']);
    if ($scheme !== 'http' && $scheme !== 'https') {
        return null;
    }
    if (!gatepassHostAllowedForFetch($p['host'])) {
        writeLog('ERROR', [
            'traceId' => $traceId,
            'stage' => 'ATTACHMENT_FETCH_HOST_DENIED',
            'host' => $p['host'],
            'hint' => 'Set GATEPASS_FETCH_ALLOWED_HOSTS or GATEPASS_TRUSTED_UPLOAD_DOMAIN (e.g. majis.om)',
        ]);
        return null;
    }
    if (!function_exists('curl_init')) {
        writeLog('ERROR', ['traceId' => $traceId, 'stage' => 'ATTACHMENT_FETCH_NO_CURL', 'url' => truncateForLog($url, 200)]);
        return null;
    }
    $max = gatepassMaxAttachmentBytes();
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_MAXREDIRS => 5,
        CURLOPT_CONNECTTIMEOUT => 20,
        CURLOPT_TIMEOUT => 60,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => 0,
        CURLOPT_HTTPHEADER => ['Accept: */*'],
    ]);
    $data = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($data === false) {
        $data = null;
    }
    if ($httpCode !== null && ($httpCode < 200 || $httpCode >= 300)) {
        writeLog('ERROR', [
            'traceId' => $traceId,
            'stage' => 'ATTACHMENT_FETCH_HTTP_FAILED',
            'url' => truncateForLog($url, 200),
            'http_code' => $httpCode,
        ]);
        return null;
    }
    if ($data === null || $data === '') {
        writeLog('ERROR', [
            'traceId' => $traceId,
            'stage' => 'ATTACHMENT_FETCH_HTTP_FAILED',
            'url' => truncateForLog($url, 200),
            'http_code' => $httpCode,
            'hint' => 'Empty response; check URL from proxy server network',
        ]);
        return null;
    }
    if (strlen($data) > $max) {
        writeLog('ERROR', ['traceId' => $traceId, 'stage' => 'ATTACHMENT_FETCH_TOO_LARGE', 'bytes' => strlen($data), 'max' => $max]);
        return null;
    }
    return $data;
}

function gatepassGuessBasenameFromUrl($url) {
    if (!is_string($url) || $url === '') {
        return '';
    }
    $path = parse_url($url, PHP_URL_PATH);
    if (!is_string($path) || $path === '') {
        return '';
    }
    $base = basename($path);
    return preg_match('/^[a-zA-Z0-9._-]+$/', $base) ? $base : '';
}

/**
 * Merge _gatepassProxy HTTPS URLs into base64 attachment fields. Removes _gatepassProxy before upstream.
 */
function gatepassMergeProxyFetchedAttachments(&$payload, $traceId) {
    $gp = $payload['_gatepassProxy'] ?? null;
    if (!is_array($gp)) {
        unset($payload['_gatepassProxy']);
        return;
    }
    unset($payload['_gatepassProxy']);

    $slots = [
        ['urlKey' => 'identificationUrl', 'attachment' => 'identification_attachment', 'name' => 'identification_document'],
        ['urlKey' => 'photoUrl', 'attachment' => 'photo_attachment', 'name' => 'photo'],
        ['urlKey' => 'other1Url', 'attachment' => 'other_attachment', 'name' => 'other_documents'],
        ['urlKey' => 'other2Url', 'attachment' => 'other_attachment2', 'name' => 'other_documents2'],
    ];

    foreach ($slots as $slot) {
        if (!empty($payload[$slot['attachment']])) {
            continue;
        }
        if (empty($gp[$slot['urlKey']]) || !is_string($gp[$slot['urlKey']])) {
            continue;
        }
        $bytes = gatepassFetchAttachmentFromUrl($gp[$slot['urlKey']], $traceId);
        if ($bytes !== null && $bytes !== '') {
            $payload[$slot['attachment']] = base64_encode($bytes);
            if (empty($payload[$slot['name']])) {
                $guess = gatepassGuessBasenameFromUrl($gp[$slot['urlKey']]);
                if ($guess !== '') {
                    $payload[$slot['name']] = $guess;
                }
            }
        }
    }
}

/** Sanitize UTF-8 and json_encode for upstream Sohar POST body. */
function gatepassJsonEncodeUpstreamBody(array $payload) {
    $payload = sanitizeUtf8Deep($payload);
    $jsonFlags = JSON_UNESCAPED_UNICODE;
    if (defined('JSON_INVALID_UTF8_SUBSTITUTE')) {
        $jsonFlags |= JSON_INVALID_UTF8_SUBSTITUTE;
    }
    $encoded = json_encode($payload, $jsonFlags);
    if ($encoded === false) {
        $encoded = json_encode(sanitizeUtf8Deep($payload), JSON_UNESCAPED_UNICODE);
    }
    return ($encoded !== false && $encoded !== '') ? $encoded : '{}';
}

/** Merge `_gatepassProxy`, apply photo-from-ID fallback, encode for upstream JSON create. */
function gatepassFinalizeGatepassPayload(array &$payload, $traceId) {
    gatepassMergeProxyFetchedAttachments($payload, $traceId);
    if (!isset($payload['photo_attachment']) && isset($payload['identification_attachment'])) {
        $payload['photo_attachment'] = $payload['identification_attachment'];
    }
    return gatepassJsonEncodeUpstreamBody($payload);
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
$ctLower = strtolower($contentType);
$isMultipart = (strpos($ctLower, 'multipart/form-data') !== false);
$isApplicationJson = (strpos($ctLower, 'application/json') !== false);
$isPostMultipartRoute = ($pathUrl === '/api/gatepass/post-multipart');
/** JSON body + `_gatepassProxy` URLs → fetch attachments → POST upstream /api/gatepass/post */
$isJsonGatepassCreate = ($isPostMultipartRoute && $isApplicationJson && !$isMultipart);

$forwardPath = ($pathUrl === '/api/gatepass/post-multipart') ? '/api/gatepass/post' : $pathUrl;
$upstreamUrl = "https://" . TARGET_HOST . $forwardPath . $queryString;

// Process Body
$outgoingBodyStr = '';
$incomingJsonSavedPath = null;

if ($isJsonGatepassCreate) {
    $rawIncoming = file_get_contents('php://input');
    if (SAVE_INCOMING_PAYLOADS && $rawIncoming !== '' && $rawIncoming !== false) {
        $incomingJsonSavedPath = saveIncomingJsonBody($traceId, $rawIncoming);
    }
    $payload = json_decode($rawIncoming !== false ? $rawIncoming : '', true);
    if (!is_array($payload)) {
        $payload = [];
    }
    $outgoingBodyStr = gatepassFinalizeGatepassPayload($payload, $traceId);
} else {
    $outgoingBodyStr = file_get_contents('php://input');
}

if (
    SAVE_INCOMING_PAYLOADS &&
    !$isMultipart &&
    $incomingJsonSavedPath === null &&
    strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST' &&
    strlen($outgoingBodyStr) > 0
) {
    $incomingJsonSavedPath = saveIncomingJsonBody($traceId, $outgoingBodyStr);
}

// Log incoming request (full enough to debug 404 / path issues; body truncated)
$incomingBodyLog = truncateForLog($outgoingBodyStr, 16000);

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
    'incomingMetadataPath' => null,
    'incomingAttachments' => [],
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