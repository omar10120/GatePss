'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from '@/i18n/navigation';
import { Sidebar } from '@/components/layout';
import { getSidebarItems } from '@/config/navigation';
import Header from '../components/Header';
import { useTranslations, useLocale } from 'next-intl';
import PassTypes from './components/PassTypes';
import FAQ from './components/FAQ';

export default function SettingsPage() {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<any>(null);
    const t = useTranslations('Admin.settings');
    const locale = useLocale();

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
    }, [router]);

    const sidebarItems = getSidebarItems(
        locale as 'en' | 'ar',
        user?.permissions || [],
        user?.role,
        pathname
    );

    return (
        <div className="min-h-screen bg-gray-50 flex" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
            <Sidebar items={sidebarItems} locale={locale as 'en' | 'ar'} />

            <div className="flex-1" style={{ marginLeft: locale === 'ar' ? '0' : '16rem', marginRight: locale === 'ar' ? '16rem' : '0' }}>
                <Header />

                <main className="px-6 py-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-8">{t('title')}</h2>

                    <div className="space-y-8">
                        {/* Pass Types Section */}
                        <div>
                            <PassTypes />
                        </div>

                        {/* FAQ Section */}
                        <div>
                            <FAQ />
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
