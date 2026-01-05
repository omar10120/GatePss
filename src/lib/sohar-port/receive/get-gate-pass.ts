/**
 * Sohar Port API Integration - Receive Operations (Inbound)
 * Get Gate Pass
 * 
 * This file handles receiving gate pass data from Sohar Port.
 */

import { SoharPortHttpClient } from '../client';
import { GetGatePassRequest, GetGatePassResponse } from '../types';
import { getEndpointUrl } from '../config';
import { logSuccess, logError } from '../utils/logger';

/**
 * Get a single gate pass from Sohar Port system
 */
export async function getGatePass(
    client: SoharPortHttpClient,
    request: GetGatePassRequest
): Promise<GetGatePassResponse> {
    try {
        logSuccess('getGatePass', `Fetching gate pass ${request.externalReference}`);

        const response = await client.request<any>({
            method: 'GET',
            endpoint: getEndpointUrl('v1', 'GET_GATE_PASS', { ref: request.externalReference }),
        });

        const result: GetGatePassResponse = {
            success: true,
            statusCode: 200,
            message: 'Gate pass retrieved successfully',
            data: {
                externalReference: response.externalReference || response.id,
                status: response.status,
                requestNumber: response.requestNumber,
                applicantName: response.applicantName,
                applicantEmail: response.applicantEmail,
                passportIdNumber: response.passportIdNumber,
                purposeOfVisit: response.purposeOfVisit,
                dateOfVisit: response.dateOfVisit,
                requestType: response.requestType,
                qrCodePdfUrl: response.qrCodePdfUrl,
                validFrom: response.validFrom,
                validUntil: response.validUntil,
                createdAt: response.createdAt,
                updatedAt: response.updatedAt,
                metadata: response.metadata,
            },
        };

        logSuccess('getGatePass', `Gate pass retrieved: ${result.data?.externalReference}`);

        return result;

    } catch (error: any) {
        logError('getGatePass', error);

        return {
            success: false,
            statusCode: error.statusCode || 500,
            message: error.message || 'Failed to retrieve gate pass',
            error: error.message,
        };
    }
}
