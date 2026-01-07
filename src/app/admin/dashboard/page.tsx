'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout';
import { getSidebarItems } from '@/config/navigation';

interface DashboardData {
    summary: {
        total: number;
        approved: number;
        rejected: number;
        pending: number;
    };
    byType: {
        VISITOR: number;
        CONTRACTOR: number;
        EMPLOYEE: number;
        VEHICLE: number;
    };
    recentRequests: Array<{
        id: number;
        requestNumber: string;
        applicantName: string;
        status: string;
        requestType: string;
        createdAt: string;
    }>;
}

export default function AdminDashboardPage() {
    const router = useRouter();
    const pathname = usePathname();
    const [locale, setLocale] = useState<'en' | 'ar'>('en');
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<DashboardData | null>(null);
    const [user, setUser] = useState<any>(null);

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
            title: 'Dashboard',
            welcome: 'Welcome back',
            logout: 'Logout',
            summary: 'Summary',
            total: 'Total Requests',
            approved: 'Approved',
            rejected: 'Rejected',
            pending: 'Pending',
            byType: 'Requests by Type',
            recent: 'Recent Requests',
            viewAll: 'View All Requests',
            requests: 'Requests',
            users: 'Users',
            logs: 'Activity Logs',
            noRequests: 'No recent requests',
            permissionDenied: 'You do not have permission to view the dashboard.',
            contactAdmin: 'Please contact your administrator if you believe this is a mistake.',
            types: {
                VISITOR: 'Visitor',
                CONTRACTOR: 'Contractor',
                EMPLOYEE: 'Employee',
                VEHICLE: 'Vehicle',
            },
            status: {
                PENDING: 'Pending',
                APPROVED: 'Approved',
                REJECTED: 'Rejected',
            },
        },
        ar: {
            title: 'لوحة التحكم',
            welcome: 'مرحباً بعودتك',
            logout: 'تسجيل الخروج',
            summary: 'ملخص',
            total: 'إجمالي الطلبات',
            approved: 'موافق عليها',
            rejected: 'مرفوضة',
            pending: 'قيد الانتظار',
            byType: 'الطلبات حسب النوع',
            recent: 'الطلبات الأخيرة',
            viewAll: 'عرض جميع الطلبات',
            requests: 'الطلبات',
            users: 'المستخدمون',
            logs: 'سجل النشاط',
            noRequests: 'لا توجد طلبات حديثة',
            permissionDenied: 'ليس لديك صلاحية لعرض لوحة التحكم.',
            contactAdmin: 'يرجى الاتصال بالمسؤول إذا كنت تعتقد أن هذا خطأ.',
            types: {
                VISITOR: 'زائر',
                CONTRACTOR: 'مقاول',
                EMPLOYEE: 'موظف',
                VEHICLE: 'مركبة',
            },
            status: {
                PENDING: 'قيد الانتظار',
                APPROVED: 'موافق عليه',
                REJECTED: 'مرفوض',
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

        fetchDashboardData(token);
    }, []);

    const fetchDashboardData = async (token: string) => {
        setLoading(true);
        setPermissionDenied(false);
        try {
            const response = await fetch('/api/admin/dashboard/summary', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.status === 403) {
                setPermissionDenied(true);
                return;
            }

            if (!response.ok) {
                throw new Error('Failed to fetch dashboard data');
            }

            const result = await response.json();
            setData(result.data);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
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

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'APPROVED':
                return 'bg-success-100 text-success-700';
            case 'REJECTED':
                return 'bg-danger-100 text-danger-700';
            case 'PENDING':
                return 'bg-warning-100 text-warning-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    if (loading && !data && !permissionDenied) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading dashboard...</p>
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
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                        {content.welcome}, {user?.name}!
                    </h2>

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
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                <div className="card">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-gray-600 mb-1">{content.total}</p>
                                            <p className="text-3xl font-bold text-gray-900">{data?.summary.total || 0}</p>
                                        </div>
                                        <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                                            <svg className="w-6 h-6 text-info-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                <div className="card">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-gray-600 mb-1">{content.approved}</p>
                                            <p className="text-3xl font-bold text-success-600">{data?.summary.approved || 0}</p>
                                        </div>
                                        <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
                                            <svg className="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                <div className="card">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-gray-600 mb-1">{content.rejected}</p>
                                            <p className="text-3xl font-bold text-danger-600">{data?.summary.rejected || 0}</p>
                                        </div>
                                        <div className="w-12 h-12 bg-danger-100 rounded-lg flex items-center justify-center">
                                            <svg className="w-6 h-6 text-danger-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                <div className="card">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-gray-600 mb-1">{content.pending}</p>
                                            <p className="text-3xl font-bold text-warning-600">{data?.summary.pending || 0}</p>
                                        </div>
                                        <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center">
                                            <svg className="w-6 h-6 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Requests by Type */}
                            <div className="card mb-8">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">{content.byType}</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {Object.entries(data?.byType || {}).map(([type, count]) => (
                                        <div key={type} className="text-center p-4 bg-gray-50 rounded-lg">
                                            <p className="text-2xl font-bold text-gray-900">{count}</p>
                                            <p className="text-sm text-gray-600">{content.types[type as keyof typeof content.types]}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Recent Requests */}
                            <div className="card">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900">{content.recent}</h3>
                                    <Link href="/admin/requests" className="text-info-500 hover:text-primary-700 text-sm font-medium">
                                        {content.viewAll} →
                                    </Link>
                                </div>

                                {data?.recentRequests && data.recentRequests.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 border-b border-gray-200">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Request #</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applicant</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {data.recentRequests.map((request) => (
                                                    <tr key={request.id} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3">
                                                            <Link href={`/admin/requests/${request.id}`} className="text-info-500 hover:text-primary-700 font-medium">
                                                                {request.requestNumber}
                                                            </Link>
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-900">{request.applicantName}</td>
                                                        <td className="px-4 py-3 text-gray-600">
                                                            {content.types[request.requestType as keyof typeof content.types]}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(request.status)}`}>
                                                                {content.status[request.status as keyof typeof content.status]}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-600 text-sm">
                                                            {new Date(request.createdAt).toLocaleDateString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-center py-8">{content.noRequests}</p>
                                )}
                            </div>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
}
