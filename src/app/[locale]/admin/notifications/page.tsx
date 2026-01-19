'use client';

import { useState, useEffect } from 'react';
import { useRouter, Link } from '@/i18n/navigation';
import { Sidebar } from '@/components/layout';
import { getSidebarItems } from '@/config/navigation';
import Header from '../components/Header';
import { useLocale, useTranslations } from 'next-intl';
import { getNotificationIconType } from '@/utils/notifications';
import { ActionType } from '@/lib/enums';

interface Notification {
    id: number;
    userId: number;
    actionType: string;
    actionPerformed: string;
    affectedEntityType: string | null;
    affectedEntityId: number | null;
    isRead: boolean;
    createdAt: string;
    updatedAt: string;
    navigationUrl: string | null;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

interface GroupedNotifications {
    [key: string]: Notification[];
}

export default function NotificationsPage() {
    const router = useRouter();
    const locale = useLocale();
    const isRtl = locale === 'ar';
    const t = useTranslations('Admin.notifications');

    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [groupedNotifications, setGroupedNotifications] = useState<GroupedNotifications>({});
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [user, setUser] = useState<any>(null);
    const [selectedNotifications, setSelectedNotifications] = useState<number[]>([]);
    const [filters, setFilters] = useState({
        isRead: '',
        actionType: '',
        dateFilter: '',
        page: 1,
    });

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token) {
            router.push('/admin/login');
            return;
        }

        if (userData) {
            setUser(JSON.parse(userData));
        }

