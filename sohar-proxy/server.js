const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const dns = require('dns');
const stream = require('stream');
const busboy = require('busboy');

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
/** Node 14–safe (no Readable.from) */
function bufferToStream(buf) {
    var r = new stream.Readable();
    r._read = function noop() {};
    r.push(buf);
    r.push(null);
    return r;
}

function getDate() {
    var now = new Date();
    return now.getFullYear() + '-' +
        String(now.getMonth() + 1).padStart(2, '0') + '-' +
        String(now.getDate()).padStart(2, '0');
}

function getTimestamp() {
    return new Date().toISOString();
}

function maskHeaders(h) {
    if (!h) return {};
    var out = {};
    Object.keys(h).forEach(function (key) {
        out[key] = String(key).toLowerCase() === 'authorization' ? '***MASKED***' : h[key];
    });
    return out;
}

// =========================
// LOG ROTATION (7 days)
// =========================
function cleanOldLogs() {
    var files = fs.readdirSync(LOG_DIR);
    var now = Date.now();

    files.forEach(function (file) {
        var filePath = path.join(LOG_DIR, file);
        var stat = fs.statSync(filePath);
        var ageDays = (now - stat.mtimeMs) / (1000 * 60 * 60 * 24);
        if (ageDays > 7) {
            fs.unlinkSync(filePath);
        }
    });
}

cleanOldLogs();

// =========================
// LOGGER
// =========================
function writeLog(level, data) {
    var date = getDate();
    var fileName = level === 'ERROR'
        ? 'error-' + date + '.log'
        : 'access-' + date + '.log';

    var filePath = path.join(LOG_DIR, fileName);

    var entry = {
        level: level,
        timestamp: getTimestamp()
    };

    if (data && typeof data === 'object') {
        Object.keys(data).forEach(function (k) {
            entry[k] = data[k];
        });
    }

    fs.appendFile(filePath, JSON.stringify(entry) + '\n', function (err) {
        if (err) console.error('Log write error:', err.message);
    });

    try {
        console.log(JSON.stringify(entry, null, 2));
    } catch (e) {
        console.log('[log stringify failed]', level, e.message);
    }
}

/**
 * Parse multipart body; returns { fields, files } where files[name] = { buffer, filename }
 */
