const http = require('http');
const https = require('https');

const TARGET_HOST = 'uat-api.soharportandfreezone.om';
const TARGET_PORT = 443;

const server = http.createServer((req, res) => {

    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.url}`);

    // 🔥 health check
    if (req.url === '/gatepassproxy' || req.url === '/gatepassproxy/test') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'OK',
            message: 'Proxy is running ✅'
        }));
        return;
    }

    // 🔥 remove base path
    let path = req.url;

    if (path.startsWith('/gatepassproxy')) {
        path = path.replace('/gatepassproxy', '') || '/';
    }

    console.log(`➡️ Forwarding to: ${path}`);

    const headers = { ...req.headers };

    delete headers['host'];
    delete headers['connection'];
    delete headers['content-length'];

    headers['host'] = TARGET_HOST;

    const options = {
        hostname: TARGET_HOST,
        port: TARGET_PORT,
        path: path,
        method: req.method,
        headers: headers,
        timeout: 30000
    };

    const proxyReq = https.request(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
        console.error('❌ Proxy Error:', err.message);

        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            error: 'Proxy failed',
            details: err.message
        }));
    });

    req.pipe(proxyReq);
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Proxy running on port ${PORT}`);
});