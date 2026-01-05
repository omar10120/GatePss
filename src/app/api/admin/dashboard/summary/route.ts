import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/middleware/api';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
    return requirePermission(request, 'VIEW_DASHBOARD', async (req, user) => {
        try {
            // Get counts for each status
            const [total, approved, rejected, pending] = await Promise.all([
                prisma.request.count(),
                prisma.request.count({ where: { status: 'APPROVED' } }),
                prisma.request.count({ where: { status: 'REJECTED' } }),
                prisma.request.count({ where: { status: 'PENDING' } }),
            ]);

            // Get counts by request type
            const byType = await prisma.request.groupBy({
                by: ['requestType'],
                _count: true,
            });

            const requestsByType = byType.reduce((acc, item) => {
                acc[item.requestType] = item._count;
                return acc;
            }, {} as Record<string, number>);

            // Get recent requests
            const recentRequests = await prisma.request.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    requestNumber: true,
                    applicantName: true,
                    status: true,
                    requestType: true,
                    createdAt: true,
                },
            });

            return NextResponse.json({
                success: true,
                data: {
                    summary: {
                        total,
                        approved,
                        rejected,
                        pending,
                    },
                    byType: requestsByType,
                    recentRequests,
                },
            });

        } catch (error: any) {
            console.error('Error fetching dashboard summary:', error);
            return NextResponse.json(
                { error: 'Internal Server Error', message: 'Failed to fetch dashboard data' },
                { status: 500 }
            );
        }
    });
}
