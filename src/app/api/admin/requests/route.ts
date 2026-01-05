import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/middleware/api';
import prisma from '@/lib/prisma';
import { RequestStatus, RequestType } from '@prisma/client';

export async function GET(request: NextRequest) {
    return requirePermission(request, 'MANAGE_REQUESTS', async (req, user) => {
        try {
            const { searchParams } = new URL(req.url);

            // Parse query parameters
            const status = searchParams.get('status') as RequestStatus | null;
            const requestType = searchParams.get('requestType') as RequestType | null;
            const dateFrom = searchParams.get('dateFrom');
            const dateTo = searchParams.get('dateTo');
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

            if (dateFrom || dateTo) {
                where.dateOfVisit = {};
                if (dateFrom) {
                    where.dateOfVisit.gte = new Date(dateFrom);
                }
                if (dateTo) {
                    where.dateOfVisit.lte = new Date(dateTo);
                }
            }

            if (search) {
                where.OR = [
                    { requestNumber: { contains: search } },
                    { applicantName: { contains: search } },
                    { applicantEmail: { contains: search } },
                    { passportIdNumber: { contains: search } },
                ];
            }

            // Get total count
            const total = await prisma.request.count({ where });

            // Get requests
            const requests = await prisma.request.findMany({
                where,
                include: {
                    createdBy: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
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

        } catch (error: any) {
            console.error('Error fetching requests:', error);
            return NextResponse.json(
                { error: 'Internal Server Error', message: 'Failed to fetch requests' },
                { status: 500 }
            );
        }
    });
}
