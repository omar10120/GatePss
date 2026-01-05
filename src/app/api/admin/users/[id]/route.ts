import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/middleware/api';
import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { ActionType, Prisma } from '@prisma/client';

// PUT /api/admin/users/[id] - Update user
export async function PUT(
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

            const body = await req.json();
            const { name, email, password, role, isActive, permissionIds } = body;

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

            // Prevent modifying own account
            if (userId === user.userId) {
                return NextResponse.json(
                    { error: 'Invalid Operation', message: 'Cannot modify your own account' },
                    { status: 400 }
                );
            }

            // Build update data
            const updateData: any = {};

            if (name) updateData.name = name.trim();
            if (email) updateData.email = email.toLowerCase().trim();
            if (role) updateData.role = role;
            if (typeof isActive === 'boolean') updateData.isActive = isActive;
            if (password) {
                updateData.passwordHash = await hashPassword(password);
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

                return user;
            });

            // Log the update
            await prisma.activityLog.create({
                data: {
                    userId: user.userId,
                    actionType: ActionType.USER_MANAGEMENT,
                    actionPerformed: `Updated user: ${existingUser.email}`,
                    affectedEntityType: 'USER',
                    affectedEntityId: userId,
                    details: JSON.stringify({
                        updatedBy: user.email,
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
                    role: updatedUser.role,
                    isActive: updatedUser.isActive,
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
