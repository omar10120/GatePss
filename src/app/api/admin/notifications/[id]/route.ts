import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/api';
import prisma from '@/lib/prisma';
import { getNotificationNavigationUrl } from '@/utils/notifications';

/**
 * GET /api/admin/notifications/:id
 * Get notification details by ID
 */
export async function GET(
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

            // Get notification and verify it belongs to the user
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

            const navigationUrl = getNotificationNavigationUrl(
                notification.actionType,
                notification.affectedEntityType,
                notification.affectedEntityId
            );

            return NextResponse.json({
                success: true,
                data: {
                    id: notification.id,
                    userId: notification.userId,
                    actionType: notification.actionType,
                    actionPerformed: notification.actionPerformed,
                    affectedEntityType: notification.affectedEntityType,
                    affectedEntityId: notification.affectedEntityId,
                    isRead: notification.isRead,
                    createdAt: notification.createdAt.toISOString(),
                    updatedAt: notification.updatedAt.toISOString(),
                    navigationUrl,
                },
            });
        });
    } catch (error: any) {
        console.error('Error in notification details API:', error);
        return NextResponse.json(
            {
                error: 'Internal Server Error',
                message: error.message || 'Failed to fetch notification',
                details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/admin/notifications/:id
 * Delete a notification
 */
export async function DELETE(
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

            // Verify notification belongs to the user before deleting
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

            // Delete the notification
            await prisma.notification.delete({
                where: { id: notificationId },
            });

            return NextResponse.json({
                success: true,
                message: 'Notification deleted successfully',
            });
        });
    } catch (error: any) {
        console.error('Error deleting notification:', error);
        return NextResponse.json(
            {
                error: 'Internal Server Error',
                message: error.message || 'Failed to delete notification',
                details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            },
            { status: 500 }
        );
    }
}

