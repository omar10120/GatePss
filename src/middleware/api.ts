import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractTokenFromHeader, JWTPayload } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { TokenExpiredError } from 'jsonwebtoken';

export interface AuthenticatedRequest extends NextRequest {
    user?: JWTPayload;
}

export async function authenticate(request: NextRequest): Promise<JWTPayload | null> {
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
        return null;
    }

    try {
        const payload = verifyToken(token);
        return payload;
    } catch (error) {
        if (error instanceof TokenExpiredError) {
            // Return null to trigger redirect in requireAuth
            return null;
        }
        return null;
    }
}

export async function requireAuth(
    request: NextRequest,
    handler: (req: NextRequest, user: JWTPayload) => Promise<NextResponse>
): Promise<NextResponse> {
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
        return NextResponse.json(
            { error: 'Unauthorized', message: 'Authentication required' },
            { status: 401 }
        );
    }

    // Verify token once to check expiration status
    let isExpired = false;
    let payload: JWTPayload | null = null;

    try {
        payload = verifyToken(token);
    } catch (error) {
        if (error instanceof TokenExpiredError) {
            isExpired = true;
        }
        // For other errors, payload remains null
    }

    // If token is expired, return with specific error code
    if (isExpired) {
        return NextResponse.json(
            { error: 'Unauthorized', message: 'Session expired. Please login again.', code: 'TOKEN_EXPIRED' },
            { status: 401 }
        );
    }

    // If token is invalid or payload is null
    if (!payload) {
        return NextResponse.json(
            { error: 'Unauthorized', message: 'Authentication required' },
            { status: 401 }
        );
    }

    const user = payload;

    // Check if user is still active and if role/permissions have changed
    const dbUser = await prisma.user.findUnique({
        where: { id: user.userId },
        include: {
            userPermissions: {
                include: {
                    permission: true,
                },
            },
        },
    });

    if (!dbUser || !dbUser.isActive) {
        return NextResponse.json(
            { error: 'Forbidden', message: 'User account is inactive' },
            { status: 403 }
        );
    }

    // Verify that the role and permissions in the token still match the database
    const dbPermissionKeys = dbUser.userPermissions.map((up: any) => up.permission.key);
    
    const roleMismatch = dbUser.role !== user.role;
    const permissionsMismatch = 
        dbPermissionKeys.length !== user.permissions.length ||
        !dbPermissionKeys.every(key => user.permissions.includes(key));

    if (roleMismatch || permissionsMismatch) {
        return NextResponse.json(
            { error: 'Unauthorized', message: 'Session expired due to role or permission changes. Please login again.', code: 'TOKEN_EXPIRED' },
            { status: 401 }
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

        const currentPermissions = dbUser.userPermissions.map((p: any) => p.permission.key);

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
