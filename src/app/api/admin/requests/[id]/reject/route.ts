import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/middleware/api';
import prisma from '@/lib/prisma';
import { sendRequestRejectionEmail } from '@/lib/email';
import { ActionType } from '@/lib/enums';
import { createRequestNotifications } from '@/utils/notification-helper';

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

            const body = await req.json();
            const { rejectionReason } = body;

            // Validate rejection reason - BRD requirement: minimum 10 characters
            if (!rejectionReason || rejectionReason.trim().length < 10) {
                return NextResponse.json(
                    { error: 'Validation Error', message: 'Rejection reason is required (minimum 10 characters)' },
                    { status: 400 }
                );
            }

            // Get the request
            const gateRequest = await prisma.request.findUnique({
                where: { id: requestId },
            });

            if (!gateRequest) {
                return NextResponse.json(
                    { error: 'Not Found', message: 'Request not found' },
                    { status: 404 }
                );
            }

            // BRD requirement: Only pending requests can be rejected
            if (gateRequest.status !== 'PENDING') {
                return NextResponse.json(
                    { error: 'Invalid Operation', message: 'Only pending requests can be rejected' },
                    { status: 400 }
                );
            }

            // Reject the request
            const rejectedRequest = await prisma.request.update({
                where: { id: requestId },
                data: {
                    status: 'REJECTED',
                    rejectionReason: rejectionReason.trim(),
                    approvedById: user.userId, // Track who rejected it
                },
            });

            // Log the rejection
            await prisma.activityLog.create({
                data: {
                    userId: user.userId,
                    actionType: ActionType.REQUEST_MANAGEMENT,
                    actionPerformed: `Rejected request ${gateRequest.requestNumber}`,
                    affectedEntityType: 'REQUEST',
                    affectedEntityId: requestId,
                    details: JSON.stringify({
                        rejectedBy: user.email,
                        rejectionReason: rejectionReason.trim(),
                    }),
                },
            });

            // Create notifications for all admins (async, don't wait)
            createRequestNotifications(
                ActionType.REQUEST_MANAGEMENT,
                `Rejected request ${gateRequest.requestNumber}`,
                'REQUEST',
                requestId,
                user.userId
            ).catch(err => console.error('Failed to create notifications:', err));

            // Send rejection email to applicant (async)
            sendRequestRejectionEmail(
                gateRequest.applicantEmail,
                gateRequest.applicantNameEn,
                gateRequest.requestNumber,
                rejectionReason.trim()
            ).catch(err => console.error('Failed to send rejection email:', err));

            return NextResponse.json({
                success: true,
                message: 'Request rejected successfully',
                data: rejectedRequest,
            });

        } catch (error: any) {
            console.error('Error rejecting request:', error);
            return NextResponse.json(
                { error: 'Internal Server Error', message: 'Failed to reject request' },
                { status: 500 }
            );
        }
    });
}
