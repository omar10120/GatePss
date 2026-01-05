import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/middleware/api';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
    return requirePermission(request, 'VIEW_DASHBOARD', async (req, user) => {
        try {
            const { searchParams } = new URL(req.url);
            const days = parseInt(searchParams.get('days') || '30');

            // Calculate date range
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            // Get requests grouped by date and status
            const requests = await prisma.request.findMany({
                where: {
                    createdAt: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
                select: {
                    createdAt: true,
                    status: true,
                },
            });

            // Group by date
            const dateMap = new Map<string, { approved: number; rejected: number; pending: number }>();

            requests.forEach(req => {
                const dateKey = req.createdAt.toISOString().split('T')[0];

                if (!dateMap.has(dateKey)) {
                    dateMap.set(dateKey, { approved: 0, rejected: 0, pending: 0 });
                }

                const stats = dateMap.get(dateKey)!;
                if (req.status === 'APPROVED') stats.approved++;
                else if (req.status === 'REJECTED') stats.rejected++;
                else if (req.status === 'PENDING') stats.pending++;
            });

            // Convert to array format for charts
            const lineChartData = Array.from(dateMap.entries())
                .map(([date, stats]) => ({
                    date,
                    approved: stats.approved,
                    rejected: stats.rejected,
                    pending: stats.pending,
                }))
                .sort((a, b) => a.date.localeCompare(b.date));

            // Get status distribution for pie chart
            const statusCounts = await prisma.request.groupBy({
                by: ['status'],
                _count: true,
            });

            const pieChartData = statusCounts.map(item => ({
                name: item.status,
                value: item._count,
            }));

            // Get request type distribution
            const typeCounts = await prisma.request.groupBy({
                by: ['requestType'],
                _count: true,
            });

            const typeChartData = typeCounts.map(item => ({
                name: item.requestType,
                value: item._count,
            }));

            return NextResponse.json({
                success: true,
                data: {
                    lineChart: lineChartData,
                    pieChart: pieChartData,
                    typeChart: typeChartData,
                },
            });

        } catch (error: any) {
            console.error('Error fetching chart data:', error);
            return NextResponse.json(
                { error: 'Internal Server Error', message: 'Failed to fetch chart data' },
                { status: 500 }
            );
        }
    });
}
