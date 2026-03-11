import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { SoharPortClient } from '@/lib/sohar-port';
import { ActionType } from '@/lib/enums';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        // Optional: Simple secret token check to prevent unauthorized calls
        // const authHeader = request.headers.get('Authorization');
        // if (authHeader !== `Bearer ${process.env.SYNC_SECRET}`) {
        //     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        // }

        logger.info('Starting batch status sync from Sohar Port');

        // Find all approved requests with an external reference, that are not cancelled/expired
        // We focus on PENDING and APPROVED ones in Sohar Port system
        const requestsToSync = await prisma.request.findMany({
            where: {
                externalReference: { not: null },
                status: 'APPROVED', // Only sync those we already approved in our system
                externalStatus: {
                    in: ['Pending', 'PENDING']
                }
            },
            take: 20 // Batch size limit
        });

        if (requestsToSync.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No requests need syncing',
                count: 0
            });
        }

        const soharPortClient = new SoharPortClient();
        const results = {
            total: requestsToSync.length,
            updated: 0,
            failed: 0,
            noChange: 0,
        };

        for (const req of requestsToSync) {
            try {
                if (!req.externalReference) continue;

                const apiResponse = await soharPortClient.receive.getGatePass({
                    externalReference: req.externalReference,
                });

                if (apiResponse.success && apiResponse.data) {
                    const newExternalStatus = apiResponse.data.status;
                    
                    if (newExternalStatus !== req.externalStatus) {
                        await prisma.request.update({
                            where: { id: req.id },
                            data: {
                                externalStatus: newExternalStatus,
                                lastIntegrationStatusMessage: apiResponse.message,
                                lastIntegrationStatusCode: apiResponse.statusCode,
                            },
                        });

                        // Log the sync with change
                        await prisma.activityLog.create({
                            data: {
                                userId: null, // System-triggered
                                actionType: ActionType.SYSTEM_INTEGRATION,
                                actionPerformed: `Batch sync updated request ${req.requestNumber}. Status: ${req.externalStatus} -> ${newExternalStatus}`,
                                affectedEntityType: 'REQUEST',
                                affectedEntityId: req.id,
                                details: JSON.stringify({
                                    previousStatus: req.externalStatus,
                                    newStatus: newExternalStatus,
                                    apiResponse: apiResponse,
                                }),
                            },
                        });

                        results.updated++;
                        logger.info(`Frequency sync updated request ${req.requestNumber} status to ${newExternalStatus}`);
                    } else {
                        results.noChange++;
                        // Optional: Log no change as well if needed
                    }
                } else {
                    results.failed++;
                    logger.warn(`Failed to sync request ${req.id}: ${apiResponse.message}`);
                    
                    // Log the failure
                    await prisma.activityLog.create({
                        data: {
                            userId: null,
                            actionType: ActionType.SYSTEM_INTEGRATION,
                            actionPerformed: `Batch sync failed for request ${req.requestNumber}`,
                            affectedEntityType: 'REQUEST',
                            affectedEntityId: req.id,
                            details: JSON.stringify({
                                error: apiResponse.message,
                                statusCode: apiResponse.statusCode,
                                apiResponse: apiResponse,
                            }),
                        },
                    });
                }
            } catch (err: any) {
                results.failed++;
                logger.error(`Error in batch sync for request ${req.id}:`, err.message);
            }
        }

        return NextResponse.json({
            success: true,
            message: `Batch sync completed. Updated: ${results.updated}, Failed: ${results.failed}, No Change: ${results.noChange}`,
            data: results
        });

    } catch (error: any) {
        logger.error('Error in batch status sync:', {
            message: error.message,
            stack: error.stack,
        });
        return NextResponse.json(
            { error: 'Internal Server Error', message: 'Batch sync failed' },
            { status: 500 }
        );
    }
}
