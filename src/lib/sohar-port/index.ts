/**
 * Sohar Port API Integration - Main Client
 * 
 * This is the main entry point for the Sohar Port API integration.
 * It provides a unified interface for both send and receive operations.
 */

import { SoharPortHttpClient } from './client';
import { SoharPortConfig } from './types';
import { validateConfig, getConfig } from './config';
import { logger } from '../logger';

// Send operations
import { createGatePass } from './send/create-gate-pass';

// Receive operations
import { getGatePass } from './receive/get-gate-pass';
import { listGatePasses } from './receive/list-gate-passes';

// Mock operations
import {
    mockCreateGatePass,
    mockGetGatePass,
    mockListGatePasses,
    seedMockData,
} from './mock';

// Types
import type {
    CreateGatePassRequest,
    CreateGatePassResponse,
    GetGatePassRequest,
    GetGatePassResponse,
    ListGatePassesRequest,
    ListGatePassesResponse,
} from './types';

/**
 * Main Sohar Port API Client
 * 
 * Provides a unified interface for interacting with Sohar Port's gate pass system.
 * Supports both real API calls and mock mode for testing.
 * 
 * @example
 * ```typescript
 * // Create client
 * const client = new SoharPortClient();
 * 
 * // Send data to Sohar Port
 * const response = await client.send.createGatePass({
 *     requestNumber: 'GP-123',
 *     applicantName: 'John Doe',
 *     // ... other fields
 * });
 * 
 * // Receive data from Sohar Port
 * const gatePass = await client.receive.getGatePass({
 *     externalReference: 'SP-123456'
 * });
 * ```
 */
export class SoharPortClient {
    private httpClient: SoharPortHttpClient;
    private config: SoharPortConfig;

    /**
     * Send operations (outbound to Sohar Port)
     */
    public send: {
        createGatePass: (request: CreateGatePassRequest) => Promise<CreateGatePassResponse>;
    };

    /**
     * Receive operations (inbound from Sohar Port)
     */
    public receive: {
        getGatePass: (request: GetGatePassRequest) => Promise<GetGatePassResponse>;
        listGatePasses: (request?: ListGatePassesRequest) => Promise<ListGatePassesResponse>;
    };

    constructor(config?: Partial<SoharPortConfig>) {
        this.config = getConfig({
            useMock: process.env.SOHAR_PORT_MOCK_MODE === 'true',
            ...config,
        });

        // Validate configuration
        validateConfig(this.config);

        // Initialize HTTP client
        this.httpClient = new SoharPortHttpClient(this.config);

        // Initialize send operations
        this.send = {
            createGatePass: async (request: CreateGatePassRequest) => {
                if (this.config.useMock) return mockCreateGatePass(request);
                return createGatePass(this.httpClient, request);
            },
        };

        // Initialize receive operations
        this.receive = {
            getGatePass: async (request: GetGatePassRequest) => {
                if (this.config.useMock) return mockGetGatePass(request);
                return getGatePass(this.httpClient, request);
            },
            listGatePasses: async (request?: ListGatePassesRequest) => {
                if (this.config.useMock) return mockListGatePasses(request);
                return listGatePasses(this.httpClient, request);
            },
        };

        // Log initialization
        logger.info(`Sohar Port Client initialized`, {
            mode: this.config.useMock ? 'MOCK' : 'REAL',
            baseUrl: this.config.baseUrl,
        });
    }

    /**
     * Check if client is in mock mode
     */
    public isMockMode(): boolean {
        return this.config.useMock || false;
    }

    /**
     * Get client configuration
     */
    public getConfig(): SoharPortConfig {
        return { ...this.config };
    }

    /**
     * Seed mock data (only works in mock mode)
     */
    public seedMockData(): void {
        if (this.config.useMock) {
            seedMockData();
        } else {
            console.warn('⚠️  seedMockData() can only be called in mock mode');
        }
    }
}

// Export everything
export * from './types';
export * from './config';
export { SoharPortHttpClient } from './client';

// Export for backward compatibility with old code
export {
    mockCreateGatePass as mockSoharPortIntegration,
} from './mock';
