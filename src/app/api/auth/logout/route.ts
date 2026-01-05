import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/api';
import { ActionType } from '@prisma/client';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
    return requireAuth(request, async (req, user) => {
        // Log logout
        await prisma.activityLog.create({
            data: {
                actionType: ActionType.AUTH,
                actionPerformed: `User logged out: ${user.email}`,
                affectedEntityType: 'USER',
                affectedEntityId: user.userId,
                userId: user.userId,
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Logout successful',
        });
    });
}
