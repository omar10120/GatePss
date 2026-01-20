'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from '@/i18n/navigation';
import { Sidebar } from '@/components/layout';
import { getSidebarItems } from '@/config/navigation';
import Header from '../components/Header';
import { useTranslations, useLocale } from 'next-intl';
import Image from 'next/image';
import { getNotificationIconType } from '@/utils/notifications';

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

interface GroupedNotifications {
    [key: string]: Notification[];
}

export default function NotificationsPage() {
    const router = useRouter();
    const pathname = usePathname();
    const locale = useLocale();
    const t = useTranslations('Admin.notifications');

    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [groupedNotifications, setGroupedNotifications] = useState<GroupedNotifications>({});
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
                groupKey = locale === 'ar' ? 'اليوم' : 'Today';
            } else if (notifDate >= yesterday && notifDate < today) {
                const options: Intl.DateTimeFormatOptions = {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                };
                const dateStr = notifDate.toLocaleDateString(locale === 'ar' ? 'ar-OM' : 'en-US', options);
                groupKey = locale === 'ar' ? `أمس ${dateStr}` : `Yesterday ${dateStr}`;
            } else {
                const options: Intl.DateTimeFormatOptions = {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
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
                const updated = notifications.map(n =>
                    n.id === id ? { ...n, isRead: true } : n
                );
                setNotifications(updated);
                groupNotificationsByDate(updated);
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const handleDelete = async (id: number) => {
        const token = localStorage.getItem('token');
        if (!token) return;

        if (!confirm(t('deleteOneConfirm'))) {
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

        if (!confirm(t('deleteManyConfirm', { count: selectedNotifications.length }))) {
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
        if (!notification.isRead) {
            await handleMarkAsRead(notification.id);
        }

        if (notification.navigationUrl) {
            router.push(notification.navigationUrl);
        }
    };

    const formatTimeAgo = (dateString: string): string => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) {
            return t('time.seconds', { value: diffInSeconds });
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return t('time.minutes', { value: minutes });
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return t('time.hours', { value: hours });
        } else {
            const days = Math.floor(diffInSeconds / 86400);
            return t('time.days', { value: days });
        }
    };

    const sidebarItems = getSidebarItems(
        locale as 'en' | 'ar',
        user?.permissions || [],
        user?.role,
        pathname
    );

    if (loading && notifications.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">{t('loading')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
            <Sidebar items={sidebarItems} locale={locale as 'en' | 'ar'} />

            <div className="flex-1" style={{ marginLeft: locale === 'ar' ? '0' : '16rem', marginRight: locale === 'ar' ? '16rem' : '0' }}>
                <Header />

                <main className="px-4 sm:px-6 py-6 sm:py-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('title')}</h2>

                    {notifications.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="inline-block mb-6">
                                <Image
                                    src="/images/svg/Group 1.svg"
                                    alt="No notifications"
                                    width={200}
                                    height={136}
                                />
                            </div>
                            <p className="text-gray-500 text-lg">
                                {t('emptyTitle')}
                            </p>
                        </div>
                    ) : (
                        Object.keys(groupedNotifications).map((groupKey) => {
                            const groupNotifs = groupedNotifications[groupKey];
                            const allSelected = groupNotifs.every(n => selectedNotifications.includes(n.id));
                            const hasSelected = groupNotifs.some(n => selectedNotifications.includes(n.id));

                            return (
                                <div key={groupKey} className="mb-8">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                                        <h2 className="text-lg font-semibold text-gray-700">
                                            {groupKey}
                                        </h2>
                                        <div className="flex items-center gap-4">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={allSelected}
                                                    onChange={() => handleSelectAll(groupKey)}
                                                    className="w-4 h-4 rounded border-gray-300 text-[#00B09C] focus:ring-[#00B09C] focus:ring-2"
                                                    style={{
                                                        accentColor: '#00B09C'
                                                    }}
                                                />
                                                <span className={`text-sm ${allSelected ? 'text-[#00B09C]' : 'text-gray-600'}`}>
                                                    {t('selectAll')}
                                                </span>
                                            </label>
                                            <span className="text-gray-300">|</span>
                                            <button
                                                onClick={handleDeleteSelected}
                                                disabled={!hasSelected}
                                                className={`text-sm font-medium ${hasSelected ? 'text-red-600 hover:text-red-700' : 'text-gray-400 cursor-not-allowed'}`}
                                            >
                                                {t('delete')}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {groupNotifs.map((notification) => (
                                            <div
                                                key={notification.id}
                                                className={`rounded-2xl border transition-all ${
                                                    notification.isRead
                                                        ? 'bg-[#F4FAFF] border-transparent'
                                                        : 'bg-white border-gray-200'
                                                } p-4 md:p-5 hover:shadow-md`}
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div className="flex-shrink-0 relative flex items-center gap-2">
                                                        
                                                        {!notification.isRead && (
                                                            <Image
                                                                src="/images/svg/point.svg"
                                                                alt="No notifications"
                                                                width={8}
                                                                height={8}
                                                            />
                                                        )}
                                                        <div className="w-10 h-10 rounded-lg bg-[#E0F2FE] flex items-center justify-center">
                                                            {getNotificationIconType(notification.actionType) === 'request' && (
                                                                <Image
                                                                src="/images/svg/profile-2user.svg"
                                                                alt="No notifications"
                                                                width={45}
                                                                height={45}
                                                            />
                                                            )}
                                                            {getNotificationIconType(notification.actionType) === 'user' && (
                                                                     <Image
                                                                     src="/images/svg/task-square.svg"
                                                                     alt="No notifications"
                                                                     width={45}
                                                                     height={45}
                                                                 />
                                                            )}
                                                            {getNotificationIconType(notification.actionType) === 'approval' && (
                                                             <Image
                                                             src="/images/svg/task-square.svg"
                                                             alt="No notifications"
                                                             width={45}
                                                             height={45}
                                                         />
                                                            )}
                                                            {getNotificationIconType(notification.actionType) === 'default' && (
                                                               <Image
                                                               src="/images/svg/task-square.svg"
                                                               alt="No notifications"
                                                               width={45}
                                                               height={45}
                                                           />
                                                            )}
                                                        </div>
                                                        
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
                                                                className="text-[#00B09C] hover:text-[#008f7e] text-sm font-medium"
                                                            >
                                                                {t('viewIt')}
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
                </main>
            </div>
        </div>
    );
}
