'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname, Link } from '@/i18n/navigation';
import { Sidebar } from '@/components/layout';
import { getSidebarItems } from '@/config/navigation';

interface ActivityLog {
    id: number;
    timestamp: string;
    userId: number | null;
    actionType: string;
    actionPerformed: string;
    affectedEntityType: string | null;
    affectedEntityId: number | null;
    details: string | null;
    user: {
        id: number;
        name: string;
        email: string;
    } | null;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export default function AdminActivityPage() {
    const router = useRouter();
    const pathname = usePathname();
    const [locale, setLocale] = useState<'en' | 'ar'>('en');
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [user, setUser] = useState<any>(null);
    const [filters, setFilters] = useState({
        actionType: '',
        search: '',
        page: 1,
    });

    const [permissionDenied, setPermissionDenied] = useState(false);

    // Helper function to check if user has a specific permission
    const hasPermission = (permissionKey: string) => {
        if (!user) return false;
        if (user.role === 'SUPER_ADMIN') return true;
        return user.permissions?.includes(permissionKey) || false;
    };

    const toggleLocale = () => {
        setLocale(prev => prev === 'en' ? 'ar' : 'en');
    };

    const t = {
        en: {
            title: 'Activity Logs',
            dashboard: 'Dashboard',
            requests: 'Requests',
            users: 'Users',
            logs: 'Activity Logs',
            logout: 'Logout',
            search: 'Search in actions...',
            filterType: 'Filter by Type',
            allTypes: 'All Types',
            showing: 'Showing',
            of: 'of',
            results: 'results',
            previous: 'Previous',
            next: 'Next',
            noLogs: 'No activity logs found',
            permissionDenied: 'You do not have permission to view activity logs.',
            contactAdmin: 'Please contact your administrator if you believe this is a mistake.',
            timestamp: 'Timestamp',
            user: 'User',
            action: 'Action',
            type: 'Type',
            system: 'System',
            actionTypes: {
                REQUEST_MANAGEMENT: 'Request Management',
                USER_MANAGEMENT: 'User Management',
                SYSTEM_INTEGRATION: 'System Integration',
                AUTH: 'Authentication',
            },
        },
        ar: {
            title: 'سجل النشاط',
            dashboard: 'لوحة التحكم',
            requests: 'الطلبات',
            users: 'المستخدمون',
            logs: 'سجل النشاط',
            logout: 'تسجيل الخروج',
            search: 'البحث في الإجراءات...',
            filterType: 'تصفية حسب النوع',
            allTypes: 'جميع الأنواع',
            showing: 'عرض',
            of: 'من',
            results: 'نتيجة',
            previous: 'السابق',
            next: 'التالي',
            noLogs: 'لم يتم العثور على سجلات نشاط',
            permissionDenied: 'ليس لديك صلاحية لعرض سجلات النشاط.',
            contactAdmin: 'يرجى الاتصال بالمسؤول إذا كنت تعتقد أن هذا خطأ.',
            timestamp: 'الوقت',
            user: 'المستخدم',
            action: 'الإجراء',
            type: 'النوع',
            system: 'النظام',
            actionTypes: {
                REQUEST_MANAGEMENT: 'إدارة الطلبات',
                USER_MANAGEMENT: 'إدارة المستخدمين',
                SYSTEM_INTEGRATION: 'تكامل النظام',
                AUTH: 'المصادقة',
            },
        },
    };


    const content = t[locale];

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token) {
            router.push('/admin/login');
            return;
        }

        // Initial load from localStorage for speed
        if (userData) {
            setUser(JSON.parse(userData));
        }

