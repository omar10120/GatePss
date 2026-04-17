const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const stream = require('stream');
const busboy = require('busboy');

/** One-shot readable stream from a Buffer (Node 14–safe; avoids Readable.from quirks) */
function bufferToStream(buf) {
    var r = new stream.Readable();
    r._read = function noop() {};
    r.push(buf);
    r.push(null);
    return r;
}

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

/**
 * Parse multipart body; returns { fields, files } where files[name] = { buffer, filename }
 */
function parseMultipart(buf, headers) {
    return new Promise((resolve, reject) => {
        const fields = {};
        const files = {};
        const filePromises = [];

        const bb = busboy({
            headers,
            limits: { fileSize: 15 * 1024 * 1024 },
        });

        bb.on('field', (name, val) => {
            fields[name] = val;
        });

        bb.on('file', (name, file, info) => {
            filePromises.push(
                new Promise((res, rej) => {
                    const chunks = [];
                    file.on('data', (d) => chunks.push(d));
                    file.on('end', () => {
                        files[name] = {
                            buffer: Buffer.concat(chunks),
                            filename: info.filename || '',
                        };
                        res();
                    });
                    file.on('error', rej);
                })
            );
        });

        bb.on('finish', function onBusboyFinish() {
            Promise.all(filePromises)
                .then(function () {
                    resolve({ fields: fields, files: files });
                })
                .catch(reject);
        });

        bb.on('error', reject);
        bufferToStream(buf).pipe(bb);
    });
}

/**
 * Merge metadata JSON + binary parts into Sohar gate pass JSON (base64 fields)
 */
function buildSoharJsonFromMultipart(fields, files) {
    const meta = JSON.parse(fields.metadata || '{}');
    const out = { ...meta };

    if (files.identification_file && files.identification_file.buffer.length) {
        out.identification_attachment = files.identification_file.buffer.toString('base64');
        if (!out.identification_document && files.identification_file.filename) {
            out.identification_document = path.basename(files.identification_file.filename);
        }
    }

    if (files.photo_file && files.photo_file.buffer.length) {
        out.photo_attachment = files.photo_file.buffer.toString('base64');
        if (!out.photo && files.photo_file.filename) {
            out.photo = path.basename(files.photo_file.filename);
        }
    } else if (out.photo && out.identification_attachment) {
        out.photo_attachment = out.identification_attachment;
    }

    if (files.other_file_1 && files.other_file_1.buffer.length) {
        out.other_attachment = files.other_file_1.buffer.toString('base64');
        if (!out.other_documents && files.other_file_1.filename) {
            out.other_documents = path.basename(files.other_file_1.filename);
        }
    }

    if (files.other_file_2 && files.other_file_2.buffer.length) {
        out.other_attachment2 = files.other_file_2.buffer.toString('base64');
        if (!out.other_documents2 && files.other_file_2.filename) {
            out.other_documents2 = path.basename(files.other_file_2.filename);
        }
    }

    return out;
}

// =========================
// SERVER
// =========================
const server = http.createServer((req, res) => {

    const start = Date.now();

    const traceId =
        req.headers['x-trace-id'] ||
        Math.random().toString(36).substring(2, 12);

    const bodyChunks = [];

    req.on('data', chunk => bodyChunks.push(chunk));

    req.on('end', async () => {

        const buf = Buffer.concat(bodyChunks);

        const fullUrl = req.url;
        const queryIndex = fullUrl.indexOf('?');
        const pathOnly = queryIndex >= 0 ? fullUrl.slice(0, queryIndex) : fullUrl;
        const queryString = queryIndex >= 0 ? fullUrl.slice(queryIndex) : '';

        let pathUrl = pathOnly;
        if (pathUrl.startsWith('/gatepassproxy')) {
            pathUrl = pathUrl.replace('/gatepassproxy', '') || '/';
        }

        const contentType = (req.headers['content-type'] || '').toLowerCase();
        const isMultipart = contentType.includes('multipart/form-data');
        const isMultipartCreate =
            isMultipart && pathUrl === '/api/gatepass/post-multipart';

        const forwardPath = pathUrl === '/api/gatepass/post-multipart'
            ? '/api/gatepass/post'
            : pathUrl;

        let outgoingBodyStr;
        let multipartSummary = null;

        try {
            if (isMultipartCreate) {
                const { fields, files } = await parseMultipart(buf, req.headers);
                const payload = buildSoharJsonFromMultipart(fields, files);
                outgoingBodyStr = JSON.stringify(payload);
                var fileSizesKb = {};
                Object.keys(files).forEach(function (k) {
                    fileSizesKb[k] = Math.round(files[k].buffer.length / 1024);
                });
                multipartSummary = {
                    fileFields: Object.keys(files),
                    fileSizesKb: fileSizesKb,
                };
            } else if (isMultipart) {
                writeLog('ERROR', { traceId, error: 'multipart only for /api/gatepass/post-multipart', pathUrl });
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    error: 'multipart only supported for /api/gatepass/post-multipart',
                    traceId,
                }));
                return;
            } else {
                outgoingBodyStr = buf.length ? buf.toString('utf8') : '';
            }
        } catch (err) {
            writeLog('ERROR', { traceId, error: err.message, stack: err.stack });
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                error: 'Invalid multipart or metadata JSON',
                traceId,
            }));
            return;
        }

        writeLog('REQUEST', {
            traceId,
            method: req.method,
            url: req.url,
            forwardTo: forwardPath,
            headers: req.headers,
            isMultipart: isMultipartCreate,
            multipartSummary,
            bodyPreview: isMultipartCreate
                ? '[multipart assembled to JSON]'
                : (outgoingBodyStr ? outgoingBodyStr.substring(0, 2000) : null),
        });

        const headers = { ...req.headers };

        delete headers['host'];
        delete headers['connection'];
        delete headers['content-length'];
        delete headers['transfer-encoding'];

        headers['host'] = TARGET_HOST;
        headers['content-type'] = 'application/json; charset=utf-8';
        headers['content-length'] = Buffer.byteLength(outgoingBodyStr, 'utf8');

        const auth = Buffer.from('MISC.API:@p1_2M@jee$').toString('base64');
        headers['Authorization'] = `Basic ${auth}`;

        const options = {
            hostname: TARGET_HOST,
            port: TARGET_PORT,
            path: forwardPath + queryString,
            method: req.method,
            headers,
            timeout: 30000,
            rejectUnauthorized: false,
        };

        const proxyReq = https.request(options, (proxyRes) => {

            let responseBody = [];

            proxyRes.on('data', chunk => responseBody.push(chunk));

            proxyRes.on('end', () => {

                responseBody = Buffer.concat(responseBody).toString();

                const duration = Date.now() - start;

                writeLog('RESPONSE', {
                    traceId,
                    status: proxyRes.statusCode,
                    duration: duration + 'ms',
                    headers: proxyRes.headers,
                    body: responseBody.substring(0, 1000),
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
                stack: err.stack,
            });

            res.writeHead(502, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                error: 'Proxy failed',
                traceId,
            }));
        });

        proxyReq.on('timeout', () => {

            writeLog('ERROR', {
                traceId,
                error: 'Timeout',
            });

            proxyReq.destroy();

            res.writeHead(504);
            res.end('Gateway Timeout');
        });

        proxyReq.write(outgoingBodyStr, 'utf8');
        proxyReq.end();
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Proxy running on port ${PORT}`);
});
