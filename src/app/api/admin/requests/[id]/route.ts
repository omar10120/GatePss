import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/middleware/api';
import prisma from '@/lib/prisma';

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
                    createdBy: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
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

            if (existingRequest.status !== 'PENDING') {
                return NextResponse.json(
                    { error: 'Invalid Operation', message: 'Only pending requests can be edited' },
                    { status: 400 }
                );
            }

            // Update allowed fields
            const updateData: any = {};

            if (body.applicantName) updateData.applicantName = body.applicantName.trim();
            if (body.applicantEmail) updateData.applicantEmail = body.applicantEmail.toLowerCase().trim();
            if (body.passportIdNumber) updateData.passportIdNumber = body.passportIdNumber.toUpperCase().trim();
            if (body.purposeOfVisit) updateData.purposeOfVisit = body.purposeOfVisit.trim();
            if (body.dateOfVisit) updateData.dateOfVisit = new Date(body.dateOfVisit);
            if (body.requestType) updateData.requestType = body.requestType;
            if (body.extraFields) updateData.extraFields = JSON.stringify(body.extraFields);

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
