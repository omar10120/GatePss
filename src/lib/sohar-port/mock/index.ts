/**
 * Sohar Port API Integration - Mock Implementation
 * 
 * This file contains mock implementations for testing without actual Sohar Port API.
 */

import {
    CreateGatePassRequest,
    CreateGatePassResponse,
    GetGatePassRequest,
    GetGatePassResponse,
    ListGatePassesRequest,
    ListGatePassesResponse,
    GatePassData,
} from '../types';
import { logSuccess } from '../utils/logger';

// Mock database for gate passes
const mockGatePasses: Map<string, GatePassData> = new Map();

/**
 * Generate mock external reference
 */
function generateMockReference(): string {
    return `SP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Mock: Create gate pass
 */
export async function mockCreateGatePass(
    request: CreateGatePassRequest
): Promise<CreateGatePassResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const externalReference = generateMockReference();

    // Store in mock database
    const gatePassData: GatePassData = {
        externalReference,
        status: 'ACTIVE',
        requestNumber: request.requestNumber,
        applicantName: request.applicantName,
        applicantEmail: request.applicantEmail,
        passportIdNumber: request.passportIdNumber,
        purposeOfVisit: request.purposeOfVisit,
        dateOfVisit: request.dateOfVisit,
        requestType: request.requestType,
        qrCodePdfUrl: `https://soharport.com/qr-codes/${request.requestNumber}.pdf`,
        validFrom: new Date().toISOString(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: request.extraFields,
    };

    mockGatePasses.set(externalReference, gatePassData);

    logSuccess('mockCreateGatePass', `Created mock gate pass: ${externalReference}`);

    return {
        success: true,
        statusCode: 200,
        message: 'Gate pass created successfully (MOCK)',
        externalReference,
        qrCodePdfUrl: gatePassData.qrCodePdfUrl,
    };
}

/**
 * Mock: Get gate pass
 */
export async function mockGetGatePass(
    request: GetGatePassRequest
): Promise<GetGatePassResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const gatePass = mockGatePasses.get(request.externalReference);

    if (!gatePass) {
        return {
            success: false,
            statusCode: 404,
            message: 'Gate pass not found (MOCK)',
            error: 'NOT_FOUND',
        };
    }

    logSuccess('mockGetGatePass', `Retrieved mock gate pass: ${request.externalReference}`);

    return {
        success: true,
        statusCode: 200,
        message: 'Gate pass retrieved successfully (MOCK)',
        data: gatePass,
    };
}

/**
 * Mock: List gate passes
 */
export async function mockListGatePasses(
    request: ListGatePassesRequest = {}
): Promise<ListGatePassesResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    let gatePasses = Array.from(mockGatePasses.values());

    // Apply filters
    if (request.status) {
        gatePasses = gatePasses.filter(gp => gp.status === request.status);
    }
    if (request.requestType) {
        gatePasses = gatePasses.filter(gp => gp.requestType === request.requestType);
    }
    if (request.searchQuery) {
        const query = request.searchQuery.toLowerCase();
        gatePasses = gatePasses.filter(gp =>
            gp.requestNumber.toLowerCase().includes(query) ||
            gp.applicantName.toLowerCase().includes(query) ||
            gp.passportIdNumber.toLowerCase().includes(query)
        );
    }

    // Apply pagination
    const page = request.page || 1;
    const limit = request.limit || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = gatePasses.slice(startIndex, endIndex);

    logSuccess('mockListGatePasses', `Retrieved ${paginatedData.length} mock gate passes`);

    return {
        success: true,
        statusCode: 200,
        message: 'Gate passes retrieved successfully (MOCK)',
        data: paginatedData,
        pagination: {
            page,
            limit,
            total: gatePasses.length,
            totalPages: Math.ceil(gatePasses.length / limit),
        },
    };
}

/**
 * Seed mock data for testing
 */
export function seedMockData(): void {
    const mockRequests: CreateGatePassRequest[] = [
        {
            requestNumber: 'GP-001',
            applicantName: 'John Doe',
            applicantEmail: 'john@example.com',
            passportIdNumber: 'AB123456',
            purposeOfVisit: 'Business Meeting',
            dateOfVisit: '2024-12-15',
            requestType: 'VISITOR',
        },
        {
            requestNumber: 'GP-002',
            applicantName: 'Jane Smith',
            applicantEmail: 'jane@example.com',
            passportIdNumber: 'CD789012',
            purposeOfVisit: 'Site Inspection',
            dateOfVisit: '2024-12-20',
            requestType: 'CONTRACTOR',
        },
    ];

    mockRequests.forEach(async (req) => {
        await mockCreateGatePass(req);
    });

    console.log('✅ Mock data seeded');
}
