'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from '@/i18n/navigation';
import { Container } from './Container';
import { Navigation } from './Navigation';
import { Button } from '../ui';
import { useAuth, useLocale, usePermissions } from '@/hooks';
import { getNavItems } from '@/config/navigation';
import { PageLoader } from '../ui/LoadingSpinner';

interface AdminLayoutProps {
    children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
    const router = useRouter();
    const pathname = usePathname();
    const { user, loading, isAuthenticated, logout } = useAuth();
    const { locale, toggleLocale, isRTL } = useLocale();
    const { hasPermission } = usePermissions(user);

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push('/admin/login');
        }
    }, [loading, isAuthenticated, router]);

    if (loading || !isAuthenticated || !user) {
        return <PageLoader message="Loading..." />;
    }

    const navItems = getNavItems(locale, user.permissions, user.role, pathname);

    return (
        <div className="min-h-screen bg-gray-50" dir={isRTL ? 'rtl' : 'ltr'}>
            {/* Header */}
            <header className="bg-white shadow-sm">
                <Container>
                    <div className="py-4">
                        <div className="flex items-center justify-between">
                            {/* Logo & Brand */}
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                                    <span className="text-white text-xl font-bold">M</span>
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-gray-900">
                                        {locale === 'en' ? 'Majis Industrial Services' : 'خدمات ماجس الصناعية'}
                                    </h1>
                                    <p className="text-sm text-gray-600">
                                        {locale === 'en' ? 'Gate Pass System' : 'نظام تصاريح البوابة'}
                                    </p>
                                </div>
                            </div>

                            {/* User Menu */}
                            <div className="flex items-center gap-4">
                                <Button variant="secondary" size="sm" onClick={toggleLocale}>
                                    {locale === 'en' ? 'العربية' : 'English'}
                                </Button>
                                <div className="text-right">
                                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                    <p className="text-xs text-gray-500">{user.role}</p>
                                </div>
                                <Button variant="danger" size="sm" onClick={logout}>
                                    {locale === 'en' ? 'Logout' : 'تسجيل الخروج'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </Container>
            </header>

            {/* Navigation */}
            <Navigation items={navItems} />

            {/* Main Content */}
            <main className="py-8">
                <Container>{children}</Container>
            </main>
        </div>
    );
};
