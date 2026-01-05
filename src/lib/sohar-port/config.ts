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
    baseUrl: process.env.SOHAR_PORT_API_BASE_URL || 'https://api.soharport.com',
    apiKey: process.env.SOHAR_PORT_API_KEY || '',
    version: (process.env.SOHAR_PORT_API_VERSION as ApiVersion) || 'v1',
    timeout: parseInt(process.env.SOHAR_PORT_TIMEOUT || '30000', 10),
    useMock: process.env.SOHAR_PORT_MOCK_MODE === 'true',
    retryAttempts: 3,
    retryDelay: 1000, // 1 second
};

/**
 * API endpoint paths for different versions
 */
export const API_ENDPOINTS = {
    v1: {
        // Send operations
        CREATE_GATE_PASS: '/api/v1/gate-passes',
        UPDATE_GATE_PASS: '/api/v1/gate-passes/:ref',
        CANCEL_GATE_PASS: '/api/v1/gate-passes/:ref',

        // Receive operations
        GET_GATE_PASS: '/api/v1/gate-passes/:ref',
        LIST_GATE_PASSES: '/api/v1/gate-passes',
        GET_STATUS: '/api/v1/gate-passes/:ref/status',
    },
    v2: {
        // Future version endpoints
        CREATE_GATE_PASS: '/api/v2/gate-passes',
        UPDATE_GATE_PASS: '/api/v2/gate-passes/:ref',
        CANCEL_GATE_PASS: '/api/v2/gate-passes/:ref',
        GET_GATE_PASS: '/api/v2/gate-passes/:ref',
        LIST_GATE_PASSES: '/api/v2/gate-passes',
        GET_STATUS: '/api/v2/gate-passes/:ref/status',
        BATCH_CREATE: '/api/v2/gate-passes/batch',
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
            throw new Error('SOHAR_PORT_API_BASE_URL is required when not in mock mode');
        }
        if (!config.apiKey) {
            throw new Error('SOHAR_PORT_API_KEY is required when not in mock mode');
        }
    }
}
