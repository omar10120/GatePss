import { createLogger, format, transports, Logger } from 'winston';
import path from 'path';
import fs from 'fs';

// Ensure log directory exists
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Development formatting (Pretty print)
const devFormat = format.combine(
  format.colorize(),
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.printf(({ level, message, timestamp, stack, ...meta }) => {
    return `${timestamp} ${level}: ${message} ${stack || ''} ${
      Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
    }`;
  })
);

// Production formatting (Structured JSON)
const prodFormat = format.combine(
  format.timestamp(),
  format.errors({ stack: true }),
  format.json()
);

const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Standard Next.js Logger using Winston
 */
export const logger: Logger = createLogger({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  format: isDevelopment ? devFormat : prodFormat,
  defaultMeta: { service: 'gate-pass-system' },
  transports: [
    // 1. Console transport (Standard for Next.js / Cloud environments)
    new transports.Console({
        handleExceptions: true,
    }),
    
    // 2. File transport (For persistent local logs on VPS/Laragon)
    // Note: This won't work on Vercel long-term, but is standard for VPS.
    new transports.File({ 
        filename: path.join(logDir, 'error.log'), 
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
    }),
    new transports.File({ 
        filename: path.join(logDir, 'combined.log'),
        maxsize: 5242880, // 5MB
        maxFiles: 5,
    }),
    new transports.File({ 
        filename: path.join(logDir, 'third-party.log'),
        name: 'third-party',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
    } as any),
  ],
  exitOnError: false, // Do not exit on handled exceptions
});

// Helper for masking sensitive data and truncating large strings
export function maskSensitiveData(data: any): any {
    if (!data) return data;
    
    if (typeof data === 'string') {
        // Truncate very long strings (like base64) to avoid memory/perf issues in logs
        if (data.length > 1000) {
            return data.substring(0, 100) + `... [TRUNCATED ${data.length} chars]`;
        }
        return data;
    }

    if (Array.isArray(data)) {
        return data.map(item => maskSensitiveData(item));
    }

    if (typeof data === 'object' && data !== null) {
        const sensitiveFields = ['authorization', 'x-api-key', 'password', 'token', 'secret', 'apiKey'];
        const masked: any = {};
        
        Object.keys(data).forEach(key => {
            const val = data[key];
            if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
                masked[key] = '***MASKED***';
            } else {
                masked[key] = maskSensitiveData(val);
            }
        });
        return masked;
    }
    
    return data;
}
