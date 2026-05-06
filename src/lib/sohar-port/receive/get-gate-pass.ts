/**
 * Sohar Port API Integration - Receive Operations (Inbound)
 * Get Gate Pass
 * 
 * This file handles receiving gate pass data from Sohar Port.
 * 
 * API Endpoint: GET /api/getpassdetails/get
 * Query Parameters:
 *   - passNumber: The external reference (Sohar Port pass number)
 *   - entity: Always "port"
 * 
 * Authentication: Basic Auth from env (SOHAR_PORT_USERNAME, SOHAR_PORT_PASSWORD). Entity: SOHAR_PORT_ENTITY (default port).
 * 
 * Reference: docs/GatePass.postman_collection.json
 */

import { SoharPortHttpClient } from '../client';
import { GetGatePassRequest, GetGatePassResponse, GatePassStatus, SoharPortNotFoundError, GatePassData } from '../types';
import { getEndpointUrl } from '../config';
import { logSuccess, logError } from '../utils/logger';
import { logger } from '../../logger';

const env = ((globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env) || {};

function getSoharEntity(): string {
    return env.SOHAR_PORT_ENTITY?.trim() || 'port';
}

/**
 * Get a single gate pass from Sohar Port system
 * 
 * @param client - The Sohar Port HTTP client instance
 * @param request - Request object containing externalReference (passNumber)
 * @returns Promise resolving to GetGatePassResponse with gate pass data
 * 
 * @example
 * ```typescript
 * const client = new SoharPortHttpClient();
 * const response = await getGatePass(client, {
 *   externalReference: '1963950-20260125'
 * });
 * ```
 */
export async function getGatePass(
    client: SoharPortHttpClient,
    request: GetGatePassRequest
): Promise<GetGatePassResponse> {
    try {
        // Validate request
        if (!request.externalReference || request.externalReference.trim() === '') {
            throw new Error('externalReference (passNumber) is required');
        }

        logSuccess('getGatePass', `Fetching gate pass: ${request.externalReference}`);

        const entity = getSoharEntity();

        // Make GET request to Sohar Port API
        // Endpoint: /api/getpassdetails/get?passNumber={externalReference}&entity={SOHAR_PORT_ENTITY}
        logger.info(`Sohar Port Get Gate Pass Request: ${request.externalReference}`, {
            type: 'SOHAR_PORT_GET_GATE_PASS_REQUEST',
            externalReference: request.externalReference,
            params: {
                passNumber: request.externalReference.trim(),
                entity,
            }
        });

        const response = await client.request<any>({
            method: 'GET',
            endpoint: getEndpointUrl('v1', 'GET_GATE_PASS'),
            params: {
                passNumber: request.externalReference.trim(),
                entity,
            },
            externalReference: request.externalReference,
        });

        // Log the raw response from Sohar Port
        logger.info(`Sohar Port Get Gate Pass Response: ${request.externalReference}`, {
            type: 'SOHAR_PORT_GET_GATE_PASS_RESPONSE',
            externalReference: request.externalReference,
            response,
        });

        // Map API response to our internal structure
        // The API response structure may vary, so we handle multiple possible field names
        const statusValue = response.status || response.PassStatus || response.externalStatus;
        const mappedStatus = mapSoharStatusToInternal(statusValue);
        const gatePassData: GatePassData = {
            externalReference: response.Barcode || response.PassNumber || request.externalReference,
            status: mappedStatus || 'PENDING' as GatePassStatus,
            metadata: {
                ...response,
            },
        };

        const result: GetGatePassResponse = {
            success: true,
            statusCode: 200,
            message: `Status is ${statusValue || 'PENDING'}`,
            data: gatePassData,
        };

        logSuccess('getGatePass', `Gate pass retrieved: ${gatePassData.externalReference} (Status: ${gatePassData.status || 'N/A'})`);

        return result;

    } catch (error: any) {
        logError('getGatePass', error);

        // Handle different error types
        const statusCode = error.statusCode || error.response?.status || 500;
        
        // Provide more descriptive error messages
        let errorMessage: string;
        if (error instanceof SoharPortNotFoundError) {
            errorMessage = `Gate pass not found in Sohar Port system. The pass number "${request.externalReference}" does not exist or has been removed.`;
        } else {
            const rawMessage = error.message || error.response?.data?.message || 'Failed to retrieve gate pass from Sohar Port';
            // If the message is just "NOT_FOUND", provide more context
            if (rawMessage === 'NOT_FOUND' || rawMessage.toUpperCase() === 'NOT_FOUND') {
                errorMessage = `Gate pass not found in Sohar Port system. The pass number "${request.externalReference}" does not exist or has been removed.`;
            } else {
                errorMessage = rawMessage;
            }
        }

        return {
            success: false,
            statusCode,
            message: errorMessage,
            error: errorMessage,
        };
    }
}

/**
 * Map Sohar Port API status values to internal GatePassStatus type
 * Handles various possible status formats from the API
 */
function mapSoharStatusToInternal(status: any): GatePassStatus | undefined {
    if (!status) return undefined;

    const statusStr = String(status).toUpperCase().trim();

    // Map common status variations
    const statusMap: Record<string, GatePassStatus> = {
        'PENDING': 'PENDING',
        'APPROVED': 'APPROVED',
        'REJECTED': 'REJECTED',
        'ACTIVE': 'ACTIVE',
        'EXPIRED': 'EXPIRED',
        'CANCELLED': 'CANCELLED',
        'CANCELED': 'CANCELLED', // Handle both spellings
        'INACTIVE': 'EXPIRED',
        'SUSPENDED': 'CANCELLED',
    };

    return statusMap[statusStr] || (statusStr as GatePassStatus);
}
