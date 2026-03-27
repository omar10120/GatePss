const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// =========================
// CONFIG
// =========================
const TARGET_HOST = 'uat-api.soharportandfreezone.om';
const TARGET_PORT = 443;
const LOG_FILE = path.join(__dirname, 'logs.txt');

// =========================
// LOGGER
// =========================
function log(data) {
    const line = JSON.stringify(data) + '\n';

    fs.appendFile(LOG_FILE, line, (err) => {
        if (err) console.error('Log write error:', err);
    });

    console.log(data);
}

// =========================
// SERVER
// =========================
const server = http.createServer((req, res) => {

    const startTime = Date.now();
    const requestId = Math.random().toString(36).substring(2, 10);

    let body = [];

    req.on('data', chunk => {
        body.push(chunk);
    });

    req.on('end', () => {

        body = Buffer.concat(body).toString();

        // =========================
        // REMOVE BASE PATH
        // =========================
        let pathUrl = req.url;

        if (pathUrl.startsWith('/gatepassproxy')) {
            pathUrl = pathUrl.replace('/gatepassproxy', '') || '/';
        }

        // =========================
        // LOG REQUEST
        // =========================
        log({
            type: 'REQUEST',
            requestId,
            time: new Date().toISOString(),
            method: req.method,
            url: req.url,
            forwardTo: pathUrl,
            headers: req.headers,
            body: body || null
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

        // =========================
        // REQUEST OPTIONS
        // =========================
        const options = {
            hostname: TARGET_HOST,
            port: TARGET_PORT,
            path: pathUrl,
            method: req.method,
            headers: headers,
            timeout: 30000,
            rejectUnauthorized: false
        };

        const proxyReq = https.request(options, (proxyRes) => {

            let responseBody = [];

            proxyRes.on('data', chunk => {
                responseBody.push(chunk);
            });

            proxyRes.on('end', () => {

                responseBody = Buffer.concat(responseBody).toString();

                const duration = Date.now() - startTime;

                // =========================
                // LOG RESPONSE
                // =========================
                log({
                    type: 'RESPONSE',
                    requestId,
                    status: proxyRes.statusCode,
                    duration: duration + 'ms',
                    headers: proxyRes.headers,
                    body: responseBody.substring(0, 1000) // limit for safety
                });

                res.writeHead(proxyRes.statusCode, proxyRes.headers);
                res.end(responseBody);
            });
        });

        proxyReq.on('error', (err) => {

            const duration = Date.now() - startTime;

            log({
                type: 'ERROR',
                requestId,
                duration: duration + 'ms',
                error: err.message,
                stack: err.stack
            });

            res.writeHead(502, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                error: 'Proxy failed',
                details: err.message
            }));
        });

        proxyReq.on('timeout', () => {

            log({
                type: 'TIMEOUT',
                requestId
            });

            proxyReq.destroy();

            res.writeHead(504);
            res.end('Gateway Timeout');
        });

        // =========================
        // SEND BODY
        // =========================
        if (body) {
            proxyReq.write(body);
        }

        proxyReq.end();
    });
});

// =========================
// START SERVER
// =========================
const PORT = process.env.PORT || 3000;

server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Proxy running on port ${PORT}`);
});