        // Fetch fresh user data
        fetch('/api/auth/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setUser(data.data.user);
                    localStorage.setItem('user', JSON.stringify(data.data.user));
                } else {
                    if (data.error === 'Unauthorized' || data.error === 'Forbidden') {
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        router.push('/admin/login');
                    }
                }
            })
            .catch(err => console.error('Error refreshing user data:', err));

        fetchLogs(token);
    }, [filters]);

    const fetchLogs = async (token: string) => {
        setLoading(true);
        setPermissionDenied(false);
        try {
            const params = new URLSearchParams();
            if (filters.actionType) params.append('actionType', filters.actionType);
            if (filters.search) params.append('search', filters.search);
            params.append('page', filters.page.toString());
            params.append('limit', '50');

            const response = await fetch(`/api/admin/logs?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.status === 403) {
                setPermissionDenied(true);
                return;
            }

            if (!response.ok) {
                throw new Error('Failed to fetch logs');
            }

            const result = await response.json();
            setLogs(result.data.logs);
            setPagination(result.data.pagination);
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        const token = localStorage.getItem('token');

        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
        } catch (error) {
            console.error('Logout error:', error);
        }

        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/admin/login');
    };

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
    };

    const handlePageChange = (newPage: number) => {
        setFilters(prev => ({ ...prev, page: newPage }));
    };

    const getActionTypeColor = (actionType: string) => {
        switch (actionType) {
            case 'REQUEST_MANAGEMENT':
                return 'bg-primary-100 text-primary-700';
            case 'USER_MANAGEMENT':
                return 'bg-warning-100 text-warning-700';
            case 'SYSTEM_INTEGRATION':
                return 'bg-success-100 text-success-700';
            case 'AUTH':
                return 'bg-gray-100 text-gray-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    if (loading && logs.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading activity logs...</p>
                </div>
            </div>
        );
    }

    const sidebarItems = getSidebarItems(
        locale,
        user?.permissions || [],
        user?.role,
        pathname
    );

    return (
        <div className="min-h-screen bg-gray-50 flex" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
            {/* Sidebar */}
            <Sidebar items={sidebarItems} locale={locale} />

            {/* Main Content Area */}
            <div className="flex-1" style={{ marginLeft: locale === 'ar' ? '0' : '16rem', marginRight: locale === 'ar' ? '16rem' : '0' }}>
                {/* Header */}
                <header className="bg-white shadow-sm sticky top-0 z-30">
                    <div className="px-6 py-4">
                        <div className="flex items-center justify-between">

                            <div className="flex items-center gap-4">
                                <button
                                    onClick={toggleLocale}
                                    className="btn btn-secondary text-sm"
                                >
                                    {locale === 'en' ? 'العربية' : 'English'}
                                </button>
                                <div className="text-right">
                                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                                    <p className="text-xs text-gray-500">{user?.role}</p>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="btn btn-danger text-sm"
                                >
                                    {content.logout}
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="px-6 py-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">{content.title}</h2>

                    {permissionDenied ? (
                        <div className="card p-12 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">{content.permissionDenied}</h3>
                            <p className="text-gray-500">{content.contactAdmin}</p>
                        </div>
                    ) : (
                        <>
                            {/* Filters */}
                            <div className="card mb-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <input
                                            type="text"
                                            placeholder={content.search}
                                            value={filters.search}
                                            onChange={(e) => handleFilterChange('search', e.target.value)}
                                            className="input"
                                        />
                                    </div>
                                    <div>
                                        <select
                                            value={filters.actionType}
                                            onChange={(e) => handleFilterChange('actionType', e.target.value)}
                                            className="input"
                                        >
                                            <option value="">{content.allTypes}</option>
                                            <option value="REQUEST_MANAGEMENT">{content.actionTypes.REQUEST_MANAGEMENT}</option>
                                            <option value="USER_MANAGEMENT">{content.actionTypes.USER_MANAGEMENT}</option>
                                            <option value="SYSTEM_INTEGRATION">{content.actionTypes.SYSTEM_INTEGRATION}</option>
                                            <option value="AUTH">{content.actionTypes.AUTH}</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Logs Table */}
                            <div className="card">
                                {logs.length > 0 ? (
                                    <>
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead className="bg-gray-50 border-b border-gray-200">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{content.timestamp}</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{content.user}</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{content.type}</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{content.action}</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200">
                                                    {logs.map((log) => (
                                                        <tr key={log.id} className="hover:bg-gray-50">
                                                            <td className="px-4 py-3 text-gray-600 text-sm whitespace-nowrap">
                                                                {new Date(log.timestamp).toLocaleString()}
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                {log.user ? (
                                                                    <div>
                                                                        <p className="text-gray-900 font-medium">{log.user.name}</p>
                                                                        <p className="text-xs text-gray-500">{log.user.email}</p>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-gray-500 italic">{content.system}</span>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getActionTypeColor(log.actionType)}`}>
                                                                    {content.actionTypes[log.actionType as keyof typeof content.actionTypes] || log.actionType}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-gray-900">
                                                                {log.actionPerformed}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Pagination */}
                                        {pagination && pagination.totalPages > 1 && (
                                            <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
                                                <div className="text-sm text-gray-600">
                                                    {content.showing} {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} {content.of} {pagination.total} {content.results}
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handlePageChange(pagination.page - 1)}
                                                        disabled={pagination.page === 1}
                                                        className="btn btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {content.previous}
                                                    </button>
                                                    <button
                                                        onClick={() => handlePageChange(pagination.page + 1)}
                                                        disabled={pagination.page === pagination.totalPages}
                                                        className="btn btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {content.next}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <p className="text-gray-500 text-center py-12">{content.noLogs}</p>
                                )}
                            </div>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
}
