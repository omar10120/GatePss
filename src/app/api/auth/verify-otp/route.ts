import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateToken } from '@/lib/auth';
import { ActionType } from '@/lib/enums';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, otp } = body;

        if (!email || !otp) {
            return NextResponse.json(
                { error: 'Validation Error', message: 'Email and OTP are required' },
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
            return NextResponse.json(
                { error: 'Authentication Failed', message: 'No account found with this email address' },
                { status: 401 }
            );
        }

        if (!user.isActive) {
            return NextResponse.json(
                { error: 'Authentication Failed', message: 'User account is inactive' },
                { status: 403 }
            );
        }

        // Check if OTP exists and is valid
        if (!user.otpCode || !user.otpExpiresAt) {
            await prisma.activityLog.create({
                data: {
                    actionType: ActionType.AUTH,
                    actionPerformed: `Failed OTP verification - no OTP found for user: ${email}`,
                    affectedEntityType: 'USER',
                    affectedEntityId: user.id,
                    userId: user.id,
                    details: JSON.stringify({ email, reason: 'No OTP found' }),
                },
            });

            return NextResponse.json(
                { error: 'Authentication Failed', message: 'No OTP code was found for your account. Please request a new OTP code.' },
                { status: 401 }
            );
        }

        // Check if OTP is expired
        if (new Date() > user.otpExpiresAt) {
            await prisma.activityLog.create({
                data: {
                    actionType: ActionType.AUTH,
                    actionPerformed: `Failed OTP verification - expired OTP for user: ${email}`,
                    affectedEntityType: 'USER',
                    affectedEntityId: user.id,
                    userId: user.id,
                    details: JSON.stringify({ email, reason: 'OTP expired' }),
                },
            });

            return NextResponse.json(
                { error: 'Authentication Failed', message: 'The OTP code has expired. Please request a new OTP code.' },
                { status: 401 }
            );
        }

        // Verify OTP
        if (user.otpCode !== otp) {
            await prisma.activityLog.create({
                data: {
                    actionType: ActionType.AUTH,
                    actionPerformed: `Failed OTP verification - invalid OTP for user: ${email}`,
                    affectedEntityType: 'USER',
                    affectedEntityId: user.id,
                    userId: user.id,
                    details: JSON.stringify({ email, reason: 'Invalid OTP' }),
                },
            });

            return NextResponse.json(
                { error: 'Authentication Failed', message: 'The OTP code you entered is incorrect. Please check the code and try again, or request a new OTP code.' },
                { status: 401 }
            );
        }

        // OTP is valid - clear it and generate token
        await prisma.user.update({
            where: { id: user.id },
            data: {
                otpCode: null,
                otpExpiresAt: null,
            },
        });

        // Get user permissions
        const permissions = user.userPermissions.map((up: { permission: { key: string } }) => up.permission.key);

        // Generate JWT token
        const token = generateToken({
            userId: user.id,
            email: user.email,
            role: user.role,
            permissions,
            permissionsDetails: user.userPermissions.map((up: { permission: { id: number; key: string; description: string } }) => ({
                id: up.permission.id,
                key: up.permission.key,
                description: up.permission.description,
            })),
        });

        // Log successful verification
        await prisma.activityLog.create({
            data: {
                actionType: ActionType.AUTH,
                actionPerformed: `Successful OTP verification and login for user: ${email}`,
                affectedEntityType: 'USER',
                affectedEntityId: user.id,
                userId: user.id,
                details: JSON.stringify({ email }),
            },
        });

        return NextResponse.json({
            success: true,
            message: 'OTP verified successfully',
            data: {
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    permissions,
                    permissionsDetails: user.userPermissions.map((up: { permission: { id: number; key: string; description: string } }) => ({
                        id: up.permission.id,
                        key: up.permission.key,
                        description: up.permission.description,
                    })),
                },
            },
        });

    } catch (error: any) {
        console.error('Verify OTP error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', message: 'An error occurred during OTP verification' },
            { status: 500 }
        );
    }
}

