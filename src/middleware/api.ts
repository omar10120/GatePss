import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractTokenFromHeader, JWTPayload } from '@/lib/auth';
import prisma from '@/lib/prisma';

export interface AuthenticatedRequest extends NextRequest {
    user?: JWTPayload;
}

export async function authenticate(request: NextRequest): Promise<JWTPayload | null> {
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
        return null;
    }

    const payload = verifyToken(token);
    return payload;
}

export async function requireAuth(
    request: NextRequest,
    handler: (req: NextRequest, user: JWTPayload) => Promise<NextResponse>
): Promise<NextResponse> {
    const user = await authenticate(request);

    if (!user) {
        return NextResponse.json(
            { error: 'Unauthorized', message: 'Authentication required' },
            { status: 401 }
        );
    }

    // Check if user is still active
    const dbUser = await prisma.user.findUnique({
        where: { id: user.userId },
    });

    if (!dbUser || !dbUser.isActive) {
        return NextResponse.json(
            { error: 'Forbidden', message: 'User account is inactive' },
            { status: 403 }
        );
    }

    return handler(request, user);
}

export async function requirePermission(
    request: NextRequest,
    requiredPermission: string,
    handler: (req: NextRequest, user: JWTPayload) => Promise<NextResponse>
): Promise<NextResponse> {
    return requireAuth(request, async (req, user) => {
        // Super Admin has all permissions
        if (user.role === 'SUPER_ADMIN') {
            return handler(req, user);
        }

        // Fetch fresh permissions from database
        const dbUser = await prisma.user.findUnique({
            where: { id: user.userId },
            include: {
                permissions: {
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

        const currentPermissions = dbUser.permissions.map((p: any) => p.permission.key);

        // Check if user has the required permission
        if (!currentPermissions.includes(requiredPermission)) {
            return NextResponse.json(
                { error: 'Forbidden', message: 'Insufficient permissions' },
                { status: 403 }
            );
        }

        return handler(req, user);
    });
}

export async function requireSuperAdmin(
    request: NextRequest,
    handler: (req: NextRequest, user: JWTPayload) => Promise<NextResponse>
): Promise<NextResponse> {
    return requireAuth(request, async (req, user) => {
        if (user.role !== 'SUPER_ADMIN') {
            return NextResponse.json(
                { error: 'Forbidden', message: 'Super Admin access required' },
                { status: 403 }
            );
        }

        return handler(req, user);
    });
}

export function handleError(error: any): NextResponse {
    console.error('API Error:', error);

    if (error.code === 'P2002') {
        return NextResponse.json(
            { error: 'Conflict', message: 'A record with this value already exists' },
            { status: 409 }
        );
    }

    if (error.code === 'P2025') {
        return NextResponse.json(
            { error: 'Not Found', message: 'Record not found' },
            { status: 404 }
        );
    }

    return NextResponse.json(
        { error: 'Internal Server Error', message: error.message || 'An unexpected error occurred' },
        { status: 500 }
    );
}

export function validateRequestBody<T>(
    body: any,
    requiredFields: (keyof T)[]
): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const field of requiredFields) {
        if (!body[field]) {
            errors.push(`${String(field)} is required`);
        }
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}
