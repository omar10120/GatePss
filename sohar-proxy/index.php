<?php
// =========================
// CONFIG
// =========================
const TARGET_HOST = 'gpass.soharportandfreezone.om';
const TARGET_PORT = 443;
const LOG_DIR = __DIR__ . '/logs';

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

// Clean logs older than 7 days (glob can return false — must not foreach it on PHP 8+)
$logFiles = glob(LOG_DIR . '/*.log');
if (is_array($logFiles)) {
    foreach ($logFiles as $file) {
        if (is_file($file) && time() - filemtime($file) > (7 * 86400)) {
            @unlink($file);
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
$queryString = parse_url($requestUri, PHP_URL_QUERY);
$queryString = $queryString ? '?' . $queryString : '';

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
if ($isMultipartCreate) {
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

// Log Request
writeLog('REQUEST', [
    'traceId' => $traceId,
    'method' => $_SERVER['REQUEST_METHOD'],
    'url' => $requestUri,
    'forwardTo' => $upstreamUrl,
    'clientIp' => $_SERVER['REMOTE_ADDR'],
    'bodyPreview' => $isMultipart ? '[multipart parsed]' : substr($outgoingBodyStr, 0, 1000)
]);

// =========================
// CURL UPSTREAM
// =========================
$ch = curl_init($upstreamUrl);

$headers = [
    'Content-Type: application/json; charset=utf-8',
    'Content-Length: ' . strlen($outgoingBodyStr),
    'Authorization: Basic ' . base64_encode('MISC.API:@p1_2M@jee$'),
    'X-Trace-Id: ' . $traceId
];

curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $_SERVER['REQUEST_METHOD']);
curl_setopt($ch, CURLOPT_POSTFIELDS, $outgoingBodyStr);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // Match "rejectUnauthorized: false"
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
curl_setopt($ch, CURLOPT_HEADER, true); // We want to capture response headers

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

// Log Response
writeLog('RESPONSE', [
    'traceId' => $traceId,
    'statusCode' => $info['http_code'],
    'durationMs' => round((microtime(true) - $startTime) * 1000),
    'bodyPreview' => substr($resBody, 0, 1000)
]);

// Finalize Output
http_response_code($info['http_code']);
header('Content-Type: application/json');
echo $resBody;