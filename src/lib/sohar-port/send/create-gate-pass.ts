/**
 * Sohar Port API Integration - Send Operations (Outbound)
 * Create Gate Pass
 * 
 * This file handles sending gate pass creation requests to Sohar Port.
 */

import { SoharPortHttpClient } from '../client';
import { CreateGatePassRequest, CreateGatePassResponse } from '../types';
import { getEndpointUrl } from '../config';
import { logSuccess, logError } from '../utils/logger';

/**
 * Create a new gate pass in Sohar Port system
 */
export async function createGatePass(
    client: SoharPortHttpClient,
    request: CreateGatePassRequest
): Promise<CreateGatePassResponse> {
    try {
        logSuccess('createGatePass', `Creating gate pass for ${request.requestNumber}`);

        const response = await client.requestWithRetry<any>({
            method: 'POST',
            endpoint: getEndpointUrl('v1', 'CREATE_GATE_PASS'),
            data: {
                ...request,
                timestamp: new Date().toISOString(),
            },
        });

        const result: CreateGatePassResponse = {
            success: true,
            statusCode: 200,
            message: response.message || 'Gate pass created successfully',
            externalReference: response.referenceId || response.id || response.externalReference,
            qrCodePdfUrl: response.qrCodePdfUrl || response.qrCode,
        };

        logSuccess('createGatePass', `Gate pass created: ${result.externalReference}`);

        return result;

    } catch (error: any) {
        logError('createGatePass', error);

        return {
            success: false,
            statusCode: error.statusCode || 500,
            message: error.message || 'Failed to create gate pass',
            error: error.message,
        };
    }
}
