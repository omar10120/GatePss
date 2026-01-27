import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/middleware/api';
import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        return await requirePermission(request, 'MANAGE_USERS', async (req, user) => {
            try {
                const { searchParams } = new URL(req.url);
                const page = parseInt(searchParams.get('page') || '1');
                const limit = parseInt(searchParams.get('limit') || '10');
                const skip = (page - 1) * limit;
                const search = searchParams.get('search');

                // Build where clause
                const where: any = {};
                if (search) {
                    where.OR = [
                        { name: { contains: search } },
                        { email: { contains: search } },
                    ];
                }

                // Get total count
                const total = await prisma.user.count({ where });

                // Get users with pagination
                const users = await prisma.user.findMany({
                    where {
                        not equal login user
                    },
                    include: {
                        userPermissions: {
                            include: {
                                permission: true,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                    skip,
                    take: limit,
                });

                const formattedUsers = users.map((u: any) => ({
                    id: u.id,
                    name: u.name,
                    email: u.email,
                    phoneNumber: u.phoneNumber,
                    role: u.role,
                    isActive: u.isActive,
                    createdAt: u.createdAt,
                    updatedAt: u.updatedAt,
                    permissions: (u.userPermissions || [])
                        .filter((up: any) => up.permission) // Filter out any null permissions
                        .map((up: any) => ({
                            id: up.permission.id,
                            key: up.permission.key,
                            description: up.permission.description,
                        })),
                }));

                return NextResponse.json({
                    success: true,
                    data: {
                        users: formattedUsers,
                        pagination: {
                            page,
                            limit,
                            total,
                            totalPages: Math.ceil(total / limit),
                        },
                    },
                });

            } catch (error: any) {
                console.error('Error fetching users:', error);
                return NextResponse.json(
                    {
                        error: 'Internal Server Error',
                        message: error.message || 'Failed to fetch users',
                        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
                    },
                    { status: 500 }
                );
            }
        });
    } catch (error: any) {
        console.error('Error in users API:', error);
        return NextResponse.json(
            {
                error: 'Internal Server Error',
                message: error.message || 'Failed to process request',
                details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    return requirePermission(request, 'MANAGE_USERS', async (req, user) => {
        try {
            const body = await req.json();
            const { name, email, phoneNumber, password, role, permissionIds } = body;

            // Validate input - BRD requirements
            const errors: string[] = [];

            if (!name || name.trim().length < 2) {
                errors.push('Name is required (minimum 2 characters)');
            }

            if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                errors.push('Valid email address is required');
            }

            if (!password || password.length < 6) {
                errors.push('Password is required (minimum 6 characters)');
            }

            if (!role || !['SUPER_ADMIN', 'SUB_ADMIN'].includes(role)) {
                errors.push('Valid role is required (SUPER_ADMIN or SUB_ADMIN)');
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
                    phoneNumber: phoneNumber?.trim() || null,
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
                    phoneNumber: newUser.phoneNumber,
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
