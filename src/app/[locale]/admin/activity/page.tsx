'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname, Link } from '@/i18n/navigation';
import { Sidebar } from '@/components/layout';
import { getSidebarItems } from '@/config/navigation';
import Header from '../components/Header';
import { TableFilter } from '../components/TableFilter';
import { useLocale, useTranslations } from 'next-intl';
import { apiFetch } from '@/lib/api-client';

interface ActivityLog {
    id: number;
    timestamp: string;
    userId: number | null;
    actionType: string;
    actionPerformed: string;
    affectedEntityType: string | null;
    affectedEntityId: number | null;
    details: string | null;
    requestId?: number | null;
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
    const locale = useLocale();
    const t = useTranslations('Admin.activity');

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

        fetchLogs();
    }, [filters]);

    const fetchLogs = async () => {
        setLoading(true);
        setPermissionDenied(false);
        try {
            const params = new URLSearchParams();
            if (filters.actionType) params.append('actionType', filters.actionType);
            if (filters.search) params.append('search', filters.search);
            params.append('page', filters.page.toString());
            params.append('limit', '50');

            const result = await apiFetch<{ logs: any[]; pagination: any }>(`/api/admin/logs?${params}`);
            setLogs(result.logs || []);
            setPagination(result.pagination);
        } catch (error: any) {
            console.error('Error fetching logs:', error);
            // Check if it's a permission error (403)
            if (error.message?.includes('Forbidden') || error.message?.includes('permission')) {
                setPermissionDenied(true);
            }
            // apiFetch handles 401 (token expiration) automatically with redirect
        } finally {
            setLoading(false);
        }
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
        locale as 'en' | 'ar',
        user?.permissions || [],
        user?.role,
        pathname
    );

    return (
        <div className="min-h-screen bg-gray-50 flex" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
            {/* Sidebar */}
            <Sidebar items={sidebarItems} locale={locale as 'en' | 'ar'} />


            {/* Main Content Area */}
            <div className="flex-1" style={{ marginLeft: locale === 'ar' ? '0' : '16rem', marginRight: locale === 'ar' ? '16rem' : '0' }}>
                {/* Header */}
                <Header />

                {/* Main Content */}
                <main className="px-6 py-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('title')}</h2>

                    {permissionDenied ? (
                        <div className="card p-12 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('permissionDenied')}</h3>
                            <p className="text-gray-500">{t('contactAdmin')}</p>
                        </div>
                    ) : (
                        <>
                            <TableFilter
                                currentFilters={{
                                    search: filters.search,
                                    status: filters.actionType,
                                }}
                                onSearch={(val) => handleFilterChange('search', val)}
                                onStatusChange={(val) => handleFilterChange('actionType', val)}
                                onDateChange={() => { }} // No date filter support yet
                                onReset={() => setFilters({ actionType: '', search: '', page: 1 })}
                                statusOptions={[
                                    { value: 'REQUEST_MANAGEMENT', label: t('actionTypes.REQUEST_MANAGEMENT') },
                                    { value: 'USER_MANAGEMENT', label: t('actionTypes.USER_MANAGEMENT') },
                                    { value: 'SYSTEM_INTEGRATION', label: t('actionTypes.SYSTEM_INTEGRATION') },
                                    { value: 'AUTH', label: t('actionTypes.AUTH') },
                                ]}
                                statusLabel={t('filterType')}
                                hideDate={true}
                            />

                            {/* Logs Table */}
                            <div className="card">
                                {logs.length > 0 ? (
                                    <>
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead className="bg-gray-50 border-b border-gray-200">
                                                    <tr>
                                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">{t('timestamp')}</th>
                                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">{t('user')}</th>
                                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">{t('type')}</th>
                                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">{t('action')}</th>
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
                                                                    <span className="text-gray-500 italic">{t('system')}</span>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getActionTypeColor(log.actionType)}`}>
                                                                    {t(`actionTypes.${log.actionType}`)}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-gray-900">
                                                                {(() => {
                                                                    // Extract request number from action text
                                                                    const requestNumberMatch = log.actionPerformed.match(/GP-(\d+)/);
                                                                    if (requestNumberMatch && log.requestId) {
                                                                        const requestNumber = `GP-${requestNumberMatch[1]}`;
                                                                        const parts = log.actionPerformed.split(requestNumber);
                                                                        return (
                                                                            <>
                                                                                {parts[0]}
                                                                                <Link 
                                                                                    href={`/admin/requests/${log.requestId}`}
                                                                                    className="text-[#00B09C] hover:text-[#008f7e] font-bold"
                                                                                >
                                                                                    {requestNumber}
                                                                                </Link>
                                                                                {parts[1]}
                                                                            </>
                                                                        );
                                                                    }
                                                                    return log.actionPerformed;
                                                                })()}
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
                                                    {t('pagination.showing')} {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} {t('pagination.of')} {pagination.total} {t('pagination.results')}
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handlePageChange(pagination.page - 1)}
                                                        disabled={pagination.page === 1}
                                                        className="btn btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {t('pagination.previous')}
                                                    </button>
                                                    <button
                                                        onClick={() => handlePageChange(pagination.page + 1)}
                                                        disabled={pagination.page === pagination.totalPages}
                                                        className="btn btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {t('pagination.next')}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <p className="text-gray-500 text-center py-12">{t('noLogs')}</p>
                                )}
                            </div>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
}
