'use client';

import { useTranslations, useLocale } from 'next-intl';

import HowtWork from '@/components/ui/HowtWork';

export default function TrackApplication() {
    const t = useTranslations('HomePage');
    const locale = useLocale();

    return (
        <div className="min-h-screen bg-white">

            {/* ApplicationNumber Section */}
            <section className="py-20 px-4 bg-white">
                <div className="container mx-auto max-w-4xl text-center">
                    <h1 className="text-4xl md:text-5xl font-bold text-[#0571B6] mb-4">
                        {t('trackApplication.title')}
                    </h1>
                    <p className="text-gray-500 mb-12">
                        {t('trackApplication.subtitle')}
                    </p>

                    <div className="max-w-xl mx-auto mb-16">
                        <div className="text-start mb-2">
                            <label className="text-sm font-semibold text-gray-700">
                                {t('trackApplication.inputLabel')}
                            </label>
                        </div>
                        <div className="relative mb-8">
                            <input
                                type="text"
                                placeholder={t('trackApplication.inputPlaceholder')}
                                className="w-full px-6 py-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#14b8a6] focus:border-transparent transition-all shadow-sm"
                            />
                        </div>
                        <button className="w-full md:w-auto px-12 py-4 bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-full font-bold text-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                            {t('trackApplication.checkStatus')}
                        </button>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <HowtWork />

        </div>
    );
}
