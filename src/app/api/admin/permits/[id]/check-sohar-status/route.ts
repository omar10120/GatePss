import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/middleware/api';
import prisma from '@/lib/prisma';
import { SoharPortClient } from '@/lib/sohar-port';
import { ActionType } from '@/lib/enums';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    return requirePermission(request, 'MANAGE_PERMITS', async (req, user) => {
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
                    { error: 'Invalid Operation', message: 'Request does not have a Sohar Port reference' },
                    { status: 400 }
                );
            }

            const soharPortClient = new SoharPortClient();
            const soharResponse = await soharPortClient.receive.getGatePass({
                externalReference: gateRequest.externalReference,
            });

            if (!soharResponse.success) {
                const httpStatus = soharResponse.statusCode === 404 ? 404 : 500;
                const errorMessage = soharResponse.error || soharResponse.message || 'Failed to get status from Sohar Port';

                return NextResponse.json(
                    {
                        error: 'Sohar Port Error',
                        message: errorMessage,
                        details: {
                            externalReference: gateRequest.externalReference,
                            statusCode: soharResponse.statusCode,
                        },
                    },
                    { status: httpStatus }
                );
            }

            const updateData: any = {
                lastIntegrationStatusCode: soharResponse.statusCode,
                lastIntegrationStatusMessage: soharResponse.message,
            };

            if (soharResponse.data?.status) {
                if (soharResponse.data.status === 'REJECTED' || soharResponse.data.status === 'CANCELLED') {
                    updateData.status = 'REJECTED';
                } else if (soharResponse.data.status === 'APPROVED' || soharResponse.data.status === 'ACTIVE') {
                    if (gateRequest.status === 'APPROVED') {
                        updateData.status = 'APPROVED';
                    }
                }
            }

            if (soharResponse.data?.qrCodePdfUrl) {
                updateData.qrCodePdfUrl = soharResponse.data.qrCodePdfUrl;
            }

            const updatedRequest = await prisma.request.update({
                where: { id: requestId },
                data: updateData,
            });

            await prisma.activityLog.create({
                data: {
                    userId: user.userId,
                    actionType: ActionType.SYSTEM_INTEGRATION,
                    actionPerformed: `Checked Sohar Port status for permit ${gateRequest.requestNumber}`,
                    affectedEntityType: 'REQUEST',
                    affectedEntityId: requestId,
                    details: JSON.stringify({
                        externalReference: gateRequest.externalReference,
                        soharStatus: soharResponse.data?.status,
                        statusCode: soharResponse.statusCode,
                        message: soharResponse.message,
                    }),
                },
            });

            return NextResponse.json({
                success: true,
                message: 'Sohar Port status checked and updated successfully',
                data: {
                    request: updatedRequest,
                    soharStatus: soharResponse.data?.status,
                    soharMessage: soharResponse.message,
                },
            });
        } catch (error: any) {
            console.error('Error checking Sohar Port status for permit:', error);
            return NextResponse.json(
                { error: 'Internal Server Error', message: error.message || 'Failed to check Sohar Port status' },
                { status: 500 }
            );
        }
    });
}
