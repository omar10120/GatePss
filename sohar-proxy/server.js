const http = require('http');
const https = require('https');

// The Sohar Port API Target URL
const TARGET_HOST = 'uat-api.soharportandfreezone.om';
const TARGET_PORT = 443;

/**
 * Lightweight Proxy Server for Node.js 14+
 * No external dependencies required.
 */
const server = http.createServer((req, res) => {
    // Health check for the proxy itself
    if (req.url === '/' || req.url === '/test' || req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Sohar Proxy is Running! Node Version: ' + process.version);
        return;
    }

    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Incoming: ${req.method} ${req.url}`);

    // Filter headers to avoid conflicts
    const headers = { ...req.headers };
    delete headers['host'];
    delete headers['connection'];
    delete headers['keep-alive'];
    delete headers['content-length']; // Let https.request calculate it from the piped data or handle it
    
    headers['host'] = TARGET_HOST;

    const options = {
        hostname: TARGET_HOST,
        port: TARGET_PORT,
        path: req.url,
        method: req.method,
        headers: headers,
        timeout: 30000 // 30 seconds
    };

    const proxyReq = https.request(options, (proxyRes) => {
        console.log(`[${timestamp}] Target Response: ${proxyRes.statusCode}`);
        
        // Forward headers
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        
        proxyRes.pipe(res, { end: true });
    });

    proxyReq.on('error', (err) => {
        console.error(`[${timestamp}] Proxy Error:`, err.message);
        
        if (!res.headersSent) {
            res.writeHead(502, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                error: 'Proxy Error (Sohar not reachable)', 
                details: err.message 
            }));
        }
    });

    proxyReq.on('timeout', () => {
        console.error(`[${timestamp}] Proxy Timeout`);
        proxyReq.destroy();
        if (!res.headersSent) {
            res.writeHead(504);
            res.end('Gateway Timeout');
        }
    });

    // Pipe the request body
    req.pipe(proxyReq, { end: true });
});

// Start the server (cPanel usually manages the port, but 3000 is common)
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Proxy server running on port ${PORT}`);
    console.log(`Forwarding requests to: https://${TARGET_HOST}`);
});
