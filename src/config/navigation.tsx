import React from 'react';
import { NavItem } from '@/components/layout/Navigation';

export const PERMISSIONS = {
    VIEW_DASHBOARD: 'VIEW_DASHBOARD',
    MANAGE_REQUESTS: 'MANAGE_REQUESTS',
    MANAGE_USERS: 'MANAGE_USERS',
    VIEW_LOGS: 'VIEW_LOGS',
} as const;

export type PermissionKey = typeof PERMISSIONS[keyof typeof PERMISSIONS];

export const PERMISSION_LABELS = {
    en: {
        [PERMISSIONS.VIEW_DASHBOARD]: 'View Dashboard',
        [PERMISSIONS.MANAGE_REQUESTS]: 'Manage Requests',
        [PERMISSIONS.MANAGE_USERS]: 'Manage Users',
        [PERMISSIONS.VIEW_LOGS]: 'View Activity Logs',
    },
    ar: {
        [PERMISSIONS.VIEW_DASHBOARD]: 'عرض لوحة التحكم',
        [PERMISSIONS.MANAGE_REQUESTS]: 'إدارة الطلبات',
        [PERMISSIONS.MANAGE_USERS]: 'إدارة المستخدمين',
        [PERMISSIONS.VIEW_LOGS]: 'عرض سجل النشاط',
    },
};

export const getNavItems = (
    locale: 'en' | 'ar',
    userPermissions: string[] = [],
    userRole?: string,
    currentPath?: string
): NavItem[] => {
    const isSuperAdmin = userRole === 'SUPER_ADMIN';

    const hasPermission = (permission: string) => {
        return isSuperAdmin || userPermissions.includes(permission);
    };

    const items: NavItem[] = [
        {
            label: locale === 'en' ? 'Dashboard' : 'لوحة التحكم',
            href: '/admin/dashboard',
            active: currentPath === '/admin/dashboard',
        },
    ];

    if (hasPermission(PERMISSIONS.MANAGE_REQUESTS)) {
        items.push({
            label: locale === 'en' ? 'Requests' : 'الطلبات',
            href: '/admin/requests',
            active: currentPath?.startsWith('/admin/requests'),
            permission: PERMISSIONS.MANAGE_REQUESTS,
        });
    }

    if (hasPermission(PERMISSIONS.MANAGE_USERS)) {
        items.push({
            label: locale === 'en' ? 'Users' : 'المستخدمون',
            href: '/admin/users',
            active: currentPath === '/admin/users',
            permission: PERMISSIONS.MANAGE_USERS,
        });
    }

    if (hasPermission(PERMISSIONS.VIEW_LOGS)) {
        items.push({
            label: locale === 'en' ? 'Activity Logs' : 'سجل النشاط',
            href: '/admin/activity',
            active: currentPath === '/admin/activity',
            permission: PERMISSIONS.VIEW_LOGS,
        });
    }

    return items;
};

export interface SidebarItem {
    label: string;
    href: string;
    icon: React.ReactNode;
    active?: boolean;
    permission?: string;
}

export const getSidebarItems = (
    locale: 'en' | 'ar',
    userPermissions: string[] = [],
    userRole?: string,
    currentPath?: string
): SidebarItem[] => {
    const isSuperAdmin = userRole === 'SUPER_ADMIN';

    const hasPermission = (permission: string) => {
        return isSuperAdmin || userPermissions.includes(permission);
    };

    const items: SidebarItem[] = [
        {
            label: locale === 'en' ? 'Dashboard' : 'لوحة التحكم',
            href: '/admin/dashboard',
            active: currentPath === '/admin/dashboard',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
            ),
        },
    ];

    if (hasPermission(PERMISSIONS.MANAGE_REQUESTS)) {
        items.push({
            label: locale === 'en' ? 'New Requests' : 'طلبات جديدة',
            href: '/admin/requests?status=PENDING',
            // active will be determined in Sidebar component based on pathname and query params
            permission: PERMISSIONS.MANAGE_REQUESTS,
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            ),
        });
        items.push({
            label: locale === 'en' ? 'Permits' : 'التصاريح',
            href: '/admin/permits',
            active: currentPath === '/admin/permits',
            permission: PERMISSIONS.MANAGE_REQUESTS,
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            ),
        });
    }

    if (hasPermission(PERMISSIONS.VIEW_LOGS)) {
        items.push({
            label: locale === 'en' ? 'Logs' : 'السجلات',
            href: '/admin/activity',
            active: currentPath === '/admin/activity',
            permission: PERMISSIONS.VIEW_LOGS,
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
            ),
        });
    }

    if (hasPermission(PERMISSIONS.MANAGE_USERS)) {
        items.push({
            label: locale === 'en' ? 'Users' : ' المستخدمون',
            href: '/admin/users',
            active: currentPath === '/admin/users',
            permission: PERMISSIONS.MANAGE_USERS,
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v.01M12 14v.01M16 14v.01" />
                </svg>
            ),
        });
    }

    // Add Notifications and Settings (always visible)
    items.push({
        label: locale === 'en' ? 'Notifications' : 'الإشعارات',
        href: '/admin/notifications',
        active: currentPath === '/admin/notifications',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
        ),
    });

    items.push({
        label: locale === 'en' ? 'Settings' : 'الإعدادات',
        href: '/admin/settings',
        active: currentPath === '/admin/settings',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        ),
    });

    return items;
};

