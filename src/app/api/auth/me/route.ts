import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';
import { TokenExpiredError } from 'jsonwebtoken';

export async function GET(request: NextRequest) {
    try {
        const token = extractTokenFromHeader(request.headers.get('Authorization'));

        if (!token) {
            return NextResponse.json(
                { error: 'Unauthorized', message: 'No token provided' },
                { status: 401 }
            );
        }

        let payload: ReturnType<typeof verifyToken>;
        try {
            payload = verifyToken(token);
        } catch (error) {
            if (error instanceof TokenExpiredError) {
                // Return 401 with specific error code for client-side handling
                return NextResponse.json(
                    { error: 'Unauthorized', message: 'Session expired. Please login again.', code: 'TOKEN_EXPIRED' },
                    { status: 401 }
                );
            }
            return NextResponse.json(
                { error: 'Unauthorized', message: 'Invalid token' },
                { status: 401 }
            );
        }

        if (!payload) {
            return NextResponse.json(
                { error: 'Unauthorized', message: 'Invalid token' },
                { status: 401 }
            );
        }

        // Fetch fresh user data
        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
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
                { error: 'Not Found', message: 'User not found' },
                { status: 404 }
            );
        }

        if (!user.isActive) {
            return NextResponse.json(
                { error: 'Forbidden', message: 'User is inactive' },
                { status: 403 }
            );
        }

        // Format permissions as array of strings
        const permissions = user.userPermissions.map((up: any) => up.permission.key);

        return NextResponse.json({
            success: true,
            data: {
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
        console.error('Error fetching user profile:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', message: 'Failed to fetch user profile' },
            { status: 500 }
        );
    }
}
