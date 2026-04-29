import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/middleware/api';
import prisma from '@/lib/prisma';
import { RequestStatus, RequestType } from '@/lib/enums';

export async function GET(request: NextRequest) {
    try {
        return await requirePermission(request, 'MANAGE_PERMITS', async (req) => {
            const { searchParams } = new URL(req.url);
            const status = (searchParams.get('status') as RequestStatus | null) || RequestStatus.APPROVED;
            const requestType = searchParams.get('requestType') as RequestType | null;
            const passFor = searchParams.get('passFor');
            const dateFilter = searchParams.get('date');
            const dateFrom = searchParams.get('dateFrom');
            const dateTo = searchParams.get('dateTo');
            const entityType = searchParams.get('entityType');
            const search = searchParams.get('search');
            const page = parseInt(searchParams.get('page') || '1');
            const limit = parseInt(searchParams.get('limit') || '20');
            const skip = (page - 1) * limit;

            const where: any = { status };

            if (requestType) {
                where.requestType = requestType;
            }

            if (passFor) {
                where.passFor = passFor;
            }

            if (entityType) {
                where.entityType = entityType;
            }

            if (dateFilter && !dateFrom && !dateTo) {
                const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                if (dateRegex.test(dateFilter)) {
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
                    { requestNumber: { contains: search } },
                    { applicantNameEn: { contains: search } },
                    { applicantNameAr: { contains: search } },
                    { applicantEmail: { contains: search } },
                    { passportIdNumber: { contains: search } },
                ];
            }

            const total = await prisma.request.count({ where });
            const permits = await prisma.request.findMany({
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
                    requests: permits,
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
        console.error('Error in permits API:', error);
        return NextResponse.json(
            {
                error: 'Internal Server Error',
                message: error.message || 'Failed to fetch permits',
                details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            },
            { status: 500 }
        );
    }
}
