import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/api';
import prisma from '@/lib/prisma';
import { ActionType } from '@/lib/enums';
import { getNotificationNavigationUrl } from '@/utils/notifications';


export async function GET(request: NextRequest) {
    try {
        return await requireAuth(request, async (req, user) => {
            const { searchParams } = new URL(req.url);
            
            // Parse query parameters
            const isReadParam = searchParams.get('isRead');
            const actionType = searchParams.get('actionType') as ActionType | null;
            const dateFilter = searchParams.get('dateFilter');
            const dateFrom = searchParams.get('dateFrom');
            const dateTo = searchParams.get('dateTo');
            const search = searchParams.get('search');
            const page = parseInt(searchParams.get('page') || '1');
            const limit = parseInt(searchParams.get('limit') || '20');
            const skip = (page - 1) * limit;

            // Build where clause - always filter by current user
            const where: any = {
                userId: user.userId,
            };

            // Filter by read status
            if (isReadParam !== null) {
                where.isRead = isReadParam === 'true';
            }

            // Filter by action type
            if (actionType) {
                where.actionType = actionType;
            }

            // Handle date filters
            if (dateFilter && !dateFrom && !dateTo) {
                const now = new Date();
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                let startDate: Date;
                let endDate: Date = new Date(today);
                endDate.setHours(23, 59, 59, 999);

                switch (dateFilter) {
                    case 'today':
                        startDate = new Date(today);
                        startDate.setHours(0, 0, 0, 0);
                        break;
                    case 'yesterday':
                        startDate = new Date(today);
                        startDate.setDate(startDate.getDate() - 1);
                        startDate.setHours(0, 0, 0, 0);
                        endDate = new Date(today);
                        endDate.setHours(0, 0, 0, 0);
                        endDate.setMilliseconds(-1);
                        break;
                    case 'this_week':
                        startDate = new Date(today);
                        startDate.setDate(startDate.getDate() - startDate.getDay());
                        startDate.setHours(0, 0, 0, 0);
                        break;
                    case 'this_month':
                        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                        startDate.setHours(0, 0, 0, 0);
                        break;
                    default:
                        startDate = new Date(today);
                        startDate.setHours(0, 0, 0, 0);
                }

                where.createdAt = {
                    gte: startDate,
                    lte: endDate,
                };
            } else if (dateFrom || dateTo) {
                where.createdAt = {};
                if (dateFrom) {
                    where.createdAt.gte = new Date(dateFrom);
                }
                if (dateTo) {
                    where.createdAt.lte = new Date(dateTo);
                }
            }

            // Search in action performed
            if (search) {
                where.actionPerformed = {
                    contains: search,
                };
            }

            // Get total count
            const total = await prisma.notification.count({ where });

            // Get notifications
            const notifications = await prisma.notification.findMany({
                where,
                orderBy: {
                    createdAt: 'desc',
                },
                skip,
                take: limit,
            });

            // Format response with navigation URL
            const formattedNotifications = notifications.map((notification) => {
                const navigationUrl = getNotificationNavigationUrl(
                    notification.actionType,
                    notification.affectedEntityType,
                    notification.affectedEntityId
                );

                // Access actionPerformedAr using bracket notation to avoid TypeScript error
                // until Prisma client is regenerated
                const actionPerformedAr = (notification as any).actionPerformedAr;

                return {
                    id: notification.id,
                    userId: notification.userId,
                    actionType: notification.actionType,
                    actionPerformed: notification.actionPerformed,
                    actionPerformedAr: actionPerformedAr || null,
                    affectedEntityType: notification.affectedEntityType,
                    affectedEntityId: notification.affectedEntityId,
                    isRead: notification.isRead,
                    createdAt: notification.createdAt.toISOString(),
                    updatedAt: notification.updatedAt.toISOString(),
                    navigationUrl,
                };
            });

            return NextResponse.json({
                success: true,
                data: {
                    notifications: formattedNotifications,
                    pagination: {
                        page,
                        limit,
                        total,
                        totalPages: Math.ceil(total / limit),
                    },
                },
            });
        });
    } catch (error: any) {
        console.error('Error in notifications API:', error);
        return NextResponse.json(
            {
                error: 'Internal Server Error',
                message: error.message || 'Failed to fetch notifications',
                details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            },
            { status: 500 }
        );
    }
}