        fetchNotifications(token);
    }, [filters]);

    const fetchNotifications = async (token: string) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.isRead !== '') params.append('isRead', filters.isRead);
            if (filters.actionType) params.append('actionType', filters.actionType);
            if (filters.dateFilter) params.append('dateFilter', filters.dateFilter);
            params.append('page', filters.page.toString());
            params.append('limit', '50');

            const response = await fetch(`/api/admin/notifications?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch notifications');
            }

            const data = await response.json();
            if (data.success) {
                setNotifications(data.data.notifications);
                setPagination(data.data.pagination);
                groupNotificationsByDate(data.data.notifications);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const groupNotificationsByDate = (notifs: Notification[]) => {
        const grouped: GroupedNotifications = {};
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        notifs.forEach((notif) => {
            const notifDate = new Date(notif.createdAt);
            let groupKey: string;

            if (notifDate >= today) {
                groupKey = 'Today';
            } else if (notifDate >= yesterday && notifDate < today) {
                const options: Intl.DateTimeFormatOptions = { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                };
                groupKey = `Yesterday ${notifDate.toLocaleDateString(locale === 'ar' ? 'ar-OM' : 'en-US', options)}`;
            } else {
                const options: Intl.DateTimeFormatOptions = { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                };
                groupKey = notifDate.toLocaleDateString(locale === 'ar' ? 'ar-OM' : 'en-US', options);
            }

            if (!grouped[groupKey]) {
                grouped[groupKey] = [];
            }
            grouped[groupKey].push(notif);
        });

        setGroupedNotifications(grouped);
    };

    const handleMarkAsRead = async (id: number) => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const response = await fetch(`/api/admin/notifications/${id}/read`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                setNotifications(notifications.map(n => 
                    n.id === id ? { ...n, isRead: true } : n
                ));
                groupNotificationsByDate(notifications.map(n => 
                    n.id === id ? { ...n, isRead: true } : n
                ));
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const handleDelete = async (id: number) => {
        const token = localStorage.getItem('token');
        if (!token) return;

        if (!confirm('Are you sure you want to delete this notification?')) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/notifications/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const updated = notifications.filter(n => n.id !== id);
                setNotifications(updated);
                groupNotificationsByDate(updated);
            }
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    const handleSelectAll = (groupKey: string) => {
        const groupNotifs = groupedNotifications[groupKey] || [];
        const allSelected = groupNotifs.every(n => selectedNotifications.includes(n.id));
        
        if (allSelected) {
            setSelectedNotifications(selectedNotifications.filter(id => 
                !groupNotifs.some(n => n.id === id)
            ));
        } else {
            const newSelected = [...selectedNotifications];
            groupNotifs.forEach(n => {
                if (!newSelected.includes(n.id)) {
                    newSelected.push(n.id);
                }
            });
            setSelectedNotifications(newSelected);
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedNotifications.length === 0) return;

        const token = localStorage.getItem('token');
        if (!token) return;

        if (!confirm(`Are you sure you want to delete ${selectedNotifications.length} notification(s)?`)) {
            return;
        }

        try {
            await Promise.all(
                selectedNotifications.map(id =>
                    fetch(`/api/admin/notifications/${id}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                        },
                    })
                )
            );

            const updated = notifications.filter(n => !selectedNotifications.includes(n.id));
            setNotifications(updated);
            groupNotificationsByDate(updated);
            setSelectedNotifications([]);
        } catch (error) {
            console.error('Error deleting notifications:', error);
        }
    };

    const handleViewIt = async (notification: Notification) => {
        // Mark as read when viewing
        if (!notification.isRead) {
            await handleMarkAsRead(notification.id);
        }

        // Navigate to the appropriate page
        if (notification.navigationUrl) {
            router.push(notification.navigationUrl);
        }
    };

    const formatTimeAgo = (dateString: string): string => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) {
            return `${diffInSeconds}${locale === 'ar' ? ' ثانية' : 'sec'} ago`;
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes}${locale === 'ar' ? ' دقيقة' : 'min'} ago`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours}${locale === 'ar' ? ' ساعة' : 'hr'} ago`;
        } else {
            const days = Math.floor(diffInSeconds / 86400);
            return `${days}${locale === 'ar' ? ' يوم' : 'day'} ago`;
        }
    };

    const sidebarItems = getSidebarItems(
        locale as 'en' | 'ar',
        user?.permissions || [],
        user?.role,
        '/admin/notifications'
    );

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading notifications...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <Sidebar items={sidebarItems} />
            <div className="flex-1 flex flex-col">
                <Header />
                <main className="flex-1 p-6 md:p-8">
                    <div className="max-w-7xl mx-auto">
                        <h1 className="text-3xl font-bold text-gray-900 mb-6">
                            {locale === 'ar' ? 'الإشعارات' : 'Notifications'}
                        </h1>

                        {notifications.length === 0 ? (
                            <div className="text-center py-20">
                                <div className="inline-block mb-4">
                                    <svg className="w-24 h-24 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                    </svg>
                                </div>
                                <p className="text-gray-500 text-lg">
                                    {locale === 'ar' ? 'لا توجد إشعارات بعد' : 'No Notifications Yet'}
                                </p>
                            </div>
                        ) : (
                            Object.keys(groupedNotifications).map((groupKey) => {
                                const groupNotifs = groupedNotifications[groupKey];
                                const allSelected = groupNotifs.every(n => selectedNotifications.includes(n.id));
                                const hasSelected = groupNotifs.some(n => selectedNotifications.includes(n.id));

                                return (
                                    <div key={groupKey} className="mb-8">
                                        <div className="flex items-center justify-between mb-4">
                                            <h2 className="text-lg font-semibold text-gray-700">
                                                {groupKey}
                                            </h2>
                                            <div className="flex items-center gap-4">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={allSelected}
                                                        onChange={() => handleSelectAll(groupKey)}
                                                        className="w-4 h-4 text-primary-600 rounded"
                                                    />
                                                    <span className="text-sm text-gray-600">
                                                        {locale === 'ar' ? 'تحديد الكل' : 'Select all'}
                                                    </span>
                                                </label>
                                                {hasSelected && (
                                                    <button
                                                        onClick={handleDeleteSelected}
                                                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                                                    >
                                                        {locale === 'ar' ? 'حذف' : 'Delete'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            {groupNotifs.map((notification) => (
                                                <div
                                                    key={notification.id}
                                                    className={`bg-white rounded-lg shadow-sm border ${
                                                        !notification.isRead ? 'border-l-4 border-l-primary-500' : 'border-gray-200'
                                                    } p-4 hover:shadow-md transition-shadow`}
                                                >
                                                    <div className="flex items-start gap-4">
                                                        <div className="flex-shrink-0 relative">
                                                            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                                                                {getNotificationIconType(notification.actionType) === 'request' && (
                                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                                    </svg>
                                                                )}
                                                                {getNotificationIconType(notification.actionType) === 'user' && (
                                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                                    </svg>
                                                                )}
                                                                {getNotificationIconType(notification.actionType) === 'approval' && (
                                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                    </svg>
                                                                )}
                                                                {getNotificationIconType(notification.actionType) === 'default' && (
                                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                                                    </svg>
                                                                )}
                                                            </div>
                                                            {!notification.isRead && (
                                                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                                                            )}
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-gray-900 font-medium">
                                                                {notification.actionPerformed}
                                                            </p>
                                                            <p className="text-gray-500 text-sm mt-1">
                                                                {formatTimeAgo(notification.createdAt)}
                                                            </p>
                                                        </div>

                                                        <div className="flex items-center gap-3">
                                                            {notification.navigationUrl && (
                                                                <button
                                                                    onClick={() => handleViewIt(notification)}
                                                                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                                                                >
                                                                    {locale === 'ar' ? 'عرض' : 'View It'}
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => handleDelete(notification.id)}
                                                                className="text-gray-400 hover:text-gray-600"
                                                            >
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}

