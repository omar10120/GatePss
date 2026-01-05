/**
 * Sohar Port API Integration - Receive Operations (Inbound)
 * List Gate Passes
 * 
 * This file handles listing gate passes from Sohar Port with filtering and pagination.
 */

import { SoharPortHttpClient } from '../client';
import { ListGatePassesRequest, ListGatePassesResponse } from '../types';
import { getEndpointUrl } from '../config';
import { logSuccess, logError } from '../utils/logger';

/**
 * List gate passes from Sohar Port system with filters
 */
export async function listGatePasses(
    client: SoharPortHttpClient,
    request: ListGatePassesRequest = {}
): Promise<ListGatePassesResponse> {
    try {
        const params: Record<string, string | number> = {};

        if (request.status) params.status = request.status;
        if (request.requestType) params.requestType = request.requestType;
        if (request.dateFrom) params.dateFrom = request.dateFrom;
        if (request.dateTo) params.dateTo = request.dateTo;
        if (request.page) params.page = request.page;
        if (request.limit) params.limit = request.limit;
        if (request.searchQuery) params.search = request.searchQuery;

        logSuccess('listGatePasses', `Fetching gate passes with filters: ${JSON.stringify(params)}`);

        const response = await client.request<any>({
            method: 'GET',
            endpoint: getEndpointUrl('v1', 'LIST_GATE_PASSES'),
            params,
        });

        const result: ListGatePassesResponse = {
            success: true,
            statusCode: 200,
            message: 'Gate passes retrieved successfully',
            data: response.data?.map((item: any) => ({
                externalReference: item.externalReference || item.id,
                status: item.status,
                requestNumber: item.requestNumber,
                applicantName: item.applicantName,
                applicantEmail: item.applicantEmail,
                passportIdNumber: item.passportIdNumber,
                purposeOfVisit: item.purposeOfVisit,
                dateOfVisit: item.dateOfVisit,
                requestType: item.requestType,
                qrCodePdfUrl: item.qrCodePdfUrl,
                validFrom: item.validFrom,
                validUntil: item.validUntil,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
                metadata: item.metadata,
            })) || [],
            pagination: response.pagination || {
                page: request.page || 1,
                limit: request.limit || 20,
                total: response.total || 0,
                totalPages: Math.ceil((response.total || 0) / (request.limit || 20)),
            },
        };

        logSuccess('listGatePasses', `Retrieved ${result.data?.length || 0} gate passes`);

        return result;

    } catch (error: any) {
        logError('listGatePasses', error);

        return {
            success: false,
            statusCode: error.statusCode || 500,
            message: error.message || 'Failed to list gate passes',
            error: error.message,
        };
    }
}
