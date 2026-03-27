const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// =========================
// CONFIG
// =========================
const TARGET_HOST = 'uat-api.soharportandfreezone.om';
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
// LOG ROTATION (keep 7 days)
// =========================
function cleanOldLogs() {
    const files = fs.readdirSync(LOG_DIR);
    const now = Date.now();

    files.forEach(file => {
        const filePath = path.join(LOG_DIR, file);
        const stat = fs.statSync(filePath);

        const ageDays = (now - stat.mtimeMs) / (1000 * 60 * 60 * 24);

        if (ageDays > 7) {
            fs.unlinkSync(filePath);
        }
    });
}

// run on startup
cleanOldLogs();

// =========================
// LOGGER
// =========================
function writeLog(type, data) {
    const date = getDate();

    const file =
        type === 'ERROR'
            ? `error-${date}.log`
            : `access-${date}.log`;

    const filePath = path.join(LOG_DIR, file);

    const logEntry = {
        ...data,
        type,
        timestamp: getTimestamp()
    };

    fs.appendFile(filePath, JSON.stringify(logEntry) + '\n', (err) => {
        if (err) console.error('Log write error:', err);
    });

    console.log(logEntry);
}

// =========================
// SERVER
// =========================
const server = http.createServer((req, res) => {

    const start = Date.now();

    // 🔥 TRACE ID (important)
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
        // REQUEST LOG
        // =========================
        writeLog('REQUEST', {
            traceId,
            method: req.method,
            url: req.url,
            forwardTo: pathUrl,
            headers: req.headers,
            body: body ? body.substring(0, 2000) : null
        });

        // =========================
        // HEADERS
        // =========================
        const headers = { ...req.headers };

        delete headers['host'];
        delete headers['connection'];
        delete headers['content-length'];

        headers['host'] = TARGET_HOST;

        const auth = Buffer.from('Majees.API:M@jee$@p1').toString('base64');
        headers['Authorization'] = `Basic ${auth}`;

        const options = {
            hostname: TARGET_HOST,
            port: TARGET_PORT,
            path: pathUrl,
            method: req.method,
            headers,
            timeout: 30000,
            rejectUnauthorized: false
        };

        const proxyReq = https.request(options, (proxyRes) => {

            let responseBody = [];

            proxyRes.on('data', chunk => responseBody.push(chunk));

            proxyRes.on('end', () => {

                responseBody = Buffer.concat(responseBody).toString();

                const duration = Date.now() - start;

                // =========================
                // RESPONSE LOG
                // =========================
                writeLog('RESPONSE', {
                    traceId,
                    status: proxyRes.statusCode,
                    duration: duration + 'ms',
                    headers: proxyRes.headers,
                    body: responseBody.substring(0, 1000)
                });

                res.writeHead(proxyRes.statusCode, proxyRes.headers);
                res.end(responseBody);
            });
        });

        proxyReq.on('error', (err) => {

            const duration = Date.now() - start;

            writeLog('ERROR', {
                traceId,
                duration: duration + 'ms',
                error: err.message,
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
                error: 'Timeout'
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