import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const requestNumber = searchParams.get('requestNumber');

        if (!requestNumber || requestNumber.trim() === '') {
            return NextResponse.json(
                { error: 'Invalid Request', message: 'Request number is required' },
                { status: 400 }
            );
        }

        const gateRequest = await prisma.request.findUnique({
            where: { requestNumber: requestNumber.trim() },
            select: {
                id: true,
                requestNumber: true,
                status: true,
                externalReference: true,
                lastIntegrationStatusCode: true,
                lastIntegrationStatusMessage: true,
                rejectionReason: true,
            },
        });

        if (!gateRequest) {
            return NextResponse.json(
                { error: 'Not Found', message: 'Request not found' },
                { status: 404 }
            );
        }

        // Determine display status based on request status and integration status
        // PENDING or APPROVED (without externalReference) -> show "Under Review"
        // APPROVED with externalReference -> show "So-Approved"
        // REJECTED -> show "So-Rejected"
        let displayStatus = 'PENDING';
        if (gateRequest.status === 'APPROVED' && gateRequest.externalReference) {
            displayStatus = 'SO_APPROVED';
        } else if (gateRequest.status === 'REJECTED') {
            displayStatus = 'SO_REJECTED';
        } else if (gateRequest.status === 'APPROVED') {
            // Approved but not yet integrated with SOHAR
            displayStatus = 'APPROVED';
        } else {
            displayStatus = 'PENDING';
        }

        return NextResponse.json({
            success: true,
            data: {
                requestNumber: gateRequest.requestNumber,
                status: gateRequest.status,
                displayStatus,
                externalReference: gateRequest.externalReference,
                rejectionReason: gateRequest.rejectionReason,
            },
        });
    } catch (error: any) {
        console.error('Error checking request status:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', message: 'Failed to check request status' },
            { status: 500 }
        );
    }
}

