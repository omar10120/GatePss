import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/middleware/api';
import prisma from '@/lib/prisma';
import { SoharPortClient } from '@/lib/sohar-port';
import { sendRequestApprovalEmail } from '@/lib/email';
import { ActionType } from '@/lib/enums';
import { formatDate } from '@/utils/helpers';
import { createRequestNotifications } from '@/utils/notification-helper';
import { logger } from '@/lib/logger';

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
        entityType?: string;
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
                if (body.updates.applicantNameEn !== undefined) updateData.applicantNameEn = body.updates.applicantNameEn.trim();
                if (body.updates.applicantNameAr !== undefined) updateData.applicantNameAr = body.updates.applicantNameAr.trim();
                if (body.updates.applicantEmail !== undefined) updateData.applicantEmail = body.updates.applicantEmail.toLowerCase().trim();
                if (body.updates.applicantPhone !== undefined) updateData.applicantPhone = body.updates.applicantPhone.trim();
                if (body.updates.passportIdNumber !== undefined) updateData.passportIdNumber = body.updates.passportIdNumber.toUpperCase().trim();
                if (body.updates.purposeOfVisit !== undefined) updateData.purposeOfVisit = body.updates.purposeOfVisit.trim();
                if (body.updates.dateOfVisit !== undefined) updateData.dateOfVisit = new Date(body.updates.dateOfVisit);
                if (body.updates.requestType !== undefined) updateData.requestType = body.updates.requestType;
                if (body.updates.entityType !== undefined) updateData.entityType = body.updates.entityType;
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
                applicantName: gateRequest.applicantNameEn || "",
                applicantEmail: gateRequest.applicantEmail,
                passportIdNumber: gateRequest.passportIdNumber,
                purposeOfVisit: gateRequest.purposeOfVisit,
                dateOfVisit: gateRequest.dateOfVisit.toISOString(),
                requestType: gateRequest.requestType as any,
                extraFields: {
                    passFor: gateRequest.passFor,
                    entityType: gateRequest.entityType,
                    gateRequest: gateRequest, // Pass full request object for mapping
                },
            });

            if (!apiResponse.success) {
                console.error('Sohar Port Integration Failed:', apiResponse);
                
                // Persist the failure status to the database so admins can see why it failed
                await prisma.request.update({
                    where: { id: requestId },
                    data: {
                        lastIntegrationStatusCode: apiResponse.statusCode,
                        lastIntegrationStatusMessage: apiResponse.message,
                    },
                });

                // API call failed - don't approve the request in the system status, but record the integration attempt
                return NextResponse.json(
                    {
                        error: 'Integration Error',
                        message: apiResponse.message || 'Failed to submit to Sohar Port system',
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
                    externalStatus: apiResponse.so_status,
                    lastIntegrationStatusCode: apiResponse.statusCode,
                    lastIntegrationStatusMessage: apiResponse.message,
                    qrCodePdfUrl: apiResponse.qrCodePdfUrl || null,
                } as any,
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

            // Create notifications for all admins (async, don't wait)
            // Notification for admin approval
            createRequestNotifications(
                ActionType.REQUEST_MANAGEMENT,
                `Approved request ${gateRequest.requestNumber}`,
                'REQUEST',
                requestId,
                user.userId,
                `تم الموافقة على الطلب ${gateRequest.requestNumber}`
            ).catch(err => console.error('Failed to create notifications:', err));

            // Notification for Sohar Port approval (if successful)
            if (apiResponse.success && apiResponse.statusCode === 200) {
                createRequestNotifications(
                    ActionType.SYSTEM_INTEGRATION,
                    `Sohar Approved the request of number ${gateRequest.requestNumber}`,
                    'REQUEST',
                    requestId,
                    user.userId,
                    `وافق صُحار على الطلب رقم ${gateRequest.requestNumber}`
                ).catch(err => console.error('Failed to create Sohar Port notifications:', err));
                // Send approval email to applicant (async)
                sendRequestApprovalEmail(
                    gateRequest.applicantEmail,
                    gateRequest.applicantNameEn || "",
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
            } else {
                createRequestNotifications(
                    ActionType.SYSTEM_INTEGRATION,
                    `Sohar Rejected the request of number ${gateRequest.requestNumber}`,
                    'REQUEST',
                    requestId,
                    user.userId,
                    `رفض صُحار الطلب رقم ${gateRequest.requestNumber}`
                ).catch(err => console.error('Failed to create Sohar Port notifications:', err));

                return NextResponse.json({
                    success: false,
                    message: 'Request not approved',
                    data: {
                        request: approvedRequest,
                    },
                });
            }


        } catch (error: any) {
            logger.error('Error approving request:', {
                requestId: id,
                message: error.message,
                stack: error.stack,
                userId: user.userId,
            });
            return NextResponse.json(
                { error: 'Internal Server Error', message: 'Failed to approve request', details: error.message },
                { status: 500 }
            );
        }
    });
}
