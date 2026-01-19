import prisma from '@/lib/prisma';
import { ActionType } from '@/lib/enums';

/**
 * Creates notifications for all admins with MANAGE_REQUESTS permission
 * when a request-related action occurs
 * 
 * @param actionType - The type of action (REQUEST_MANAGEMENT, SYSTEM_INTEGRATION)
 * @param actionPerformed - Description of the action
 * @param affectedEntityType - Type of entity (REQUEST, API_CALL)
 * @param affectedEntityId - ID of the affected entity
 * @param excludeUserId - User ID to exclude from notifications (the user who performed the action)
 */
export async function createRequestNotifications(
    actionType: ActionType,
    actionPerformed: string,
    affectedEntityType: string,
    affectedEntityId: number | null,
    excludeUserId?: number
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
    } catch (error) {
        console.error('Error creating request notifications:', error);
        // Don't throw - notifications are not critical for the main flow
    }
}

