import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/api';
import prisma from '@/lib/prisma';

/**
 * GET /api/admin/notifications/unread-count
 * Get count of unread notifications for the authenticated user
 * 
 * Query Parameters:
 * - actionType: string (optional) - Count only notifications of this action type
 */
export async function GET(request: NextRequest) {
    try {
        return await requireAuth(request, async (req, user) => {
            const { searchParams } = new URL(req.url);
            const actionType = searchParams.get('actionType');

            // Build where clause
            const where: any = {
                userId: user.userId,
                isRead: false,
            };

            if (actionType) {
                where.actionType = actionType;
            }

            // Get count of unread notifications
            const count = await prisma.notification.count({ where });

            return NextResponse.json({
                success: true,
                data: {
                    unreadCount: count,
                },
            });
        });
    } catch (error: any) {
        console.error('Error getting unread count:', error);
        return NextResponse.json(
            {
                error: 'Internal Server Error',
                message: error.message || 'Failed to get unread count',
                details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            },
            { status: 500 }
        );
    }
}

