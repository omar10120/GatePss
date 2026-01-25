import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/middleware/api';
import prisma from '@/lib/prisma';
import { createRequestNotifications } from '@/utils/notification-helper';
import { ActionType } from '@/lib/enums';

export async function GET(
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

            const gateRequest = await prisma.request.findUnique({
                where: { id: requestId },
                include: {
                    approvedBy: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                    uploads: true,
                },
            });

            if (!gateRequest) {
                return NextResponse.json(
                    { error: 'Not Found', message: 'Request not found' },
                    { status: 404 }
                );
            }

            // Fetch logs separately since we decoupled the relation
            const logs = await prisma.activityLog.findMany({
                where: {
                    affectedEntityType: 'REQUEST',
                    affectedEntityId: requestId,
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
                orderBy: {
                    timestamp: 'desc',
                },
                take: 10,
            });

            return NextResponse.json({
                success: true,
                data: {
                    ...gateRequest,
                    logs,
                },
            });

        } catch (error: any) {
            console.error('Error fetching request:', error);
            return NextResponse.json(
                { error: 'Internal Server Error', message: 'Failed to fetch request details' },
                { status: 500 }
            );
        }
    });
}

export async function PUT(
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

            // Check if request exists and is pending
            const existingRequest = await prisma.request.findUnique({
                where: { id: requestId },
            });

            if (!existingRequest) {
                return NextResponse.json(
                    { error: 'Not Found', message: 'Request not found' },
                    { status: 404 }
                );
            }

            // Allow editing for all statuses (removed restriction)

            // Update allowed fields
            const updateData: any = {};

            if (body.applicantNameEn) updateData.applicantNameEn = body.applicantNameEn.trim();
            if (body.applicantNameAr) updateData.applicantNameAr = body.applicantNameAr.trim();
            if (body.applicantEmail) updateData.applicantEmail = body.applicantEmail.toLowerCase().trim();
            if (body.applicantPhone) updateData.applicantPhone = body.applicantPhone.trim();
            if (body.passportIdNumber) updateData.passportIdNumber = body.passportIdNumber.toUpperCase().trim();
            if (body.purposeOfVisit) updateData.purposeOfVisit = body.purposeOfVisit.trim();
            if (body.dateOfVisit) updateData.dateOfVisit = new Date(body.dateOfVisit);
            if (body.validFrom) updateData.validFrom = new Date(body.validFrom);
            if (body.validTo) updateData.validTo = new Date(body.validTo);
            if (body.requestType) updateData.requestType = body.requestType;
            if (body.passFor !== undefined) updateData.passFor = body.passFor?.trim() || null;
            if (body.nationality) updateData.nationality = body.nationality.trim();
            if (body.identification) updateData.identification = body.identification.trim();
            if (body.gender) updateData.gender = body.gender.trim();
            if (body.profession) updateData.profession = body.profession.trim();

            const updatedRequest = await prisma.request.update({
                where: { id: requestId },
                data: updateData,
            });

            // Log the update
            await prisma.activityLog.create({
                data: {
                    userId: user.userId,
                    actionType: 'REQUEST_MANAGEMENT',
                    actionPerformed: `Updated request ${existingRequest.requestNumber}`,
                    affectedEntityType: 'REQUEST',
                    affectedEntityId: requestId,
                    details: JSON.stringify({
                        updatedFields: Object.keys(updateData),
                        updatedBy: user.email,
                    }),
                },
            });

            // Create notifications for all admins (async, don't wait)
            createRequestNotifications(
                ActionType.REQUEST_MANAGEMENT,
                `Updated request ${existingRequest.requestNumber}`,
                'REQUEST',
                requestId,
                user.userId,
                `تم تحديث الطلب ${existingRequest.requestNumber}`
            ).catch(err => console.error('Failed to create notifications:', err));

            return NextResponse.json({
                success: true,
                message: 'Request updated successfully',
                data: updatedRequest,
            });

        } catch (error: any) {
            console.error('Error updating request:', error);
            return NextResponse.json(
                { error: 'Internal Server Error', message: 'Failed to update request' },
                { status: 500 }
            );
        }
    });
}
