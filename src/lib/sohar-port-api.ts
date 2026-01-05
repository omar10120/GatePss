import axios from 'axios';
import prisma from './prisma';
import { ActionType } from '@prisma/client';

const SOHAR_PORT_API_URL = process.env.SOHAR_PORT_API_URL || '';
const SOHAR_PORT_API_KEY = process.env.SOHAR_PORT_API_KEY || '';

export interface SoharPortRequest {
    requestNumber: string;
    applicantName: string;
    applicantEmail: string;
    passportIdNumber: string;
    purposeOfVisit: string;
    dateOfVisit: string;
    requestType: string;
    extraFields?: any;
}

export interface SoharPortResponse {
    success: boolean;
    statusCode: number;
    message: string;
    externalReference?: string;
    qrCodePdfUrl?: string;
    error?: string;
}

export async function sendToSoharPort(
    requestId: number,
    requestData: SoharPortRequest
): Promise<SoharPortResponse> {
    try {
        console.log(`📤 Sending request ${requestData.requestNumber} to Sohar Port API...`);

        // Make API call to Sohar Port system
        const response = await axios.post(
            SOHAR_PORT_API_URL,
            {
                ...requestData,
                timestamp: new Date().toISOString(),
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SOHAR_PORT_API_KEY}`,
                    'X-API-Version': '1.0',
                },
                timeout: 30000, // 30 seconds timeout
            }
        );

        const result: SoharPortResponse = {
            success: true,
            statusCode: response.status,
            message: response.data.message || 'Request processed successfully',
            externalReference: response.data.referenceId || response.data.id,
            qrCodePdfUrl: response.data.qrCodePdfUrl,
        };

        // Log successful integration
        await prisma.activityLog.create({
            data: {
                actionType: ActionType.SYSTEM_INTEGRATION,
                actionPerformed: `Sohar Port API call successful for request ${requestData.requestNumber}`,
                affectedEntityType: 'REQUEST',
                affectedEntityId: requestId,
                details: JSON.stringify({
                    statusCode: result.statusCode,
                    message: result.message,
                    externalReference: result.externalReference,
                }),
            },
        });

        console.log(`✅ Sohar Port API call successful - Reference: ${result.externalReference}`);
        return result;

    } catch (error: any) {
        console.error('❌ Sohar Port API call failed:', error.message);

        const errorResponse: SoharPortResponse = {
            success: false,
            statusCode: error.response?.status || 500,
            message: error.response?.data?.message || error.message || 'API call failed',
            error: error.response?.data?.error || error.message,
        };

        // Log failed integration
        await prisma.activityLog.create({
            data: {
                actionType: ActionType.SYSTEM_INTEGRATION,
                actionPerformed: `Sohar Port API call failed for request ${requestData.requestNumber}`,
                affectedEntityType: 'REQUEST',
                affectedEntityId: requestId,
                details: JSON.stringify({
                    statusCode: errorResponse.statusCode,
                    message: errorResponse.message,
                    error: errorResponse.error,
                }),
            },
        });

        return errorResponse;
    }
}

// Mock function for testing without actual Sohar Port API
export async function mockSoharPortIntegration(
    requestId: number,
    requestData: SoharPortRequest
): Promise<SoharPortResponse> {
    console.log(`🧪 MOCK: Simulating Sohar Port API call for ${requestData.requestNumber}`);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Always succeed in mock mode for reliable testing
    const mockResponse: SoharPortResponse = {
        success: true,
        statusCode: 200,
        message: 'Gate pass created successfully (MOCK)',
        externalReference: `SP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        qrCodePdfUrl: `https://soharport.com/qr-codes/${requestData.requestNumber}.pdf`,
    };

    await prisma.activityLog.create({
        data: {
            actionType: ActionType.SYSTEM_INTEGRATION,
            actionPerformed: `MOCK: Sohar Port API call successful for request ${requestData.requestNumber}`,
            affectedEntityType: 'REQUEST',
            affectedEntityId: requestId,
            details: JSON.stringify(mockResponse),
        },
    });

    return mockResponse;
}