function parseMultipart(buf, headers) {
    return new Promise(function (resolve, reject) {
        var fields = {};
        var files = {};
        var filePromises = [];

        var bb = busboy({
            headers: headers,
            limits: { fileSize: 15 * 1024 * 1024 },
        });

        bb.on('field', function (name, val) {
            fields[name] = val;
        });

        bb.on('file', function (name, file, info) {
            filePromises.push(new Promise(function (res, rej) {
                var chunks = [];
                file.on('data', function (d) {
                    chunks.push(d);
                });
                file.on('end', function () {
                    files[name] = {
                        buffer: Buffer.concat(chunks),
                        filename: info.filename || '',
                    };
                    res();
                });
                file.on('error', rej);
            }));
        });

        bb.on('finish', function () {
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

function buildSoharJsonFromMultipart(fields, files) {
    var meta = JSON.parse(fields.metadata || '{}');
    var out = {};
    Object.keys(meta).forEach(function (k) {
        out[k] = meta[k];
    });

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
var server = http.createServer(function (req, res) {

    var startTime = Date.now();

    var traceId =
        req.headers['x-trace-id'] ||
        Math.random().toString(36).substring(2, 12);

    var chunks = [];

    req.on('data', function (chunk) {
        chunks.push(chunk);
    });

    req.on('end', function () {

        var rawBodyBuffer = Buffer.concat(chunks);

        var fullUrl = req.url || '/';
        var queryIndex = fullUrl.indexOf('?');
        var pathOnly = queryIndex >= 0 ? fullUrl.slice(0, queryIndex) : fullUrl;
        var queryString = queryIndex >= 0 ? fullUrl.slice(queryIndex) : '';

        var pathUrl = pathOnly;
        if (pathUrl.indexOf('/gatepassproxy') === 0) {
            pathUrl = pathUrl.replace('/gatepassproxy', '') || '/';
        }

        var contentType = (req.headers['content-type'] || '').toLowerCase();
        var isMultipart = contentType.indexOf('multipart/form-data') !== -1;
        var isMultipartCreate = isMultipart && pathUrl === '/api/gatepass/post-multipart';

        var forwardPath = pathUrl === '/api/gatepass/post-multipart'
            ? '/api/gatepass/post'
            : pathUrl;

        var upstreamPath = forwardPath + queryString;

        var bodyPreview;
        if (isMultipart) {
            bodyPreview = '[multipart raw ' + rawBodyBuffer.length + ' bytes]';
        } else {
            bodyPreview = rawBodyBuffer.length
                ? rawBodyBuffer.toString('utf8').substring(0, 1000)
                : '';
        }

        writeLog('REQUEST', {
            traceId: traceId,
            stage: 'CLIENT_REQUEST',
            method: req.method,
            url: req.url,
            forwardTo: upstreamPath,
            clientIp: req.socket.remoteAddress,
            headers: req.headers,
            bodyPreview: bodyPreview,
        });

        function sendUpstream(outgoingBodyStr) {
            var headers = {};
            Object.keys(req.headers).forEach(function (k) {
                headers[k] = req.headers[k];
            });

            delete headers.host;
            delete headers.connection;
            delete headers['content-length'];
            delete headers['transfer-encoding'];

            headers.host = TARGET_HOST;
            headers['content-type'] = 'application/json; charset=utf-8';
            headers['content-length'] = Buffer.byteLength(outgoingBodyStr, 'utf8');

            var auth = Buffer.from('MISC.API:@p1_2M@jee$').toString('base64');
            headers['Authorization'] = 'Basic ' + auth;

            writeLog('UPSTREAM', {
                traceId: traceId,
                stage: 'PROXY_TO_TARGET',
                target: {
                    host: TARGET_HOST,
                    port: TARGET_PORT,
                    path: upstreamPath,
                    method: req.method,
                },
                headersSent: maskHeaders(headers),
            });

            var options = {
                hostname: TARGET_HOST,
                port: TARGET_PORT,
                path: upstreamPath,
                method: req.method,
                headers: headers,
                timeout: 30000,
                rejectUnauthorized: false,
                lookup: function (hostname, opts, cb) {
                    dns.lookup(hostname, opts, function (err, address, family) {
                        writeLog('DNS', {
                            traceId: traceId,
                            hostname: hostname,
                            address: address,
                            family: family,
                            error: err ? err.message : null,
                        });
                        cb(err, address, family);
                    });
                },
            };

            var proxyReq = https.request(options, function (proxyRes) {

                var responseChunks = [];

                proxyRes.on('data', function (chunk) {
                    responseChunks.push(chunk);
                });

                proxyRes.on('end', function () {

                    var responseBuffer = Buffer.concat(responseChunks);
                    var responseText = responseBuffer.toString();

                    writeLog('RESPONSE', {
                        traceId: traceId,
                        stage: 'TARGET_RESPONSE',
                        statusCode: proxyRes.statusCode,
                        durationMs: Date.now() - startTime,
                        headers: proxyRes.headers,
                        bodyPreview: responseText.substring(0, 1000),
                    });

                    res.writeHead(proxyRes.statusCode, proxyRes.headers);
                    res.end(responseBuffer);
                });
            });

            proxyReq.on('error', function (err) {

                writeLog('ERROR', {
                    traceId: traceId,
                    stage: 'UPSTREAM_ERROR',
                    durationMs: Date.now() - startTime,
                    message: err.message,
                    code: err.code,
                    stack: err.stack,
                });

                res.writeHead(502, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    error: 'Proxy failed',
                    traceId: traceId,
                }));
            });

            proxyReq.on('timeout', function () {
                writeLog('ERROR', {
                    traceId: traceId,
                    stage: 'TIMEOUT',
                    message: 'Upstream timeout',
                });

                proxyReq.destroy();
                res.writeHead(504);
                res.end('Gateway Timeout');
            });

            proxyReq.write(outgoingBodyStr, 'utf8');
            proxyReq.end();
        }

        if (isMultipartCreate) {
            parseMultipart(rawBodyBuffer, req.headers)
                .then(function (result) {
                    var payload = buildSoharJsonFromMultipart(result.fields, result.files);
                    var outgoingBodyStr = JSON.stringify(payload);
                    var fileSizesKb = {};
                    Object.keys(result.files).forEach(function (k) {
                        fileSizesKb[k] = Math.round(result.files[k].buffer.length / 1024);
                    });
                    writeLog('REQUEST', {
                        traceId: traceId,
                        stage: 'MULTIPART_ASSEMBLED',
                        forwardTo: forwardPath + queryString,
                        fileFields: Object.keys(result.files),
                        fileSizesKb: fileSizesKb,
                        assembledJsonBytes: Buffer.byteLength(outgoingBodyStr, 'utf8'),
                    });
                    sendUpstream(outgoingBodyStr);
                })
                .catch(function (err) {
                    writeLog('ERROR', {
                        traceId: traceId,
                        stage: 'MULTIPART_PARSE_ERROR',
                        message: err.message,
                        stack: err.stack,
                    });
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        error: 'Invalid multipart or metadata JSON',
                        traceId: traceId,
                    }));
                });
            return;
        }

        if (isMultipart) {
            writeLog('ERROR', {
                traceId: traceId,
                stage: 'BAD_MULTIPART_PATH',
                pathUrl: pathUrl,
                message: 'multipart only supported for /api/gatepass/post-multipart',
            });
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                error: 'multipart only supported for /api/gatepass/post-multipart',
                traceId: traceId,
            }));
            return;
        }

        var outgoingBodyStr = rawBodyBuffer.length ? rawBodyBuffer.toString('utf8') : '';
        sendUpstream(outgoingBodyStr);
    });
});

var PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', function () {
    console.log('Proxy running on port ' + PORT);
});
