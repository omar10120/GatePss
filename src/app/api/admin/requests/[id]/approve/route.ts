import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/middleware/api';
import prisma from '@/lib/prisma';
import { SoharPortClient } from '@/lib/sohar-port';
import { sendRequestApprovalEmail } from '@/lib/email';
import { ActionType } from '@/lib/enums';
import { formatDate } from '@/utils/helpers';

interface ApproveRequestBody {
    updates?: {
        applicantNameEn?: string;
        applicantNameAr?: string;
        applicantEmail?: string;
        applicantPhone?: string;
        passportIdNumber?: string;
        purposeOfVisit?: string;
        dateOfVisit?: string;
        requestType?: string;
        passFor?: string;
    };
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    return requirePermission(request, 'MANAGE_REQUESTS', async (req, user) => {
        try {
            const requestId = parseInt(id);

            if (isNaN(requestId)) {
                return NextResponse.json(
                    { error: 'Invalid Request', message: 'Invalid request ID' },
                    { status: 400 }
                );
            }

            // Parse request body if present, otherwise use empty object
            let body: ApproveRequestBody = {};
            try {
                const contentType = req.headers.get('content-type');
                const contentLength = req.headers.get('content-length');
                if (contentType?.includes('application/json') && contentLength && parseInt(contentLength) > 0) {
                    body = await req.json();
                }
            } catch (error) {
                // If body parsing fails, continue with empty body
                console.warn('Failed to parse request body, continuing with empty body:', error);
            }

            // Get the request with uploads
            const gateRequest = await prisma.request.findUnique({
                where: { id: requestId },
                include: {
                    uploads: true,
                },
            });

            if (!gateRequest) {
                return NextResponse.json(
                    { error: 'Not Found', message: 'Request not found' },
                    { status: 404 }
                );
            }

            if (gateRequest.status !== 'PENDING') {
                return NextResponse.json(
                    { error: 'Invalid Operation', message: 'Only pending requests can be approved' },
                    { status: 400 }
                );
            }

            // Apply any last-minute edits if provided
            if (body.updates) {
                const updateData: any = {};
                if (body.updates.applicantNameEn) updateData.applicantNameEn = body.updates.applicantNameEn.trim();
                if (body.updates.applicantNameAr) updateData.applicantNameAr = body.updates.applicantNameAr.trim();
                if (body.updates.applicantEmail) updateData.applicantEmail = body.updates.applicantEmail.toLowerCase().trim();
                if (body.updates.applicantPhone) updateData.applicantPhone = body.updates.applicantPhone.trim();
                if (body.updates.passportIdNumber) updateData.passportIdNumber = body.updates.passportIdNumber.toUpperCase().trim();
                if (body.updates.purposeOfVisit) updateData.purposeOfVisit = body.updates.purposeOfVisit.trim();
                if (body.updates.dateOfVisit) updateData.dateOfVisit = new Date(body.updates.dateOfVisit);
                if (body.updates.requestType) updateData.requestType = body.updates.requestType;
                if (body.updates.passFor !== undefined) updateData.passFor = body.updates.passFor?.trim() || null;

                if (Object.keys(updateData).length > 0) {
                    await prisma.request.update({
                        where: { id: requestId },
                        data: updateData,
                    });

                    // Refresh the request data
                    const updatedRequest = await prisma.request.findUnique({
                        where: { id: requestId },
                    });
                    if (updatedRequest) {
                        Object.assign(gateRequest, updatedRequest);
                    }
                }
            }

            // Call Sohar Port API using new client architecture
            console.log(`Processing approval for request ${requestId}`);

            const soharPortClient = new SoharPortClient();
            console.log(`Sohar Port Client Mode: ${soharPortClient.isMockMode() ? 'MOCK' : 'REAL'}`);

            const apiResponse = await soharPortClient.send.createGatePass({
                requestNumber: gateRequest.requestNumber,
                applicantName: gateRequest.applicantNameEn,
                applicantEmail: gateRequest.applicantEmail,
                passportIdNumber: gateRequest.passportIdNumber,
                purposeOfVisit: gateRequest.purposeOfVisit,
                dateOfVisit: gateRequest.dateOfVisit.toISOString(),
                requestType: gateRequest.requestType as any,
                extraFields: {
                    passFor: gateRequest.passFor,
                    gateRequest: gateRequest, // Pass full request object for mapping
                },
            });

            if (!apiResponse.success) {
                console.error('Sohar Port Integration Failed:', apiResponse);
                // API call failed - don't approve the request
                return NextResponse.json(
                    {
                        error: 'Integration Error',
                        message: 'Failed to submit to Sohar Port system',
                        details: {
                            statusCode: apiResponse.statusCode,
                            apiMessage: apiResponse.message,
                            apiError: apiResponse.error,
                        },
                    },
                    { status: 500 }
                );
            }

            // API call successful - approve the request
            const approvedRequest = await prisma.request.update({
                where: { id: requestId },
                data: {
                    status: 'APPROVED',
                    approvedById: user.userId,
                    externalReference: apiResponse.externalReference,
                    lastIntegrationStatusCode: apiResponse.statusCode,
                    lastIntegrationStatusMessage: apiResponse.message,
                },
            });

            // Log the approval
            await prisma.activityLog.create({
                data: {
                    userId: user.userId,
                    actionType: ActionType.REQUEST_MANAGEMENT,
                    actionPerformed: `Approved request ${gateRequest.requestNumber}`,
                    affectedEntityType: 'REQUEST',
                    affectedEntityId: requestId,
                    details: JSON.stringify({
                        approvedBy: user.email,
                        externalReference: apiResponse.externalReference,
                        statusCode: apiResponse.statusCode,
                    }),
                },
            });

            // Send approval email to applicant (async)
            sendRequestApprovalEmail(
                gateRequest.applicantEmail,
                gateRequest.applicantNameEn,
                gateRequest.requestNumber,
                formatDate(gateRequest.dateOfVisit)
            ).catch(err => console.error('Failed to send approval email:', err));

            return NextResponse.json({
                success: true,
                message: 'Request approved successfully',
                data: {
                    request: approvedRequest,
                    integration: {
                        externalReference: apiResponse.externalReference,
                        statusCode: apiResponse.statusCode,
                        message: apiResponse.message,
                        qrCodePdfUrl: apiResponse.qrCodePdfUrl,
                    },
                },
            });

        } catch (error: any) {
            console.error('Error approving request:', error);
            return NextResponse.json(
                { error: 'Internal Server Error', message: 'Failed to approve request' },
                { status: 500 }
            );
        }
    });
}
