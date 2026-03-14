import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/middleware/api';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        return await requirePermission(request, 'VIEW_LOGS', async (req, user) => {
            const { searchParams } = new URL(req.url);
            
            // Parse query parameters
            const actionType = searchParams.get('actionType');
            const search = searchParams.get('search');
            const page = parseInt(searchParams.get('page') || '1');
            const limit = parseInt(searchParams.get('limit') || '50');
            const skip = (page - 1) * limit;

            // Build where clause
            const where: any = {};

            if (actionType) {
                where.actionType = actionType;
            }

            if (search) {
                where.OR = [
                    { actionPerformed: { contains: search } },
                    {
                        user: {
                            OR: [
                                { name: { contains: search } },
                                { email: { contains: search } },
                            ],
                        },
                    },
                ];
            }

            // Get total count
            const total = await prisma.activityLog.count({ where });

            // Get logs with user relation
            const logs = await prisma.activityLog.findMany({
                where,
                select: {
                    id: true,
                    timestamp: true,
                    userId: true,
                    actionType: true,
                    actionPerformed: true,
                    affectedEntityType: true,
                    affectedEntityId: true,
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
                skip,
                take: limit,
            });

            // Extract all request numbers from logs and batch fetch request IDs
            const requestNumbers = new Set<string>();
            logs.forEach((log) => {
                const requestNumberMatch = log.actionPerformed.match(/GP-(\d+)/);
                if (requestNumberMatch) {
                    requestNumbers.add(`GP-${requestNumberMatch[1]}`);
                }
            });

            // Batch fetch request IDs
            const requests = requestNumbers.size > 0
                ? await prisma.request.findMany({
                      where: { requestNumber: { in: Array.from(requestNumbers) } },
                      select: { id: true, requestNumber: true },
                  })
                : [];

            const requestNumberToIdMap = new Map(
                requests.map((req) => [req.requestNumber, req.id])
            );

            // Format response to match frontend expectations
            const formattedLogs = logs.map((log) => {
                let requestId: number | null = null;
                
                // Extract request number from action text and get ID from map
                const requestNumberMatch = log.actionPerformed.match(/GP-(\d+)/);
                if (requestNumberMatch) {
                    const requestNumber = `GP-${requestNumberMatch[1]}`;
                    requestId = requestNumberToIdMap.get(requestNumber) || null;
                }
                
                return {
                    id: log.id,
                    timestamp: log.timestamp.toISOString(),
                    userId: log.userId,
                    actionType: log.actionType,
                    actionPerformed: log.actionPerformed,
                    affectedEntityType: log.affectedEntityType,
                    affectedEntityId: log.affectedEntityId || requestId, // Use requestId if affectedEntityId is null
                    details: null,
                    requestId, // Add requestId to response
                    user: log.user
                        ? {
                              id: log.user.id,
                              name: log.user.name,
                              email: log.user.email,
                          }
                        : null,
                };
            });

            return NextResponse.json({
                success: true,
                data: {
                    logs: formattedLogs,
                    pagination: {
                        page,
                        limit,
                        total,
                        totalPages: Math.ceil(total / limit),
                    },
                },
            });
        });
    } catch (error: any) {
        console.error('Error in logs API:', error);
        return NextResponse.json(
            {
                error: 'Internal Server Error',
                message: error.message || 'Failed to fetch logs',
                details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            },
            { status: 500 }
        );
    }
}
