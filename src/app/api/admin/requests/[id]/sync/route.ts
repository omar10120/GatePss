import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/middleware/api';
import prisma from '@/lib/prisma';
import { SoharPortClient } from '@/lib/sohar-port';
import { ActionType } from '@/lib/enums';
import { logger } from '@/lib/logger';

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

            const gateRequest = await prisma.request.findUnique({
                where: { id: requestId },
            });

            if (!gateRequest) {
                return NextResponse.json(
                    { error: 'Not Found', message: 'Request not found' },
                    { status: 404 }
                );
            }

            if (!gateRequest.externalReference) {
                return NextResponse.json(
                    { error: 'Not Integrated', message: 'This request has no Sohar Port reference' },
                    { status: 400 }
                );
            }

            const soharPortClient = new SoharPortClient();
            const apiResponse = await soharPortClient.receive.getGatePass({
                externalReference: gateRequest.externalReference,
            });

            if (!apiResponse.success || !apiResponse.data) {
                return NextResponse.json(
                    { 
                        error: 'Integration Error', 
                        message: apiResponse.message || 'Failed to fetch status from Sohar Port' 
                    },
                    { status: 500 }
                );
            }

            const newExternalStatus = apiResponse.data.status;
            
            // Only update if status changed
            if (newExternalStatus !== gateRequest.externalStatus) {
                await prisma.request.update({
                    where: { id: requestId },
                    data: {
                        externalStatus: newExternalStatus,
                        lastIntegrationStatusMessage: apiResponse.message,
                        lastIntegrationStatusCode: apiResponse.statusCode,
                    },
                });

                // Log the sync with change
                await prisma.activityLog.create({
                    data: {
                        userId: user.userId,
                        actionType: ActionType.SYSTEM_INTEGRATION,
                        actionPerformed: `Synced status for request ${gateRequest.requestNumber}. Status changed: ${gateRequest.externalStatus} -> ${newExternalStatus}`,
                        affectedEntityType: 'REQUEST',
                        affectedEntityId: requestId,
                        details: JSON.stringify({
                            previousStatus: gateRequest.externalStatus,
                            newStatus: newExternalStatus,
                            externalReference: gateRequest.externalReference,
                            apiResponse: apiResponse, // Log full response
                        }),
                    },
                });

                return NextResponse.json({
                    success: true,
                    message: `Status updated to ${newExternalStatus}`,
                    data: {
                        status: newExternalStatus,
                    },
                });
            }

            // Log the check even if no change
            await prisma.activityLog.create({
                data: {
                    userId: user.userId,
                    actionType: ActionType.SYSTEM_INTEGRATION,
                    actionPerformed: `Checked status for request ${gateRequest.requestNumber}. No change.`,
                    affectedEntityType: 'REQUEST',
                    affectedEntityId: requestId,
                    details: JSON.stringify({
                        currentStatus: gateRequest.externalStatus,
                        externalReference: gateRequest.externalReference,
                        apiResponse: apiResponse, // Log full response
                    }),
                },
            });

            return NextResponse.json({
                success: true,
                message: 'Status is already up to date',
                data: {
                    status: gateRequest.externalStatus,
                },
            });

        } catch (error: any) {
            logger.error('Error syncing request status:', {
                requestId: id,
                message: error.message,
                stack: error.stack,
            });
            return NextResponse.json(
                { error: 'Internal Server Error', message: 'Failed to sync status' },
                { status: 500 }
            );
        }
    });
}
