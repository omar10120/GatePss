import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Majis production mail — used when env / `.env` omit a value (password always from env).
 * On cPanel, connect to localhost; public hostname often times out (ETIMEDOUT) from the same box.
 */
export const SMTP_DEFAULTS = {
  host: '127.0.0.1',
  port: 465,
  user: 'info@gatepass.majis.om',
  from: 'info@gatepass.majis.om',
  /** TLS SNI / cert name when SMTP_HOST is 127.0.0.1 */
  tlsServername: 'gatepass.majis.om',
} as const;

/**
 * SMTP settings at runtime.
 * Reads `.env` from disk so values missing from the Next.js build bundle
 * (e.g. SMTP_HOST added after build) still work on cPanel/PM2 deploys.
 */
function parseDotEnvFile(filePath: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!existsSync(filePath)) {
    return out;
  }

  const content = readFileSync(filePath, 'utf8');
  for (const line of content) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const eq = trimmed.indexOf('=');
    if (eq <= 0) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

let cachedFileEnv: Record<string, string> | null = null;

function getFileEnv(): Record<string, string> {
  if (!cachedFileEnv) {
    cachedFileEnv = parseDotEnvFile(resolve(process.cwd(), '.env'));
  }
  return cachedFileEnv;
}

function readSmtpEnv(name: string): string | undefined {
  const fromProcess = process.env[name];
  const fromFile = getFileEnv()[name];
  const value =
    typeof fromProcess === 'string' && fromProcess.trim()
      ? fromProcess.trim()
      : fromFile?.trim();
  return value || undefined;
}

export function getSmtpHostSource(): 'process' | 'file' | 'default' | 'none' {
  if (process.env.SMTP_HOST?.trim()) {
    return 'process';
  }
  if (getFileEnv().SMTP_HOST?.trim()) {
    return 'file';
  }
  return SMTP_DEFAULTS.host ? 'default' : 'none';
}

export function getSmtpEnvConfig() {
  const portRaw = readSmtpEnv('SMTP_PORT');
  const port = Number.parseInt(portRaw || String(SMTP_DEFAULTS.port), 10);
  const resolvedPort = Number.isNaN(port) ? SMTP_DEFAULTS.port : port;

  const host = readSmtpEnv('SMTP_HOST') ?? SMTP_DEFAULTS.host;
  const skipVerifyEnv = readSmtpEnv('SMTP_SKIP_VERIFY');
  const isLocalHost =
    host === '127.0.0.1' || host === 'localhost' || host === '::1';

  return {
    host,
    user: readSmtpEnv('SMTP_USER') ?? SMTP_DEFAULTS.user,
    password: readSmtpEnv('SMTP_PASSWORD'),
    from:
      readSmtpEnv('EMAIL_FROM') ||
      readSmtpEnv('SMTP_USER') ||
      SMTP_DEFAULTS.from,
    port: resolvedPort,
    secure: resolvedPort === 465,
    /** cPanel local SMTP: default skip verify unless explicitly false */
    skipVerify:
      skipVerifyEnv === 'true' ||
      (skipVerifyEnv !== 'false' && isLocalHost),
    tlsRejectUnauthorized: readSmtpEnv('SMTP_TLS_REJECT_UNAUTHORIZED') !== 'false',
    tlsServername:
      readSmtpEnv('SMTP_TLS_SERVERNAME') ?? SMTP_DEFAULTS.tlsServername,
  };
}

/** For debug logs — which SMTP_* keys exist on process.env (not values). */
export function listSmtpEnvKeys(): string[] {
  return Object.keys(process.env).filter((k) => k.startsWith('SMTP_') || k === 'EMAIL_FROM');
}

/** Keys present in `.env` file on disk (names only). */
export function listSmtpFileKeys(): string[] {
  return Object.keys(getFileEnv()).filter((k) => k.startsWith('SMTP_') || k === 'EMAIL_FROM');
}
