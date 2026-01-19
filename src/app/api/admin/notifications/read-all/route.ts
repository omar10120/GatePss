import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/api';
import prisma from '@/lib/prisma';

/**
 * PUT /api/admin/notifications/read-all
 * Mark all notifications as read for the authenticated user
 * 
 * Query Parameters:
 * - actionType: string (optional) - Only mark notifications of this action type as read
 */
export async function PUT(request: NextRequest) {
    try {
        return await requireAuth(request, async (req, user) => {
            const { searchParams } = new URL(req.url);
            const actionType = searchParams.get('actionType');

            // Build where clause
            const where: any = {
                userId: user.userId,
                isRead: false, // Only update unread notifications
            };

            if (actionType) {
                where.actionType = actionType;
            }

            // Update all unread notifications
            const result = await prisma.notification.updateMany({
                where,
                data: { isRead: true },
            });

            return NextResponse.json({
                success: true,
                message: `${result.count} notification(s) marked as read`,
                data: {
                    count: result.count,
                },
            });
        });
    } catch (error: any) {
        console.error('Error marking all notifications as read:', error);
        return NextResponse.json(
            {
                error: 'Internal Server Error',
                message: error.message || 'Failed to mark notifications as read',
                details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            },
            { status: 500 }
        );
    }
}

