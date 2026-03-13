import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/middleware/api';
import prisma from '@/lib/prisma';
import { RequestStatus, RequestType } from '@/lib/enums';

export async function GET(request: NextRequest) {
    try {
        return await requirePermission(request, 'MANAGE_REQUESTS', async (req, user) => {
            const { searchParams } = new URL(req.url);
            // Parse query parameters
            const status = searchParams.get('status') as RequestStatus | null;
            const requestType = searchParams.get('requestType') as RequestType | null;
            const passFor = searchParams.get('passFor');
            const dateFilter = searchParams.get('date'); // Frontend sends: today, yesterday, this_week, this_month
            const dateFrom = searchParams.get('dateFrom');
            const dateTo = searchParams.get('dateTo');
            const entityType = searchParams.get('entityType');
            const search = searchParams.get('search');
            const page = parseInt(searchParams.get('page') || '1');
            const limit = parseInt(searchParams.get('limit') || '20');
            const skip = (page - 1) * limit;

            // Build where clause
            const where: any = {};

            if (status) {
                where.status = status;
            }

            if (requestType) {
                where.requestType = requestType;
            }

            if (passFor) {
                where.passFor = passFor;
            }

            if (entityType) {
                where.entityType = entityType;
            }

            // Handle date filter from frontend
            if (dateFilter && !dateFrom && !dateTo) {
                // Check if dateFilter is a YYYY-MM-DD format (from date picker)
                const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                if (dateRegex.test(dateFilter)) {
                    // Handle specific date selection (YYYY-MM-DD format)
                    const selectedDate = new Date(dateFilter);
                    const startDate = new Date(selectedDate);
                    startDate.setHours(0, 0, 0, 0);
                    const endDate = new Date(selectedDate);
                    endDate.setHours(23, 59, 59, 999);

                    where.createdAt = {
                        gte: startDate,
                        lte: endDate,
                    };
                } else {
                    // Handle predefined filters (today, yesterday, this_week, this_month)
                    const now = new Date();
                    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    let startDate: Date;
                    let endDate: Date = new Date(today);
                    endDate.setHours(23, 59, 59, 999);

                    switch (dateFilter) {
                        case 'today':
                            startDate = new Date(today);
                            startDate.setHours(0, 0, 0, 0);
                            break;
                        case 'yesterday':
                            startDate = new Date(today);
                            startDate.setDate(startDate.getDate() - 1);
                            startDate.setHours(0, 0, 0, 0);
                            endDate = new Date(today);
                            endDate.setHours(0, 0, 0, 0);
                            endDate.setMilliseconds(-1);
                            break;
                        case 'this_week':
                            startDate = new Date(today);
                            startDate.setDate(startDate.getDate() - startDate.getDay());
                            startDate.setHours(0, 0, 0, 0);
                            break;
                        case 'this_month':
                            startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                            startDate.setHours(0, 0, 0, 0);
                            break;
                        default:
                            startDate = new Date(today);
                            startDate.setHours(0, 0, 0, 0);
                    }

                    where.createdAt = {
                        gte: startDate,
                        lte: endDate,
                    };
                }
            } else if (dateFrom || dateTo) {
                // Handle explicit dateFrom/dateTo parameters
                where.createdAt = {};
                if (dateFrom) {
                    const fromDate = new Date(dateFrom);
                    fromDate.setHours(0, 0, 0, 0);
                    where.createdAt.gte = fromDate;
                }
                if (dateTo) {
                    const toDate = new Date(dateTo);
                    toDate.setHours(23, 59, 59, 999);
                    where.createdAt.lte = toDate;
                }
            }

            if (search) {
                where.OR = [
                    { requestNumber: { contapins: search } },
                    { applicantNameEn: { contains: search } },
                    { applicantNameAr: { contains: search } },
                    { applicantEmail: { contains: search } },
                    { passportIdNumber: { contains: search } },
                ];
            }

            // Get total count
            const total = await prisma.request.count({ where });
            console.log(total);

            // Get requests
            const requests = await prisma.request.findMany({
                where,
                include: {
                    approvedBy: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
                skip,
                take: limit,
            });

            return NextResponse.json({
                success: true,
                data: {
                    requests,
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
        console.error('Error in requests API:', error);
        return NextResponse.json(
            {
                error: 'Internal Server Error',
                message: error.message || 'Failed to fetch requests',
                details: process.env.NODE_ENV === 'development' ? error.stack : undefined
            },
            { status: 500 }
        );
    }
}
