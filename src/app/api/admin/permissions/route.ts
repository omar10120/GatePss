import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/middleware/api';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
    return requireSuperAdmin(request, async (req, user) => {
        try {
            const permissions = await prisma.permission.findMany({
                orderBy: {
                    key: 'asc',
                },
            });

            return NextResponse.json({
                success: true,
                data: permissions,
            });

        } catch (error: any) {
            console.error('Error fetching permissions:', error);
            return NextResponse.json(
                { error: 'Internal Server Error', message: 'Failed to fetch permissions' },
                { status: 500 }
            );
        }
    });
}
