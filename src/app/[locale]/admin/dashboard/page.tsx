'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from '@/i18n/navigation';
import { Sidebar } from '@/components/layout';
import { getSidebarItems } from '@/config/navigation';
import { useTranslations, useLocale } from 'next-intl';


import { KPICards } from '../components/KPICards';
import { LatestRequests } from '../components/LatestRequests';
import { VisitorsApplicationsCard } from '../components/VisitorsApplicationsCard';
import { ActivitiesOfAction } from '../components/ActivitiesOfAction';
import Header from '../components/Header';
import { usePermissions } from '@/hooks/usePermissions';
import { isTokenValid } from '@/lib/auth-client';
import { apiFetch } from '@/lib/api-client';

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
    const locale = useLocale() as 'en' | 'ar';

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<DashboardData | null>(null);
    const [user, setUser] = useState<any>(null);
    const [permissionDenied, setPermissionDenied] = useState(false);
    const t = useTranslations('Admin.dashboard');
    const { hasPermission } = usePermissions(user);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token || !isTokenValid(token)) {
            window.location.href = `/${locale}/admin/login`;
            return;
        }

        // Initial load from localStorage for speed
        if (userData) {
            setUser(JSON.parse(userData));
        }

        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        setPermissionDenied(false);
        try {
            const result = await apiFetch<{ summary: DashboardData['summary']; byType: DashboardData['byType']; recentRequests: DashboardData['recentRequests'] }>('/api/admin/dashboard/summary');

            setData({
                summary: result.summary,
                byType: result.byType,
                recentRequests: result.recentRequests,
            });
        } catch (error: any) {
            console.error('Error fetching dashboard data:', error);
            // Check if it's a permission error (403)
            if (error.message?.includes('Forbidden') || error.message?.includes('permission')) {
                setPermissionDenied(true);
            }
            // apiFetch handles 401 (token expiration) automatically with redirect
        } finally {
            setLoading(false);
        }
    };



    if (loading && !data && !permissionDenied) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">{t('loading')}</p>
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
        <div className="min-h-screen bg-white flex" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
            {/* Sidebar */}
            <Sidebar items={sidebarItems} locale={locale} />

            {/* Main Content Area */}
            <div className="flex-1" style={{ marginLeft: locale === 'ar' ? '0' : '16rem', marginRight: locale === 'ar' ? '16rem' : '0' }}>
                <Header />

                {/* Main Content */}
                <main className="px-8 py-8 bg-[#F9F9FB] min-h-screen">
                    {permissionDenied ? (
                        <div className="card p-12 text-center bg-white rounded-3xl shadow-sm">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('permissionDenied')}</h3>
                            <p className="text-gray-500">{t('contactAdmin')}</p>
                        </div>
                    ) : (
                        <div className="max-w-[1600px] mx-auto">
                            {/* KPI Cards */}
                            <KPICards data={data?.summary || null} />

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                                {/* Latest Requests */}
                                <div className="lg:col-span-2">
                                    <LatestRequests
                                        requests={data?.recentRequests}
                                        user={user}
                                    />
                                </div>

                                {/* Visitors Applications Card */}
                                <div className="lg:col-span-1">
                                    <VisitorsApplicationsCard data={data?.summary || null} />
                                </div>
                            </div>

                            {/* Activities Of Action */}
                            <ActivitiesOfAction />
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

