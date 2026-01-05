import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyPassword, generateToken } from '@/lib/auth';
import { ActionType } from '@prisma/client';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password } = body;

        // Validate input
        if (!email || !password) {
            return NextResponse.json(
                { error: 'Validation Error', message: 'Email and password are required' },
                { status: 400 }
            );
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                permissions: {
                    include: {
                        permission: true,
                    },
                },
            },
        });

        if (!user) {
            // Log failed login attempt
            await prisma.activityLog.create({
                data: {
                    actionType: ActionType.AUTH,
                    actionPerformed: `Failed login attempt for email: ${email}`,
                    affectedEntityType: 'USER',
                    details: JSON.stringify({ email, reason: 'User not found' }),
                },
            });

            return NextResponse.json(
                { error: 'Authentication Failed', message: 'Invalid email or password' },
                { status: 401 }
            );
        }

        // Check if user is active
        if (!user.isActive) {
            await prisma.activityLog.create({
                data: {
                    actionType: ActionType.AUTH,
                    actionPerformed: `Failed login attempt for inactive user: ${email}`,
                    affectedEntityType: 'USER',
                    affectedEntityId: user.id,
                    userId: user.id,
                    details: JSON.stringify({ email, reason: 'User inactive' }),
                },
            });

            return NextResponse.json(
                { error: 'Authentication Failed', message: 'User account is inactive' },
                { status: 403 }
            );
        }

        // Verify password
        const isPasswordValid = await verifyPassword(password, user.passwordHash);

        if (!isPasswordValid) {
            await prisma.activityLog.create({
                data: {
                    actionType: ActionType.AUTH,
                    actionPerformed: `Failed login attempt for user: ${email}`,
                    affectedEntityType: 'USER',
                    affectedEntityId: user.id,
                    userId: user.id,
                    details: JSON.stringify({ email, reason: 'Invalid password' }),
                },
            });

            return NextResponse.json(
                { error: 'Authentication Failed', message: 'Invalid email or password' },
                { status: 401 }
            );
        }

        // Get user permissions
        const permissions = user.permissions.map(up => up.permission.key);

        // Generate JWT token
        const token = generateToken({
            userId: user.id,
            email: user.email,
            role: user.role,
            permissions,
        });

        // Log successful login
        await prisma.activityLog.create({
            data: {
                actionType: ActionType.AUTH,
                actionPerformed: `Successful login for user: ${email}`,
                affectedEntityType: 'USER',
                affectedEntityId: user.id,
                userId: user.id,
                details: JSON.stringify({ email }),
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    permissions,
                },
            },
        });

    } catch (error: any) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', message: 'An error occurred during login' },
            { status: 500 }
        );
    }
}
