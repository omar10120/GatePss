'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from '@/i18n/navigation';
import { Sidebar } from '@/components/layout';
import { getSidebarItems } from '@/config/navigation';
import Header from '../components/Header';
import { useTranslations, useLocale } from 'next-intl';
import PassTypes from './components/PassTypes';
import FAQ from './components/FAQ';
import Image from 'next/image';

type ViewMode = 'home' | 'passTypes' | 'faq';

export default function SettingsPage() {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<any>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('home');
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

    const renderContent = () => {
        if (viewMode === 'passTypes') {
            return <PassTypes />;
        }
        if (viewMode === 'faq') {
            return <FAQ />;
        }
        return (
            <div className="space-y-4">
                {/* FAQ Card */}
                <div
                    onClick={() => setViewMode('faq')}
                    className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow flex items-center justify-between"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2L4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5l-8-3z" fill="#00B09C"/>
                                <text x="12" y="16" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">?</text>
                            </svg>
                        </div>
                        <span className="text-lg font-medium text-gray-900">{t('faq.title')}</span>
                    </div>
                    <Image
                        src="/images/svg/Edit 2.svg"
                        alt="Edit"
                        width={20}
                        height={20}
                        className="text-gray-400"
                    />
                </div>

                {/* Pass Types Card */}
                <div
                    onClick={() => setViewMode('passTypes')}
                    className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow flex items-center justify-between"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2L4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5l-8-3z" fill="#00B09C"/>
                                <text x="12" y="16" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">!</text>
                            </svg>
                        </div>
                        <span className="text-lg font-medium text-gray-900">{t('passTypes.title')}</span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 flex" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
            <Sidebar items={sidebarItems} locale={locale as 'en' | 'ar'} />

            <div className="flex-1" style={{ marginLeft: locale === 'ar' ? '0' : '16rem', marginRight: locale === 'ar' ? '16rem' : '0' }}>
                <Header />

                <main className="px-6 py-8">
                    {viewMode !== 'home' && (
                        <button
                            onClick={() => setViewMode('home')}
                            className="mb-6 text-gray-600 hover:text-gray-900 flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            {t('back')}
                        </button>
                    )}
                    

                    {renderContent()}
                </main>
            </div>
        </div>
    );
}
