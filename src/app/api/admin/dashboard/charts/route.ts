import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/middleware/api';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
    return requirePermission(request, 'VIEW_DASHBOARD', async (req, user) => {
        try {
            const { searchParams } = new URL(req.url);

            const daysParam = searchParams.get('days');
            const startDateParam = searchParams.get('startDate');
            const endDateParam = searchParams.get('endDate');

            let startDate: Date;
            let endDate: Date = new Date();

            // ✅ Custom date range has priority
            if (startDateParam && endDateParam) {
                startDate = new Date(startDateParam);
                endDate = new Date(endDateParam);

                // Normalize end date to end of day
                endDate.setHours(23, 59, 59, 999);

                if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                    return NextResponse.json(
                        { error: 'Invalid date format' },
                        { status: 400 }
                    );
                }

                if (startDate > endDate) {
                    return NextResponse.json(
                        { error: 'startDate must be before endDate' },
                        { status: 400 }
                    );
                }
            } else {
                // ✅ Fallback to days filter
                const days = parseInt(daysParam || '30', 10);
                startDate = new Date();
                startDate.setDate(startDate.getDate() - days);
            }

            // 🔍 Fetch requests
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
                    externalReference: true,
                },
            });

            // 📊 Group by date
            const dateMap = new Map<
                string,
                { approved: number; adminApproved: number; rejected: number; pending: number }
            >();

            requests.forEach(item => {
                const dateKey = item.createdAt.toISOString().split('T')[0];

                if (!dateMap.has(dateKey)) {
                    dateMap.set(dateKey, {
                        approved: 0,
                        adminApproved: 0,
                        rejected: 0,
                        pending: 0,
                    });
                }

                const stats = dateMap.get(dateKey)!;

                if (item.status === 'APPROVED') {
                    stats.approved++;
                    if (!item.externalReference) {
                        stats.adminApproved++;
                    }
                } else if (item.status === 'REJECTED') {
                    stats.rejected++;
                } else if (item.status === 'PENDING') {
                    stats.pending++;
                }
            });

            const lineChartData = Array.from(dateMap.entries())
                .map(([date, stats]) => ({
                    date,
                    approved: stats.approved,
                    adminApproved: stats.adminApproved,
                    rejected: stats.rejected,
                    pending: stats.pending,
                }))
                .sort((a, b) => a.date.localeCompare(b.date));

            // 🥧 Pie chart (respect same date filter)
            const statusCounts = await prisma.request.groupBy({
                by: ['status'],
                where: {
                    createdAt: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
                _count: true,
            });

            const pieChartData = statusCounts.map(item => ({
                name: item.status,
                value: item._count,
            }));

            // 📦 Type chart (respect same date filter)
            const typeCounts = await prisma.request.groupBy({
                by: ['requestType'],
                where: {
                    createdAt: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
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

        } catch (error) {
            console.error('Error fetching chart data:', error);
            return NextResponse.json(
                { error: 'Internal Server Error', message: 'Failed to fetch chart data' },
                { status: 500 }
            );
        }
    });
}
