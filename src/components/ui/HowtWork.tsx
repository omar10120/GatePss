'use client';

import { useTranslations, useLocale } from 'next-intl';

export default function Footer() {
    const t = useTranslations('HomePage');
    const locale = useLocale();

    return (
        <>
            {/* How It Works Section */}
            <section className="py-20 px-4 bg-gray-50/50" id='howtowork'>
                <div className="container mx-auto px-4 lg:px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold text-blue-900 mb-4">{t('howItWorks.title')}</h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">{t('howItWorks.subtitle')}</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Step 1 */}
                        <div className="bg-[#E6F6F9] p-10 rounded-3xl text-center hover:shadow-lg transition-all group flex flex-col items-center">
                            <div className="mb-6 transform transition-transform group-hover:scale-110">
                                <svg className="w-20 h-20" fill="none" stroke="#14b8a6" viewBox="0 0 24 24" strokeWidth={1.5}>
                                    <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    <circle cx="12" cy="12" r="9" />
                                    <path d="M12 3v3M12 18v3M3 12h3m15 0h3" />
                                    <circle cx="21" cy="12" r="2" fill="white" stroke="#14b8a6" />
                                    <text x="18.5" y="14" fontSize="6" fill="#14b8a6" fontWeight="bold">24</text>
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">{t('howItWorks.step1.title')}</h3>
                            <p className="text-gray-600 leading-relaxed">{t('howItWorks.step1.description')}</p>
                        </div>

                        {/* Step 2 */}
                        <div className="bg-[#E6F6F9] p-10 rounded-3xl text-center hover:shadow-lg transition-all group flex flex-col items-center">
                            <div className="mb-6 transform transition-transform group-hover:scale-110">
                                <svg className="w-20 h-20" fill="none" stroke="#14b8a6" viewBox="0 0 24 24" strokeWidth={1.5}>
                                    <path d="M7 21h10M12 21V3M7 3h10M9 7l6 10M15 7l-6 10" />
                                    <path d="M17 12h4v5h-4z" />
                                    <circle cx="19" cy="14.5" r="1.5" strokeWidth={1} />
                                    <text x="17.5" y="16" fontSize="5" fill="#14b8a6" fontWeight="bold">$</text>
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">{t('howItWorks.step2.title')}</h3>
                            <p className="text-gray-600 leading-relaxed">{t('howItWorks.step2.description')}</p>
                        </div>

                        {/* Step 3 */}
                        <div className="bg-[#E6F6F9] p-10 rounded-3xl text-center hover:shadow-lg transition-all group flex flex-col items-center">
                            <div className="mb-6 transform transition-transform group-hover:scale-110">
                                <svg className="w-20 h-20" fill="none" stroke="#14b8a6" viewBox="0 0 24 24" strokeWidth={1.5}>
                                    <rect x="3" y="11" width="18" height="10" rx="2" />
                                    <path d="M7 11V7a5 5 0 0110 0v4" />
                                    <circle cx="12" cy="16" r="1.5" />
                                    <rect x="4" y="4" width="6" height="6" rx="1" />
                                    <circle cx="7" cy="6.5" r="1.5" strokeWidth={1} />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">{t('howItWorks.step3.title')}</h3>
                            <p className="text-gray-600 leading-relaxed">{t('howItWorks.step3.description')}</p>
                        </div>
                    </div>
                </div>
            </section>
        </>

    );
}
