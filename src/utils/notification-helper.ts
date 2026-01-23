import prisma from '@/lib/prisma';
import { ActionType } from '@/lib/enums';

/**
 * Creates notifications for all admins with MANAGE_REQUESTS permission
 * when a request-related action occurs
 * 
 * @param actionType - The type of action (REQUEST_MANAGEMENT, SYSTEM_INTEGRATION)
 * @param actionPerformed - Description of the action (English)
 * @param affectedEntityType - Type of entity (REQUEST, API_CALL)
 * @param affectedEntityId - ID of the affected entity
 * @param excludeUserId - User ID to exclude from notifications (the user who performed the action)
 * @param actionPerformedAr - Description of the action (Arabic, optional)
 */
export async function createRequestNotifications(
    actionType: ActionType,
    actionPerformed: string,
    affectedEntityType: string,
    affectedEntityId: number | null,
    excludeUserId?: number,
    actionPerformedAr?: string
): Promise<void> {
    try {
        // Get all active admins with MANAGE_REQUESTS permission
        const admins = await prisma.user.findMany({
            where: {
                isActive: true,
                OR: [
                    { role: 'SUPER_ADMIN' },
                    {
                        userPermissions: {
                            some: {
                                permission: {
                                    key: 'MANAGE_REQUESTS',
                                },
                            },
                        },
                    },
                ],
            },
            select: {
                id: true,
            },
        });

        // Filter out the user who performed the action (to avoid self-notifications)
        const adminIds = admins
            .map(admin => admin.id)
            .filter(id => id !== excludeUserId);

        if (adminIds.length === 0) {
            return; // No admins to notify
        }

        // Create notifications for all admins
        // Try to create with Arabic field, fallback to without if column doesn't exist
        try {
            const notificationData = adminIds.map(adminId => {
                const baseData: any = {
                    userId: adminId,
                    actionType,
                    actionPerformed,
                    affectedEntityType,
                    affectedEntityId,
                    isRead: false,
                };
                
                // Only include actionPerformedAr if provided
                if (actionPerformedAr !== undefined) {
                    baseData.actionPerformedAr = actionPerformedAr || null;
                }
                
                return baseData;
            });

            await prisma.notification.createMany({
                data: notificationData,
            });
        } catch (dbError: any) {
            // If the column doesn't exist yet (migration not applied), create without Arabic field
            if (dbError?.code === 'P2000' || dbError?.message?.includes('action_performed_ar')) {
                console.warn('action_performed_ar column not found, creating notification without Arabic version');
                await prisma.notification.createMany({
                    data: adminIds.map(adminId => ({
                        userId: adminId,
                        actionType,
                        actionPerformed,
                        affectedEntityType,
                        affectedEntityId,
                        isRead: false,
                    })),
                });
            } else {
                throw dbError; // Re-throw if it's a different error
            }
        }
    } catch (error) {
        console.error('Error creating request notifications:', error);
        // Don't throw - notifications are not critical for the main flow
    }
}

