import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendOTPEmail } from '@/lib/email';
import { ActionType } from '@/lib/enums';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json(
                { error: 'Validation Error', message: 'Email is required' },
                { status: 400 }
            );
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'Not Found', message: 'User not found' },
                { status: 404 }
            );
        }

        if (!user.isActive) {
            return NextResponse.json(
                { error: 'Forbidden', message: 'User account is inactive' },
                { status: 403 }
            );
        }

        // Generate 4-digit OTP
        const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
        const otpExpiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now

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
            // Don't fail the request if email fails, but log it
        }

        // Log OTP sent
        await prisma.activityLog.create({
            data: {
                actionType: ActionType.AUTH,
                actionPerformed: `OTP sent to user: ${email}`,
                affectedEntityType: 'USER',
                affectedEntityId: user.id,
                userId: user.id,
                details: JSON.stringify({ email }),
            },
        });

        return NextResponse.json({
            success: true,
            message: 'OTP sent successfully',
        });

    } catch (error: any) {
        console.error('Send OTP error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', message: 'An error occurred while sending OTP' },
            { status: 500 }
        );
    }
}

