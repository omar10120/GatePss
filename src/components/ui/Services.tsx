'use client'
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useTranslations } from 'next-intl';

export default function Services() {
    const t = useTranslations('HomePage');
    const locale = useLocale();
    return (
        <section id="services" className="py-20 px-4 bg-white">
            <div className="container mx-auto">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-medium text-center mb-4 capitalize" style={{ color: '#0666A3' }}>
                    {t('applyForSpecificPermit.title')}
                </h2>

                <p className="text-center mb-8 max-w-2xl mx-auto text-lg md:text-xl lg:text-2xl" style={{ color: '#1F1F1F' }}>
                    {t('applyForSpecificPermit.subtitle')}
                </p>

                {/* CTA Button - Positioned BEFORE the cards */}
                <div className="text-center mb-12">
                    <Link
                        href={`/${locale}/RequestPermit`}
                        className="inline-flex items-center justify-center gap-2 text-white px-8 md:px-12 py-3 md:py-4 rounded-full font-medium text-lg md:text-xl lg:text-2xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        style={{ backgroundColor: '#00B09C' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0d9488'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#00B09C'}
                    >
                        {t('actions.requestPermit')}
                    </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6 max-w-7xl mx-auto">
                    {[
                        {
                            key: 'visitors',
                            title: t('applyForSpecificPermit.visitors.title'),
                            description: t('applyForSpecificPermit.visitors.description'),
                            icon: (
                                <svg className="w-10 h-10 md:w-11 md:h-11" fill="none" stroke="#00B09C" viewBox="0 0 24 24" strokeWidth={1.5}>
                                    <path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                </svg>
                            ),
                        },
                        {
                            key: 'subContractor',
                            title: t('applyForSpecificPermit.subContractor.title'),
                            description: t('applyForSpecificPermit.subContractor.description'),
                            icon: (
                                <svg className="w-10 h-10 md:w-11 md:h-11" fill="none" stroke="#00B09C" viewBox="0 0 24 24" strokeWidth={1.5}>
                                    <path d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                                </svg>
                            ),
                        },
                        {
                            key: 'vehicles',
                            title: t('applyForSpecificPermit.vehicles.title'),
                            description: t('applyForSpecificPermit.vehicles.description'),
                            icon: (
                                <svg className="w-10 h-10 md:w-11 md:h-11" fill="none" stroke="#00B09C" viewBox="0 0 24 24" strokeWidth={1.5}>
                                    <path d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H12m-2.25 0H8.25m0 0H5.625c-.621 0-1.125-.504-1.125-1.125V8.25a2.25 2.25 0 012.25-2.25h12.75a2.25 2.25 0 012.25 2.25v9.375c0 .621-.504 1.125-1.125 1.125H16.5m-8.25 0a1.5 1.5 0 013 0m0 0h3m-3 0h-3m9 0v-3.375c0-.621-.504-1.125-1.125-1.125h-1.5a1.125 1.125 0 00-1.125 1.125v3.375m0 0h.375a1.125 1.125 0 001.125-1.125V8.25a1.125 1.125 0 00-1.125-1.125h-1.5a1.125 1.125 0 00-1.125 1.125v9.375c0 .621.504 1.125 1.125 1.125h.375z" />
                                </svg>
                            ),
                        },
                        {
                            key: 'employees',
                            title: t('applyForSpecificPermit.employees.title'),
                            description: t('applyForSpecificPermit.employees.description'),
                            icon: (
                                <svg className="w-10 h-10 md:w-11 md:h-11" fill="none" stroke="#00B09C" viewBox="0 0 24 24" strokeWidth={1.5}>
                                    <path d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.059 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-12.75 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                                </svg>
                            ),
                        },
                        {
                            key: 'driverPass',
                            title: t('applyForSpecificPermit.driverPass.title'),
                            description: t('applyForSpecificPermit.driverPass.description'),
                            icon: (
                                <svg className="w-10 h-10 md:w-11 md:h-11" fill="none" stroke="#00B09C" viewBox="0 0 24 24" strokeWidth={1.5}>
                                    <path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                    <path d="M8.25 12h7.5m-7.5 3h7.5" strokeLinecap="round" />
                                </svg>
                            ),
                        },
                    ].map(({ key, title, icon, description }) => (
                        <div
                            key={key}
                            className="bg-white rounded-2xl p-6 md:p-8 lg:p-10 border flex flex-col items-center gap-4 md:gap-6 hover:shadow-md transition-all"
                            style={{ borderWidth: '0.5px', borderColor: '#C6C6C6' }}
                        >
                            <div className="flex-shrink-0">
                                {icon}
                            </div>
                            <div className="flex flex-col items-center gap-2 text-center">
                                <h4 className="font-medium text-base md:text-lg" style={{ color: '#1F1F1F' }}>
                                    {title}
                                </h4>
                                <p className="text-sm md:text-base leading-relaxed" style={{ color: '#4C4C4C' }}>
                                    {description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
