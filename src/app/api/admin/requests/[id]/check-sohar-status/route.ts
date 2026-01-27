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
    return requirePermission(request, 'MANAGE_REQUESTS', async (req, user) => {
        try {
            const requestId = parseInt(id);

            if (isNaN(requestId)) {
                return NextResponse.json(
                    { error: 'Invalid Request', message: 'Invalid request ID' },
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

            // Check if request has externalReference (Sohar Port reference)
            if (!gateRequest.externalReference) {
                return NextResponse.json(
                    { error: 'Invalid Operation', message: 'Request does not have a Sohar Port reference' },
                    { status: 400 }
                );
            }

            // Get status from Sohar Port
            const soharPortClient = new SoharPortClient();
            const soharResponse = await soharPortClient.receive.getGatePass({
                externalReference: gateRequest.externalReference,
            });

            if (!soharResponse.success) {
                // Determine appropriate HTTP status code based on Sohar Port response
                const httpStatus = soharResponse.statusCode === 404 ? 404 : 500;
                const errorMessage = soharResponse.error || soharResponse.message || 'Failed to get status from Sohar Port';
                
                return NextResponse.json(
                    { 
                        error: 'Sohar Port Error', 
                        message: errorMessage,
                        details: {
                            externalReference: gateRequest.externalReference,
                            statusCode: soharResponse.statusCode,
                        }
                    },
                    { status: httpStatus }
                );
            }

            // Update request based on Sohar Port status
            const updateData: any = {
                lastIntegrationStatusCode: soharResponse.statusCode,
                lastIntegrationStatusMessage: soharResponse.message,
            };

            // Map Sohar Port status to our status
            // If Sohar Port has a status, we might need to update our status
            // For now, we'll just update the integration status fields
            if (soharResponse.data?.status) {
                // If Sohar Port shows it's rejected, update our status
                if (soharResponse.data.status === 'REJECTED' || soharResponse.data.status === 'CANCELLED') {
                    updateData.status = 'REJECTED';
                } else if (soharResponse.data.status === 'APPROVED' || soharResponse.data.status === 'ACTIVE') {
                    // Keep as APPROVED if it's already approved
                    if (gateRequest.status === 'APPROVED') {
                        updateData.status = 'APPROVED';
                    }
                }
            }

            // Update QR code PDF URL if provided
            if (soharResponse.data?.qrCodePdfUrl) {
                updateData.qrCodePdfUrl = soharResponse.data.qrCodePdfUrl;
            }

            // Update the request
            const updatedRequest = await prisma.request.update({
                where: { id: requestId },
                data: updateData,
            });

            // Log the status check
            await prisma.activityLog.create({
                data: {
                    userId: user.userId,
                    actionType: ActionType.SYSTEM_INTEGRATION,
                    actionPerformed: `Checked Sohar Port status for request ${gateRequest.requestNumber}`,
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
            console.error('Error checking Sohar Port status:', error);
            return NextResponse.json(
                { error: 'Internal Server Error', message: error.message || 'Failed to check Sohar Port status' },
                { status: 500 }
            );
        }
    });
}

