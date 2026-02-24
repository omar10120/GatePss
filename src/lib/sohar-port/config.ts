/**
 * Sohar Port API Integration - Configuration
 * 
 * This file contains configuration constants and environment variable handling.
 */

import { ApiVersion, SoharPortConfig } from './types';

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: Required<SoharPortConfig> = {
    baseUrl: process.env.SOHAR_PORT_API_URL || 'https://uat-api.soharportandfreezone.om',
    apiKey: process.env.SOHAR_PORT_API_KEY || '',
    version: (process.env.SOHAR_PORT_API_VERSION as ApiVersion) || 'v1',
    timeout: parseInt(process.env.SOHAR_PORT_TIMEOUT || '30000', 10),
    useMock: process.env.SOHAR_PORT_MOCK_MODE === 'true',
    retryAttempts: 3,
    retryDelay: 1000, // 1 second
    // Basic Auth credentials
    username: process.env.SOHAR_PORT_USERNAME || 'Majees.API',
    password: process.env.SOHAR_PORT_PASSWORD || '',
    // Connection Proxy
    proxyUrl: process.env.SOHAR_PORT_PROXY_URL || '',
};

/**
 * API endpoint paths for different versions
 */
export const API_ENDPOINTS = {
    v1: {
        // Send operations
        CREATE_GATE_PASS: '/api/gatepass/post',
        UPDATE_GATE_PASS: '/api/gatepass/update',
        CANCEL_GATE_PASS: '/api/gatepass/cancel',

        // Receive operations
        GET_GATE_PASS: '/api/getpassdetails/get',
        LIST_GATE_PASSES: '/api/gatepass/list',
        GET_STATUS: '/api/gatepass/status',
    },
    v2: {
        // Future version endpoints
        CREATE_GATE_PASS: '/api/gatepass/post',
        UPDATE_GATE_PASS: '/api/gatepass/update',
        CANCEL_GATE_PASS: '/api/gatepass/cancel',
        GET_GATE_PASS: '/api/getpassdetails/get',
        LIST_GATE_PASSES: '/api/gatepass/list',
        GET_STATUS: '/api/gatepass/status',
        BATCH_CREATE: '/api/gatepass/batch',
    },
};

/**
 * HTTP status codes
 */
export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
} as const;

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
    NETWORK_ERROR: 'Failed to connect to Sohar Port API',
    TIMEOUT_ERROR: 'Request to Sohar Port API timed out',
    AUTH_ERROR: 'Authentication failed with Sohar Port API',
    VALIDATION_ERROR: 'Invalid request data',
    NOT_FOUND: 'Gate pass not found in Sohar Port system',
    UNKNOWN_ERROR: 'An unknown error occurred',
} as const;

/**
 * Get configuration with overrides
 */
export function getConfig(overrides?: Partial<SoharPortConfig>): Required<SoharPortConfig> {
    return {
        ...DEFAULT_CONFIG,
        ...overrides,
    };
}

/**
 * Get endpoint URL with parameters replaced
 */
export function getEndpointUrl(
    version: ApiVersion,
    endpoint: keyof typeof API_ENDPOINTS.v1,
    params?: Record<string, string>
): string {
    let url = API_ENDPOINTS[version][endpoint];

    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            url = url.replace(`:${key}`, value);
        });
    }

    return url;
}

/**
 * Validate configuration
 */
export function validateConfig(config: SoharPortConfig): void {
    if (!config.useMock) {
        if (!config.baseUrl) {
            throw new Error('SOHAR_PORT_API_URL is required when not in mock mode');
        }
        if (!config.username || !config.password) {
            throw new Error('SOHAR_PORT_USERNAME and SOHAR_PORT_PASSWORD are required when not in mock mode');
        }
    }
}
