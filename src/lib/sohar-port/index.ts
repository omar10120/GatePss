/**
 * Sohar Port API Integration - Main Client
 * 
 * This is the main entry point for the Sohar Port API integration.
 * It provides a unified interface for both send and receive operations.
 */

import { SoharPortHttpClient } from './client';
import { SoharPortConfig } from './types';
import { validateConfig } from './config';

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
        this.config = {
            useMock: process.env.SOHAR_PORT_MOCK_MODE === 'true',
            ...config,
        };

        // Validate configuration
        validateConfig(this.config);

        // Initialize HTTP client
        this.httpClient = new SoharPortHttpClient(this.config);

        // Initialize send operations
        this.send = {
            createGatePass: this.config.useMock
                ? mockCreateGatePass
                : (request) => createGatePass(this.httpClient, request),
        };

        // Initialize receive operations
        this.receive = {
            getGatePass: this.config.useMock
                ? mockGetGatePass
                : (request) => getGatePass(this.httpClient, request),
            listGatePasses: this.config.useMock
                ? mockListGatePasses
                : (request) => listGatePasses(this.httpClient, request),
        };

        // Log initialization
        console.log(`🔧 Sohar Port Client initialized (Mode: ${this.config.useMock ? 'MOCK' : 'REAL'})`);
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
