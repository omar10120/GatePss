import { ActionType } from '@/lib/enums';

/**
 * Determines the navigation URL for a notification based on its action type and affected entity
 * @param actionType - The type of action (REQUEST_MANAGEMENT, USER_MANAGEMENT, SYSTEM_INTEGRATION)
 * @param affectedEntityType - The type of entity affected (REQUEST, USER, API_CALL)
 * @param affectedEntityId - The ID of the affected entity
 * @returns The URL to navigate to, or null if no navigation is available
 */
export function getNotificationNavigationUrl(
    actionType: string,
    affectedEntityType: string | null,
    affectedEntityId: number | null
): string | null {
    // Request Management notifications should navigate to request details
    if (actionType === ActionType.REQUEST_MANAGEMENT && affectedEntityType === 'REQUEST' && affectedEntityId) {
        return `/admin/requests/${affectedEntityId}`;
    }

    // User Management notifications should navigate to user details
    if (actionType === ActionType.USER_MANAGEMENT && affectedEntityType === 'USER' && affectedEntityId) {
        return `/admin/users/${affectedEntityId}`;
    }

    // System Integration notifications should navigate to activity logs
    if (actionType === ActionType.SYSTEM_INTEGRATION) {
        return `/admin/activity?actionType=${ActionType.SYSTEM_INTEGRATION}`;
    }

    // For new requests, navigate to requests list filtered by pending
    if (actionType === ActionType.REQUEST_MANAGEMENT && affectedEntityType === 'REQUEST') {
        return `/admin/requests?status=PENDING`;
    }

    // Default: no navigation
    return null;
}

/**
 * Gets the icon type identifier for a notification based on action type
 */
export function getNotificationIconType(actionType: string): 'request' | 'user' | 'approval' | 'default' {
    switch (actionType) {
        case ActionType.REQUEST_MANAGEMENT:
            return 'request';
        case ActionType.USER_MANAGEMENT:
            return 'user';
        case ActionType.SYSTEM_INTEGRATION:
            return 'approval';
        default:
            return 'default';
    }
}

