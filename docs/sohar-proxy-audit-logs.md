# PHP gate pass proxy — audit logging

Server path: `gatepassproxy/` (Apache routes here via `.htaccess`).

## Bootstrap hits (runs before any other proxy logic)

- **`logs/hit-YYYY-MM-DD.log`** — append per request  
- **`proxy-last-hit.json`** — next to `index.php`, overwritten each request (easy to spot in File Manager)  
- **`hit-fallback.log`** — only if `logs/` is not writable  

If **none** of these change when you call the proxy URL, the request **never reaches** `index.php` (fix root `.htaccess` / domain). If **`error_log`** on the server shows `[gatepassproxy] bootstrap write failed`, fix **permissions** on `gatepassproxy/` (owner + chmod).

## JSON lines (`logs/access-YYYY-MM-DD.log`, `logs/error-YYYY-MM-DD.log`)

Each request logs:

- **`REQUEST`**: routing, query params, client headers (safe), **`incomingMetadataPath`**, **`incomingAttachments`** (multipart), **`incomingJsonBodyPath`** (plain JSON POST).
- **`RESPONSE`**: HTTP status, **`curlInfo`** (timing, IP, TLS), **`upstreamResponseHeaders`** (parsed), **`upstreamArtifactMetaPath`** / **`upstreamArtifactBodyPath`** (saved dump).

## Saved files (when `SAVE_INCOMING_PAYLOADS` is true in `index.php`)

| Location | Contents |
|----------|-----------|
| `logs/incoming/{traceId}/metadata.json` | Raw `metadata` field from multipart |
| `logs/incoming/{traceId}/request-body.json` | Raw JSON body for non-multipart POST |
| `logs/incoming/{traceId}/{field}_{filename}` | Copy of each uploaded multipart file (`sha256` in JSON log) |
| `logs/upstream-responses/{YYYY-MM-DD}/{traceId}.meta.json` | Upstream curl metadata + parsed response headers |
| `logs/upstream-responses/{YYYY-MM-DD}/{traceId}.body.txt` | Upstream body (max **512 KB**; see `UPSTREAM_RESPONSE_BODY_FILE_MAX`) |

Older than ~7 days: log lines and folders under `incoming/` and dated `upstream-responses/*` are pruned on each request.

## Security

- `logs/.htaccess` denies HTTP access to these paths on Apache.
- Disable payload saving in production if disk or privacy is a concern: set `SAVE_INCOMING_PAYLOADS` to `false` in `index.php`.
