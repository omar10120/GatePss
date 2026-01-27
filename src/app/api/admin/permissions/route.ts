import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/middleware/api';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
    return requirePermission(request, 'MANAGE_USERS', async (req, user) => {
        try {
            // If SUPER_ADMIN, return all permissions
            if (user.role === 'SUPER_ADMIN') {
                const permissions = await prisma.permission.findMany({
                    orderBy: {
                        key: 'asc',
                    },
                });

                return NextResponse.json({
                    success: true,
                    data: permissions,
                });
            }

            // For regular admins, fetch their permissions from database
            const dbUser = await prisma.user.findUnique({
                where: { id: user.userId },
                include: {
                    userPermissions: {
                        include: {
                            permission: true,
                        },
                    },
                },
            });

            if (!dbUser) {
                return NextResponse.json(
                    { error: 'Unauthorized', message: 'User not found' },
                    { status: 401 }
                );
            }

            // Get permission IDs that the user has
            const userPermissionIds = dbUser.userPermissions.map((up: any) => up.permission.id);

            // Return only permissions that the user has
            const permissions = await prisma.permission.findMany({
                where: {
                    id: {
                        in: userPermissionIds,
                    },
                },
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
