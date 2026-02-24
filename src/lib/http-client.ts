import { logger, maskSensitiveData } from './logger';
import { randomUUID } from 'crypto';

export interface HttpClientOptions extends RequestInit {
    requestId?: string;
    params?: Record<string, string>;
    timeout?: number;
}

/**
 * Standardized HTTP Client with automatic logging and sensitive data masking.
 * Similar to Laravel's HTTP client logging but for Next.js/Node.js.
 */
export async function httpClient(
    url: string,
    options: HttpClientOptions = {}
): Promise<Response> {
    const requestId = options.requestId || randomUUID();
    const start = Date.now();
    const method = options.method || 'GET';
    const body = options.body;

    // Mask sensitive headers for logging
    const safeHeaders = maskSensitiveData(options.headers || {});
    
    // Construct full URL with params if provided
    let fullUrl = url;
    if (options.params) {
        const queryParams = new URLSearchParams(options.params).toString();
        fullUrl += (fullUrl.includes('?') ? '&' : '?') + queryParams;
    }

    try {
        // Initial request log
        logger.info(`HTTP Request: ${method} ${fullUrl}`, {
            type: 'OUTBOUND_REQUEST',
            requestId,
            method,
            url: fullUrl,
            headers: safeHeaders,
            body: body ? (typeof body === 'string' ? JSON.parse(body) : body) : undefined,
        });

        // Add timeout support if specified
        let controller: AbortController | undefined;
        if (options.timeout) {
            controller = new AbortController();
            const timeoutId = setTimeout(() => controller?.abort(), options.timeout);
            options.signal = controller.signal;
            // Clear timeout after request finishes
        }

        const response = await fetch(fullUrl, options);
        const duration = Date.now() - start;

        // Clone response to read body without consuming it
        let responseBody: any;
        try {
            const tempResponse = response.clone();
            const text = await tempResponse.text();
            try {
                responseBody = JSON.parse(text);
            } catch {
                responseBody = text;
            }
        } catch (e) {
            responseBody = '[Unreadable Response Body]';
        }

        // Response log
        logger.info(`HTTP Response: ${response.status} ${fullUrl}`, {
            type: 'OUTBOUND_RESPONSE',
            requestId,
            url: fullUrl,
            status: response.status,
            statusText: response.statusText,
            duration: `${duration}ms`,
            responseBody: typeof responseBody === 'string' ? responseBody.slice(0, 2000) : responseBody,
        });

        return response;

    } catch (error: any) {
        const duration = Date.now() - start;

        // Error log
        logger.error(`HTTP Error: ${method} ${fullUrl}`, {
            type: 'OUTBOUND_ERROR',
            requestId,
            url: fullUrl,
            method,
            message: error.message,
            stack: error.stack,
            duration: `${duration}ms`,
        });

        throw error;
    }
}
