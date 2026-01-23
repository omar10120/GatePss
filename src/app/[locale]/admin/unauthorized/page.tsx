'use client';

import { useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations, useLocale } from 'next-intl';

export default function UnauthorizedPage() {
    const router = useRouter();
    const locale = useLocale();
    const t = useTranslations('Admin.unauthorized');

    useEffect(() => {
        // Redirect to dashboard after 3 seconds
        const timer = setTimeout(() => {
            router.push('/admin/dashboard');
        }, 3000);

        return () => clearTimeout(timer);
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
            <div className="max-w-md w-full bg-white rounded-3xl shadow-lg p-8 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('title')}</h1>
                <p className="text-gray-600 mb-6">
                    {t('message')}
                </p>
                <button
                    onClick={() => router.push('/admin/dashboard')}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                    {t('goToDashboard')}
                </button>
            </div>
        </div>
    );
}

