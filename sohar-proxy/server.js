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

function safeJsonParse(text) {
    if (!text) return null;
    try {
        return JSON.parse(text);
    } catch (error) {
        return null;
    }
}

function extractAttributes(parsedBody, maskLargeStrings = false) {
    if (!parsedBody || typeof parsedBody !== 'object') return null;

    const payload = parsedBody.gatePass || parsedBody.payload || parsedBody.data || parsedBody;
    if (!payload || typeof payload !== 'object') return null;

    const result = {};
    Object.entries(payload).forEach(([key, value]) => {
        if (value === null || value === undefined) return;
        if (maskLargeStrings && typeof value === 'string' && value.length > 500) {
            result[key] = `[string:${value.length}]`;
            return;
        }
        result[key] = value;
    });

    return result;
}

function validateSoharPayload(attributes) {
    if (!attributes || typeof attributes !== 'object') {
        return { ok: false, errors: ['Payload is missing or invalid JSON object'] };
    }

    const errors = [];
    const requiredFields = [
        'pass_type',
        'months_validity',
        'pass_for',
        'company',
        'name',
        'phone',
        'name_in_arabic',
        'email',
        'identification_type',
        'identification_number',
        'blood_type',
        'start_date',
        'end_date',
        'reason_for_visit',
        'api_used_by',
        'citizenship',
        'professions',
        'gender'
    ];

    requiredFields.forEach((field) => {
        if (attributes[field] === undefined || attributes[field] === null || attributes[field] === '') {
            errors.push(`Missing or empty required field: ${field}`);
        }
    });

    const passType = String(attributes.pass_type || '');
    const passFor = String(attributes.pass_for || '');
    const monthsValidity = attributes.months_validity;
    const monthsValidityString = monthsValidity === undefined || monthsValidity === null
        ? ''
        : String(monthsValidity);

    if (passType !== '1' && passType !== '2') {
        errors.push('pass_type must be "1" (permanent) or "2" (temporary)');
    }

    if (passType === '1') {
        if (!['2', '3', '4'].includes(passFor)) {
            errors.push('For pass_type=1, pass_for must be one of [2,3,4]');
        }
        if (monthsValidityString !== '') {
            errors.push('For pass_type=1, months_validity must be an empty string');
        }
    }

    if (passType === '2') {
        if (!['1', '2', '3'].includes(passFor)) {
            errors.push('For pass_type=2, pass_for must be one of [1,2,3]');
        }
        if (!['1', '2', '3', '4', '5', '10', '30', '60', '90'].includes(monthsValidityString)) {
            errors.push('For pass_type=2, months_validity must be one of [1,2,3,4,5,10,30,60,90]');
        }
    }

    return {
        ok: errors.length === 0,
        errors
    };
}

function normalizeBase64Value(value) {
    if (typeof value !== 'string') return '';
    const trimmed = value.trim();
    const dataUrlMatch = trimmed.match(/^data:[^;]+;base64,(.+)$/i);
    const raw = dataUrlMatch ? dataUrlMatch[1] : trimmed;
    return raw.replace(/\s+/g, '');
}

function detectImageType(buffer) {
    if (!buffer || buffer.length < 4) return 'unknown';
    const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
    const isPdf = buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;
    if (isJpeg) return 'jpeg';
    if (isPng) return 'png';
    if (isPdf) return 'pdf';
    return 'unknown';
}

function validateBase64Attachment(name, value) {
    if (value === undefined || value === null || value === '') {
        return { name, present: false, ok: true, errors: [] };
    }

    const normalized = normalizeBase64Value(value);
    const errors = [];

    if (!normalized) {
        errors.push('Empty base64 after normalization');
        return { name, present: true, ok: false, errors };
    }

    if (normalized.length % 4 !== 0) {
        errors.push('Base64 length is not divisible by 4');
    }

    if (!/^[A-Za-z0-9+/=]+$/.test(normalized)) {
        errors.push('Base64 has invalid characters');
    }

    let buffer = null;
    try {
        buffer = Buffer.from(normalized, 'base64');
    } catch (error) {
        errors.push(`Base64 decode error: ${error.message}`);
    }

    if (!buffer || buffer.length === 0) {
        errors.push('Decoded buffer is empty');
    }

    const mime = detectImageType(buffer);
    if (name.includes('photo') || name.includes('identification')) {
        if (!['jpeg', 'png'].includes(mime)) {
            errors.push(`Decoded file is not JPEG/PNG (detected: ${mime})`);
        }
    }

    return {
        name,
        present: true,
        ok: errors.length === 0,
        mime,
        decodedBytes: buffer ? buffer.length : 0,
        base64Length: normalized.length,
        errors
    };
}

function validateAttachmentFields(attributes) {
    if (!attributes || typeof attributes !== 'object') {
        return { ok: false, errors: ['Cannot validate attachments without payload attributes'] };
    }

    const checks = [
        validateBase64Attachment('identification_attachment', attributes.identification_attachment),
        validateBase64Attachment('photo_attachment', attributes.photo_attachment),
        validateBase64Attachment('other_attachment', attributes.other_attachment),
        validateBase64Attachment('other_attachment2', attributes.other_attachment2)
    ];

    const errors = checks.flatMap((check) => check.errors.map((msg) => `${check.name}: ${msg}`));
    return {
        ok: errors.length === 0,
        errors,
        checks
    };
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

    let chunks = [];

    req.on('data', chunk => chunks.push(chunk));

    req.on('end', () => {

        const rawBodyBuffer = Buffer.concat(chunks);
        const body = rawBodyBuffer.toString('utf8');
        const parsedBody = safeJsonParse(body);
        const rawAttributes = extractAttributes(parsedBody, false);
        const logAttributes = extractAttributes(parsedBody, true);
        const validation = validateSoharPayload(rawAttributes);
        const attachmentValidation = validateAttachmentFields(rawAttributes);

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
            bodyIsJson: Boolean(parsedBody),
            attributes: logAttributes
        });

        writeLog(validation.ok ? 'REQUEST' : 'ERROR', {
            traceId,
            stage: 'REQUEST_VALIDATION',
            validation
        });

        writeLog(attachmentValidation.ok ? 'REQUEST' : 'ERROR', {
            traceId,
            stage: 'ATTACHMENT_VALIDATION',
            attachmentValidation
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

        if (rawBodyBuffer.length > 0) proxyReq.write(rawBodyBuffer);
        proxyReq.end();
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Proxy running on port ${PORT}`);
});
