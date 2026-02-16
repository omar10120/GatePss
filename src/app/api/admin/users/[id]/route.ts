import { NextRequest, NextResponse } from 'next/server';
import { requirePermission, requireAuth } from '@/middleware/api';
import { JWTPayload } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { Prisma } from '@prisma/client';
import { ActionType } from '@/lib/enums';

// GET /api/admin/users/[id] - Get user details
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    return requireAuth(request, async (req: NextRequest, authenticatedUser: JWTPayload) => {
        try {
            const userId = parseInt(id);

            if (isNaN(userId)) {
                return NextResponse.json(
                    { error: 'Invalid Request', message: 'Invalid user ID' },
                    { status: 400 }
                );
            }

            // Allow access if:
            // 1. User is fetching their own data
            // 2. User is a SUPER_ADMIN
            // 3. User has MANAGE_USERS permission
            const isSelf = authenticatedUser.userId === userId;
            const isSuperAdmin = authenticatedUser.role === 'SUPER_ADMIN';

            if (!isSelf && !isSuperAdmin) {
                // Fetch fresh permissions from database
                const dbUser = await prisma.user.findUnique({
                    where: { id: authenticatedUser.userId },
                    include: {
                        userPermissions: {
                            include: {
                                permission: true,
                            },
                        },
                    },
                });

                const currentPermissions = dbUser?.userPermissions.map((p: any) => p.permission.key) || [];

                if (!currentPermissions.includes('MANAGE_USERS')) {
                    return NextResponse.json(
                        { error: 'Forbidden', message: 'Insufficient permissions' },
                        { status: 403 }
                    );
                }
            }

            const userData = await prisma.user.findUnique({
                where: { id: userId },
                include: {
                    userPermissions: {
                        include: {
                            permission: true,
                        },
                    },
                },
            });

            if (!userData) {
                return NextResponse.json(
                    { error: 'Not Found', message: 'User not found' },
                    { status: 404 }
                );
            }

            const formattedUser = {
                id: userData.id,
                name: userData.name,
                email: userData.email,
                phoneNumber: userData.phoneNumber,
                role: userData.role,
                isActive: userData.isActive,
                createdAt: userData.createdAt,
                updatedAt: userData.updatedAt,
                permissions: (userData.userPermissions || [])
                    .filter((up: any) => up.permission)
                    .map((up: any) => ({
                        id: up.permission.id,
                        key: up.permission.key,
                        description: up.permission.description,
                    })),
            };

            return NextResponse.json({
                success: true,
                data: formattedUser,
            });

        } catch (error: any) {
            console.error('Error fetching user:', error);
            return NextResponse.json(
                { error: 'Internal Server Error', message: 'Failed to fetch user' },
                { status: 500 }
            );
        }
    });
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    return requireAuth(request, async (req: NextRequest, authenticatedUser: JWTPayload) => {
        try {
            const userId = parseInt(id);

            if (isNaN(userId)) {
                return NextResponse.json(
                    { error: 'Invalid Request', message: 'Invalid user ID' },
                    { status: 400 }
                );
            }

            const isSelf = authenticatedUser.userId === userId;
            const isSuperAdmin = authenticatedUser.role === 'SUPER_ADMIN';

            // Check if user has permission to update this user
            if (!isSelf && !isSuperAdmin) {
                const dbUser = await prisma.user.findUnique({
                    where: { id: authenticatedUser.userId },
                    include: {
                        userPermissions: {
                            include: {
                                permission: true,
                            },
                        },
                    },
                });

                const currentPermissions = dbUser?.userPermissions.map((p: any) => p.permission.key) || [];

                if (!currentPermissions.includes('MANAGE_USERS')) {
                    return NextResponse.json(
                        { error: 'Forbidden', message: 'Insufficient permissions' },
                        { status: 403 }
                    );
                }
            }

            const body = await req.json();
            const { name, email, phoneNumber, password, role, isActive, permissionIds } = body;

            // Block self-permission/role/status editing
            if (isSelf) {
                if (role || typeof isActive === 'boolean' || permissionIds) {
                    return NextResponse.json(
                        { 
                            error: 'Forbidden', 
                            message: 'You cannot modify your own permissions, role, or active status' 
                        },
                        { status: 403 }
                    );
                }
            }

            // Get existing user
            const existingUser = await prisma.user.findUnique({
                where: { id: userId },
            });

            if (!existingUser) {
                return NextResponse.json(
                    { error: 'Not Found', message: 'User not found' },
                    { status: 404 }
                );
            }

            // Prevent modifying own account ONLY if it's not a self-update
            // (The existing code blocked any self-modification, even name/email)
            // if (userId === user.userId) { ... } -> Removed this check since we now allow self-update of basic fields

            // Build update data
            const updateData: any = {};

            if (name) updateData.name = name.trim();
            if (email) updateData.email = email.toLowerCase().trim();
            if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber?.trim() || null;
            if (role) updateData.role = role;
            if (typeof isActive === 'boolean') updateData.isActive = isActive;
            if (password) {
                updateData.passwordHash = await hashPassword(password);
            }

            // Validate permissions if provided
            if (permissionIds && Array.isArray(permissionIds) && permissionIds.length > 0) {
                // If not SUPER_ADMIN, verify that user can assign these permissions
                if (authenticatedUser.role !== 'SUPER_ADMIN') {
                    // Get current user's permissions from database
                    const dbUser = await prisma.user.findUnique({
                        where: { id: authenticatedUser.userId },
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

                    // Get permission IDs that the current user has
                    const userPermissionIds = dbUser.userPermissions.map((up: any) => up.permission.id);

                    // Validate that all requested permissions are in user's permissions
                    const requestedPermissionIds = permissionIds.map((pid: any) => 
                        typeof pid === 'string' ? parseInt(pid) : pid
                    );

                    const invalidPermissions = requestedPermissionIds.filter(
                        (pid: number) => !userPermissionIds.includes(pid)
                    );

                    if (invalidPermissions.length > 0) {
                        return NextResponse.json(
                            { 
                                error: 'Forbidden', 
                                message: 'You can only assign permissions that you have',
                                invalidPermissions 
                            },
                            { status: 403 }
                        );
                    }
                }
            }

            // Use transaction for atomic updates
            const updatedUser = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
                // Update user details
                const user = await tx.user.update({
                    where: { id: userId },
                    data: updateData,
                });

                // Update permissions if provided
                if (permissionIds && Array.isArray(permissionIds)) {
                    // Remove existing permissions
                    await tx.userPermission.deleteMany({
                        where: { userId },
                    });

                    // Add new permissions
                    if (permissionIds.length > 0) {
                        await tx.userPermission.createMany({
                            data: permissionIds.map((pid: any) => ({
                                userId,
                                permissionId: typeof pid === 'string' ? parseInt(pid) : pid,
                            })),
                        });
                    }
                }

                const userPermissions = await tx.userPermission.findMany({
                    where: { userId },
                    include: {
                        permission: true,
                    },
                });

                const permissions = userPermissions.map((up: any) => ({
                    id: up.permission.id,
                    key: up.permission.key,
                    description: up.permission.description,
                }));

                return {
                    ...user,
                    permissions,
                };
            });

            await prisma.activityLog.create({
                data: {
                    userId: authenticatedUser.userId,
                    actionType: ActionType.USER_MANAGEMENT,
                    actionPerformed: `Updated user: ${existingUser.email}`,
                    affectedEntityType: 'USER',
                    affectedEntityId: userId,
                    details: JSON.stringify({
                        updatedBy: authenticatedUser.email,
                        updatedFields: Object.keys(updateData),
                        permissionsUpdated: !!permissionIds,
                    }),
                },
            });

            return NextResponse.json({
                success: true,
                message: 'User updated successfully',
                data: {
                    id: updatedUser.id,
                    name: updatedUser.name,
                    email: updatedUser.email,
                    phoneNumber: updatedUser.phoneNumber,
                    role: updatedUser.role,
                    isActive: updatedUser.isActive,
                    permissions: updatedUser.permissions,
                },
            });

        } catch (error: any) {
            console.error('Error updating user:', error);
            // Check for unique constraint violation (e.g. email already exists)
            if (error.code === 'P2002') {
                return NextResponse.json(
                    { error: 'Conflict', message: 'Email already exists' },
                    { status: 409 }
                );
            }
            return NextResponse.json(
                { error: 'Internal Server Error', message: error.message || 'Failed to update user' },
                { status: 500 }
            );
        }
    });
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    return requirePermission(request, 'MANAGE_USERS', async (req, user) => {
        try {
            const userId = parseInt(id);

            if (isNaN(userId)) {
                return NextResponse.json(
                    { error: 'Invalid Request', message: 'Invalid user ID' },
                    { status: 400 }
                );
            }

            // Prevent deleting own account
            if (userId === user.userId) {
                return NextResponse.json(
                    { error: 'Invalid Operation', message: 'Cannot delete your own account' },
                    { status: 400 }
                );
            }

            const existingUser = await prisma.user.findUnique({
                where: { id: userId },
            });

            if (!existingUser) {
                return NextResponse.json(
                    { error: 'Not Found', message: 'User not found' },
                    { status: 404 }
                );
            }

            // Soft delete by deactivating
            await prisma.user.update({
                where: { id: userId },
                data: { isActive: false },
            });

            // Log the deletion
            await prisma.activityLog.create({
                data: {
                    userId: user.userId,
                    actionType: ActionType.USER_MANAGEMENT,
                    actionPerformed: `Deactivated user: ${existingUser.email}`,
                    affectedEntityType: 'USER',
                    affectedEntityId: userId,
                    details: JSON.stringify({
                        deletedBy: user.email,
                    }),
                },
            });

            return NextResponse.json({
                success: true,
                message: 'User deactivated successfully',
            });

        } catch (error: any) {
            console.error('Error deleting user:', error);
            return NextResponse.json(
                { error: 'Internal Server Error', message: 'Failed to delete user' },
                { status: 500 }
            );
        }
    });
}
