import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/middleware/api';
import prisma from '@/lib/prisma';
import { SoharPortClient } from '@/lib/sohar-port';
import { normalizeGatePassStatus } from '@/lib/sohar-port/receive/get-gate-pass';
import { ActionType } from '@/lib/enums';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/** Sohar-side terminal states — no need to keep polling these in batch. */
const TERMINAL_EXTERNAL_STATUSES = ['EXPIRED', 'REJECTED', 'CANCELLED', 'CANCELED'] as const;

function terminalExternalStatusVariants(): string[] {
    const out = new Set<string>();
    for (const t of TERMINAL_EXTERNAL_STATUSES) {
        out.add(t);
        out.add(t.toLowerCase());
        out.add(t.charAt(0) + t.slice(1).toLowerCase());
    }
    return Array.from(out);
}

export async function POST(request: NextRequest) {
    return requirePermission(request, 'MANAGE_REQUESTS', async (_req, user) => {
        try {
            logger.info('Starting batch status sync from Sohar Port');

            // Same pool as manual sync targets: approved + integrated, excluding terminal Sohar statuses.
            // (Old filter `Pending`/`PENDING` only skipped rows like ACTIVE/pending casing and never matched single-id sync.)
            const notTerminal = terminalExternalStatusVariants();
            const requestsToSync = await prisma.request.findMany({
                where: {
                    externalReference: { not: null },
                    status: 'APPROVED',
                    OR: [
                        { externalStatus: null },
                        { externalStatus: { notIn: notTerminal } },
                    ],
                },
                orderBy: { updatedAt: 'asc' },
                take: 20,
            });

            if (requestsToSync.length === 0) {
                return NextResponse.json({
                    success: true,
                    message: 'No requests need syncing',
                    count: 0,
                });
            }

            const soharPortClient = new SoharPortClient();
            const results = {
                total: requestsToSync.length,
                updated: 0,
                failed: 0,
                noChange: 0,
            };

            for (const row of requestsToSync) {
                try {
                    if (!row.externalReference) continue;

                    const apiResponse = await soharPortClient.receive.getGatePass({
                        externalReference: row.externalReference,
                        entity: row.entityType,
                    });

                    if (apiResponse.success && apiResponse.data) {
                        const newExternalStatus = apiResponse.data.status;
                        const prevNorm = normalizeGatePassStatus(row.externalStatus);
                        const nextNorm = normalizeGatePassStatus(newExternalStatus);

                        if (prevNorm !== nextNorm) {
                            await prisma.request.update({
                                where: { id: row.id },
                                data: {
                                    externalStatus: newExternalStatus,
                                    lastIntegrationStatusMessage: apiResponse.message,
                                    lastIntegrationStatusCode: apiResponse.statusCode,
                                },
                            });

                            await prisma.activityLog.create({
                                data: {
                                    userId: user.userId,
                                    actionType: ActionType.SYSTEM_INTEGRATION,
                                    actionPerformed: `Batch sync updated request ${row.requestNumber}. Status: ${row.externalStatus} -> ${newExternalStatus}`,
                                    affectedEntityType: 'REQUEST',
                                    affectedEntityId: row.id,
                                    details: JSON.stringify({
                                        previousStatus: row.externalStatus,
                                        newStatus: newExternalStatus,
                                        apiResponse: apiResponse,
                                    }),
                                },
                            });

                            results.updated++;
                            logger.info(
                                `Frequency sync updated request ${row.requestNumber} status to ${newExternalStatus}`
                            );
                        } else {
                            results.noChange++;
                        }
                    } else {
                        results.failed++;
                        logger.warn(`Failed to sync request ${row.id}: ${apiResponse.message}`);

                        await prisma.activityLog.create({
                            data: {
                                userId: user.userId,
                                actionType: ActionType.SYSTEM_INTEGRATION,
                                actionPerformed: `Batch sync failed for request ${row.requestNumber}`,
                                affectedEntityType: 'REQUEST',
                                affectedEntityId: row.id,
                                details: JSON.stringify({
                                    error: apiResponse.message,
                                    statusCode: apiResponse.statusCode,
                                    apiResponse: apiResponse,
                                }),
                            },
                        });
                    }
                } catch (err: unknown) {
                    results.failed++;
                    const msg = err instanceof Error ? err.message : String(err);
                    logger.error(`Error in batch sync for request ${row.id}: ${msg}`);
                }
            }

            return NextResponse.json({
                success: true,
                message: `Batch sync completed. Updated: ${results.updated}, Failed: ${results.failed}, No Change: ${results.noChange}`,
                data: results,
            });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            const stack = error instanceof Error ? error.stack : undefined;
            logger.error('Error in batch status sync:', { message, stack });
            return NextResponse.json(
                { error: 'Internal Server Error', message: 'Batch sync failed' },
                { status: 500 }
            );
        }
    });
}
