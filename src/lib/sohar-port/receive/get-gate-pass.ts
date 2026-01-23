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
 * Authentication: Basic Auth (username: SOHAR_PORT_USERNAME, password: SOHAR_PORT_PASSWORD)
 * 
 * Reference: docs/GatePass.postman_collection.json
 */

import { SoharPortHttpClient } from '../client';
import { GetGatePassRequest, GetGatePassResponse, GatePassStatus } from '../types';
import { getEndpointUrl } from '../config';
import { logSuccess, logError } from '../utils/logger';

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

        // Make GET request to Sohar Port API
        // Endpoint: /api/getpassdetails/get?passNumber={externalReference}&entity=port
        const response = await client.request<any>({
            method: 'GET',
            endpoint: getEndpointUrl('v1', 'GET_GATE_PASS'),
            params: {
                passNumber: request.externalReference.trim(),
                entity: 'port', // Always "port" as per API specification
            },
        });

        // Map API response to our internal structure
        // The API response structure may vary, so we handle multiple possible field names
        const mappedStatus = mapSoharStatusToInternal(response.status);
        const gatePassData = {
            externalReference: response.passNumber || response.externalReference || response.id || request.externalReference,
            status: mappedStatus || 'PENDING' as GatePassStatus, // Default to PENDING if status not found
            requestNumber: response.requestNumber || response.passNumber || request.externalReference,
            applicantName: response.name || response.applicantName || response.applicant_name,
            applicantEmail: response.email || response.applicantEmail || response.applicant_email,
            passportIdNumber: response.identification_number || response.passportIdNumber || response.passport_id_number,
            purposeOfVisit: response.reason_for_visit || response.purposeOfVisit || response.purpose_of_visit,
            dateOfVisit: response.date_of_visit || response.dateOfVisit,
            requestType: response.visitor_type || response.requestType || response.request_type,
            qrCodePdfUrl: response.qr_code_pdf_url || response.qrCodePdfUrl || response.qr_code_url,
            validFrom: response.start_date || response.validFrom || response.valid_from,
            validUntil: response.end_date || response.validUntil || response.valid_until || response.valid_to,
            createdAt: response.created_at || response.createdAt,
            updatedAt: response.updated_at || response.updatedAt,
            metadata: {
                ...response,
                // Preserve any additional fields from the API response
            },
        };

        const result: GetGatePassResponse = {
            success: true,
            statusCode: 200,
            message: 'Gate pass retrieved successfully',
            data: gatePassData,
        };

        logSuccess('getGatePass', `Gate pass retrieved: ${gatePassData.externalReference} (Status: ${gatePassData.status || 'N/A'})`);

        return result;

    } catch (error: any) {
        logError('getGatePass', error);

        // Handle different error types
        const statusCode = error.statusCode || error.response?.status || 500;
        const errorMessage = error.message || error.response?.data?.message || 'Failed to retrieve gate pass from Sohar Port';

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
