import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/middleware/api';
import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

export async function GET(request: NextRequest) {
    return requirePermission(request, 'MANAGE_USERS', async (req, user) => {
        try {
            const users = await prisma.user.findMany({
                include: {
                    permissions: {
                        include: {
                            permission: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            });

            const formattedUsers = users.map((u: any) => ({
                id: u.id,
                name: u.name,
                email: u.email,
                role: u.role,
                isActive: u.isActive,
                createdAt: u.createdAt,
                updatedAt: u.updatedAt,
                permissions: u.permissions.map((up: any) => ({
                    id: up.permission.id,
                    key: up.permission.key,
                    description: up.permission.description,
                })),
            }));

            return NextResponse.json({
                success: true,
                data: formattedUsers,
            });

        } catch (error: any) {
            console.error('Error fetching users:', error);
            return NextResponse.json(
                { error: 'Internal Server Error', message: 'Failed to fetch users' },
                { status: 500 }
            );
        }
    });
}

export async function POST(request: NextRequest) {
    return requirePermission(request, 'MANAGE_USERS', async (req, user) => {
        try {
            const body = await req.json();
            const { name, email, password, role, permissionIds } = body;

            // Validate input
            const errors: string[] = [];

            if (!name || name.trim().length < 2) {
                errors.push('Name is required (minimum 2 characters)');
            }

            if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                errors.push('Valid email is required');
            }

            if (!password || password.length < 6) {
                errors.push('Password is required (minimum 6 characters)');
            }

            if (!role || !['SUPER_ADMIN', 'SUB_ADMIN'].includes(role)) {
                errors.push('Valid role is required');
            }

            if (errors.length > 0) {
                return NextResponse.json(
                    { error: 'Validation Error', message: 'Please fix the following errors', errors },
                    { status: 400 }
                );
            }

            // Check if email already exists
            const existingUser = await prisma.user.findUnique({
                where: { email: email.toLowerCase().trim() },
            });

            if (existingUser) {
                return NextResponse.json(
                    { error: 'Conflict', message: 'A user with this email already exists' },
                    { status: 409 }
                );
            }

            // Hash password
            const passwordHash = await hashPassword(password);

            // Create user
            const newUser = await prisma.user.create({
                data: {
                    name: name.trim(),
                    email: email.toLowerCase().trim(),
                    passwordHash,
                    role,
                    isActive: true,
                },
            });

            // Assign permissions
            if (permissionIds && Array.isArray(permissionIds)) {
                for (const permissionId of permissionIds) {
                    await prisma.userPermission.create({
                        data: {
                            userId: newUser.id,
                            permissionId: parseInt(permissionId),
                        },
                    });
                }
            }

            // Log the creation
            await prisma.activityLog.create({
                data: {
                    userId: user.userId,
                    actionType: 'USER_MANAGEMENT' as any,
                    actionPerformed: `Created new user: ${newUser.email}`,
                    affectedEntityType: 'USER',
                    affectedEntityId: newUser.id,
                    details: JSON.stringify({
                        createdBy: user.email,
                        userRole: role,
                        permissionCount: permissionIds?.length || 0,
                    }),
                },
            });

            return NextResponse.json({
                success: true,
                message: 'User created successfully',
                data: {
                    id: newUser.id,
                    name: newUser.name,
                    email: newUser.email,
                    role: newUser.role,
                    isActive: newUser.isActive,
                },
            }, { status: 201 });

        } catch (error: any) {
            console.error('Error creating user:', error);
            return NextResponse.json(
                { error: 'Internal Server Error', message: 'Failed to create user' },
                { status: 500 }
            );
        }
    });
}
