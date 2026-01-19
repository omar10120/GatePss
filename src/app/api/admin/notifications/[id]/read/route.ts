import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/api';
import prisma from '@/lib/prisma';

/**
 * PUT /api/admin/notifications/:id/read
 * Mark a notification as read
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        return await requireAuth(request, async (req, user) => {
            const { id } = await params;
            const notificationId = parseInt(id);

            if (isNaN(notificationId)) {
                return NextResponse.json(
                    { error: 'Bad Request', message: 'Invalid notification ID' },
                    { status: 400 }
                );
            }

            // Verify notification belongs to the user
            const notification = await prisma.notification.findFirst({
                where: {
                    id: notificationId,
                    userId: user.userId,
                },
            });

            if (!notification) {
                return NextResponse.json(
                    { error: 'Not Found', message: 'Notification not found' },
                    { status: 404 }
                );
            }

            // Update notification to read
            const updatedNotification = await prisma.notification.update({
                where: { id: notificationId },
                data: { isRead: true },
            });

            return NextResponse.json({
                success: true,
                message: 'Notification marked as read',
                data: {
                    id: updatedNotification.id,
                    isRead: updatedNotification.isRead,
                    updatedAt: updatedNotification.updatedAt.toISOString(),
                },
            });
        });
    } catch (error: any) {
        console.error('Error marking notification as read:', error);
        return NextResponse.json(
            {
                error: 'Internal Server Error',
                message: error.message || 'Failed to mark notification as read',
                details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            },
            { status: 500 }
        );
    }
}

