import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/middleware/api';
import prisma from '@/lib/prisma';
import { RequestStatus } from '@/lib/enums';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    return requirePermission(request, 'MANAGE_PERMITS', async () => {
        try {
            const requestId = parseInt(id, 10);

            if (Number.isNaN(requestId)) {
                return NextResponse.json(
                    { error: 'Invalid Request', message: 'Invalid permit ID' },
                    { status: 400 }
                );
            }

            const permit = await prisma.request.findUnique({
                where: {
                    id: requestId,
                    status: RequestStatus.APPROVED,
                },
                include: {
                    approvedBy: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
            });

            if (!permit) {
                return NextResponse.json(
                    { error: 'Not Found', message: 'Permit not found' },
                    { status: 404 }
                );
            }

            return NextResponse.json({
                success: true,
                data: {
                    request: permit,
                },
            });
        } catch (error: any) {
            console.error('Error fetching permit details:', error);
            return NextResponse.json(
                {
                    error: 'Internal Server Error',
                    message: error.message || 'Failed to fetch permit details',
                    details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
                },
                { status: 500 }
            );
        }
    });
}
