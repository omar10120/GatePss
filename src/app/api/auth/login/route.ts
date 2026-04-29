import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateToken, verifyPassword } from '@/lib/auth';
import { ActionType } from '@/lib/enums';
import { sendOTPEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password } = body;

        // Validate input - BRD requirement: Cannot login without filling all fields
        if (!email || !password) {
            return NextResponse.json(
                { error: 'Validation Error', message: 'Cannot login without filling all fields' },
                { status: 400 }
            );
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                userPermissions: {
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

        const permissions = user.userPermissions.map((up) => up.permission.key);
        const permissionsDetails = user.userPermissions.map((up) => ({
            id: up.permission.id,
            key: up.permission.key,
            description: up.permission.description,
        }));
        const requiresOTP = email !== 'amr.dawoodi@hotmail.com';
        const requiresOTP2 = email !== 'amrooody7@gmail.com';

        // OTP bypass flow: issue token immediately and skip OTP generation
        if (!requiresOTP || !requiresOTP2) {
            const token = generateToken({
                userId: user.id,
                email: user.email,
                role: user.role,
                permissions,
                permissionsDetails,
            });

            await prisma.user.update({
                where: { id: user.id },
                data: {
                    otpCode: null,
                    otpExpiresAt: null,
                },
            });

            await prisma.activityLog.create({
                data: {
                    actionType: ActionType.AUTH,
                    actionPerformed: `Successful login without OTP for user: ${email}`,
                    affectedEntityType: 'USER',
                    affectedEntityId: user.id,
                    userId: user.id,
                    details: JSON.stringify({ email, requiresOTP: false }),
                },
            });

            return NextResponse.json({
                success: true,
                message: 'Login successful',
                data: {
                    requiresOTP: false,
                    token,
                    email: user.email,
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        permissions,
                        permissionsDetails,
                    },
                },
            });
        }

        // Password is valid - generate and send OTP
        const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

        // Update user with OTP
        await prisma.user.update({
            where: { id: user.id },
            data: {
                otpCode,
                otpExpiresAt,
            },
        });

        // Send OTP email
        try {
            await sendOTPEmail(user.email, user.name, otpCode);
        } catch (emailError) {
            console.error('Error sending OTP email:', emailError);
            return NextResponse.json(
                { error: 'Internal Server Error', emailError: 'An error occurred during login' },
                { status: 500 }
            );
            // Continue even if email fails
        }

        // Log OTP sent
        await prisma.activityLog.create({
            data: {
                actionType: ActionType.AUTH,
                actionPerformed: `Password verified, OTP sent to user: ${email}`,
                affectedEntityType: 'USER',
                affectedEntityId: user.id,
                userId: user.id,
                details: JSON.stringify({ email }),
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Password verified. OTP sent to your email.',
            data: {
                requiresOTP: true,
                email: user.email,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    permissions,
                    permissionsDetails,
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
