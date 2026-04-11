const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const dns = require('dns');

// =========================
// CONFIG
// =========================
const TARGET_HOST = 'gpass.soharportandfreezone.om';
const TARGET_PORT = 443;

const LOG_DIR = path.join(__dirname, 'logs');
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR);

// =========================
// HELPERS
// =========================
function getDate() {
    const now = new Date();
    return now.getFullYear() + '-' +
        String(now.getMonth() + 1).padStart(2, '0') + '-' +
        String(now.getDate()).padStart(2, '0');
}

function getTimestamp() {
    return new Date().toISOString();
}

// =========================
// LOG ROTATION (7 days)
// =========================
function cleanOldLogs() {
    const files = fs.readdirSync(LOG_DIR);
    const now = Date.now();

    files.forEach(file => {
        const filePath = path.join(LOG_DIR, file);
        const stat = fs.statSync(filePath);

        const ageDays = (now - stat.mtimeMs) / (1000 * 60 * 60 * 24);
        if (ageDays > 7) fs.unlinkSync(filePath);
    });
}

cleanOldLogs();

// =========================
// LOGGER
// =========================
function writeLog(level, data) {
    const date = getDate();
    const file = level === 'ERROR'
        ? `error-${date}.log`
        : `access-${date}.log`;

    const filePath = path.join(LOG_DIR, file);

    const entry = {
        level,
        timestamp: getTimestamp(),
        ...data
    };

    fs.appendFile(filePath, JSON.stringify(entry) + '\n', () => {});
    console.log(JSON.stringify(entry, null, 2));
}

// =========================
// SERVER
// =========================
const server = http.createServer((req, res) => {

    const startTime = Date.now();

    const traceId =
        req.headers['x-trace-id'] ||
        Math.random().toString(36).substring(2, 12);

    let body = [];

    req.on('data', chunk => body.push(chunk));

    req.on('end', () => {

        body = Buffer.concat(body).toString();

        let pathUrl = req.url;
        if (pathUrl.startsWith('/gatepassproxy')) {
            pathUrl = pathUrl.replace('/gatepassproxy', '') || '/';
        }

        // =========================
        // CLIENT REQUEST LOG
        // =========================
        writeLog('REQUEST', {
            traceId,
            stage: 'CLIENT_REQUEST',
            method: req.method,
            url: req.url,
            forwardTo: pathUrl,
            clientIp: req.socket.remoteAddress,
            headers: req.headers,
            bodyPreview: body ? body.substring(0, 1000) : null
        });

        // =========================
        // PREPARE UPSTREAM
        // =========================
        const headers = { ...req.headers };
        delete headers.host;
        delete headers.connection;
        delete headers['content-length'];

        headers.host = TARGET_HOST;

        const auth = Buffer.from('MISC.API:@p1_2M@jee$').toString('base64');
        headers['Authorization'] = `Basic ${auth}`;

        const options = {
            hostname: TARGET_HOST,
            port: TARGET_PORT,
            path: pathUrl,
            method: req.method,
            headers,
            timeout: 30000,
            rejectUnauthorized: false,

            // DNS DEBUG
            lookup: (hostname, opts, cb) => {
                dns.lookup(hostname, opts, (err, address, family) => {
                    writeLog('DNS', {
                        traceId,
                        hostname,
                        address,
                        family,
                        error: err ? err.message : null
                    });
                    cb(err, address, family);
                });
            }
        };

        // =========================
        // UPSTREAM LOG
        // =========================
        writeLog('UPSTREAM', {
            traceId,
            stage: 'PROXY_TO_TARGET',
            target: {
                host: TARGET_HOST,
                port: TARGET_PORT,
                path: pathUrl,
                method: req.method
            },
            headersSent: headers
        });

        const proxyReq = https.request(options, (proxyRes) => {

            let responseBody = [];

            proxyRes.on('data', chunk => responseBody.push(chunk));

            proxyRes.on('end', () => {

                responseBody = Buffer.concat(responseBody).toString();

                writeLog('RESPONSE', {
                    traceId,
                    stage: 'TARGET_RESPONSE',
                    statusCode: proxyRes.statusCode,
                    durationMs: Date.now() - startTime,
                    headers: proxyRes.headers,
                    bodyPreview: responseBody.substring(0, 1000)
                });

                res.writeHead(proxyRes.statusCode, proxyRes.headers);
                res.end(responseBody);
            });
        });

        // =========================
        // ERRORS
        // =========================
        proxyReq.on('error', (err) => {

            writeLog('ERROR', {
                traceId,
                stage: 'UPSTREAM_ERROR',
                durationMs: Date.now() - startTime,
                message: err.message,
                code: err.code,
                stack: err.stack
            });

            res.writeHead(502, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                error: 'Proxy failed',
                traceId
            }));
        });

        proxyReq.on('timeout', () => {
            writeLog('ERROR', {
                traceId,
                stage: 'TIMEOUT',
                message: 'Upstream timeout'
            });

            proxyReq.destroy();
            res.writeHead(504);
            res.end('Gateway Timeout');
        });

        if (body) proxyReq.write(body);
        proxyReq.end();
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Proxy running on port ${PORT}`);
});
