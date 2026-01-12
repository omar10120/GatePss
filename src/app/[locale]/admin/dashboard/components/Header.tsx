import LanguageSelector from '@/components/ui/LanguageSelector'
import React, { useState } from 'react'
import { getSidebarItems } from '@/config/navigation';
import { useRouter, usePathname, Link } from '@/i18n/navigation';
import { useTranslations, useLocale } from 'next-intl';
export default function Header() {
    const router = useRouter();
    const pathname = usePathname();
    const locale = useLocale() as 'en' | 'ar';
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<DashboardData | null>(null);
    const [user, setUser] = useState<any>(null);
    const [permissionDenied, setPermissionDenied] = useState(false);
    const t = useTranslations('Admin.dashboard');




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

    const sidebarItems = getSidebarItems(
        locale,
        user?.permissions || [],
        user?.role,
        pathname
    );

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

    return (
        <>
            {/* Header */}
            <header className="bg-white sticky top-0 z-30 border-b border-gray-50">
                <div className="px-8 py-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-xl font-bold text-gray-900">{t('title')}</h1>
                        <div className="flex items-center gap-6">
                            <LanguageSelector />
                            <div className="flex items-center gap-3">
                                <div className="text-right">
                                    <p className="text-sm font-bold text-gray-900">{user?.name}</p>
                                    <p className="text-xs text-gray-500">{user?.role}</p>
                                </div>
                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center border-2 border-gray-50 overflow-hidden">
                                    <div className="text-gray-400">
                                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-2 text-gray-400 hover:text-danger-500 transition-colors"
                                title={t('logout')}
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </header>
        </>
    )
}
