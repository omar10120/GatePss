import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/middleware/api';
import prisma from '@/lib/prisma';
import { SoharPortClient } from '@/lib/sohar-port';
import { normalizeGatePassStatus } from '@/lib/sohar-port/receive/get-gate-pass';
import { ActionType } from '@/lib/enums';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/** Raw DB / API strings that mean “still waiting on Sohar” for batch refresh. */
function pendingExternalStatusVariants(): string[] {
    const raw = ['PENDING', 'Pending', 'pending'];
    const out = new Set<string>(raw);
    for (const s of raw) {
        out.add(s.trim());
    }
    return Array.from(out);
}

function parsePositiveInt(value: string | undefined, fallback: number, max: number): number {
    const n = Number.parseInt(value || '', 10);
    if (!Number.isFinite(n) || n < 1) return fallback;
    return Math.min(max, n);
}

export async function POST(request: NextRequest) {
    return requirePermission(request, 'MANAGE_REQUESTS', async (_req, user) => {
        try {
            logger.info('Starting batch status sync from Sohar Port (external PENDING only)');

            const pendingValues = pendingExternalStatusVariants();
            const batchSize = parsePositiveInt(
                process.env.SOHAR_SYNC_BATCH_SIZE,
                50,
                150
            );
            const maxRounds = parsePositiveInt(
                process.env.SOHAR_SYNC_MAX_ROUNDS,
                20,
                50
            );

            const soharPortClient = new SoharPortClient();
            const results = {
                total: 0,
                updated: 0,
                failed: 0,
                noChange: 0,
                rounds: 0,
            };

            const failureDetails: { id: number; requestNumber: string; message: string }[] = [];
            const delayMs = Math.min(
                2000,
                Math.max(0, Number.parseInt(process.env.SOHAR_SYNC_BATCH_DELAY_MS || '0', 10) || 0)
            );

            let idCursor: number | undefined;
            let hitRoundLimitWithFullBatch = false;

            for (let round = 0; round < maxRounds; round++) {
                const requestsToSync = await prisma.request.findMany({
                    where: {
                        externalReference: { not: null },
                        status: 'APPROVED',
                        OR: [
                            { externalStatus: null },
                            { externalStatus: '' },
                            { externalStatus: { in: pendingValues } },
                        ],
                        ...(idCursor !== undefined ? { id: { lt: idCursor } } : {}),
                    },
                    orderBy: { id: 'desc' },
                    take: batchSize,
                });

                if (requestsToSync.length === 0) {
                    break;
                }

                results.rounds++;
                results.total += requestsToSync.length;
                idCursor = requestsToSync[requestsToSync.length - 1]!.id;

                for (let i = 0; i < requestsToSync.length; i++) {
                    const row = requestsToSync[i]!;
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
                            const failMsg = apiResponse.message || apiResponse.error || 'Unknown error';
                            failureDetails.push({
                                id: row.id,
                                requestNumber: row.requestNumber,
                                message: failMsg,
                            });
                            logger.warn(`Failed to sync request ${row.id}: ${failMsg}`);

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
                        failureDetails.push({
                            id: row.id,
                            requestNumber: row.requestNumber,
                            message: msg,
                        });
                        logger.error(`Error in batch sync for request ${row.id}: ${msg}`);
                    }

                    if (delayMs > 0 && i < requestsToSync.length - 1) {
                        await new Promise((r) => setTimeout(r, delayMs));
                    }
                }

                if (requestsToSync.length < batchSize) {
                    break;
                }
                if (round === maxRounds - 1) {
                    hitRoundLimitWithFullBatch = true;
                }
            }

            if (results.total === 0) {
                return NextResponse.json({
                    success: true,
                    message: 'No approved requests with external PENDING (or empty) status to sync',
                    count: 0,
                    data: { ...results, batchSize, maxRounds },
                });
            }

            return NextResponse.json({
                success: true,
                message: `Batch sync completed. Rows touched: ${results.total}, Updated: ${results.updated}, Failed: ${results.failed}, No Change: ${results.noChange}`,
                data: {
                    ...results,
                    batchSize,
                    maxRounds,
                    ...(hitRoundLimitWithFullBatch ? { mayHaveMore: true } : {}),
                    ...(failureDetails.length ? { failures: failureDetails } : {}),
                },
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
