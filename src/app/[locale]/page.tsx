'use client'
import Image from 'next/image';
import Link from 'next/link';

import HowtWork from '@/components/ui/HowtWork';
import { useLocale } from 'next-intl';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

export default function HomePage() {
    const t = useTranslations('HomePage');
    const locale = useLocale();

    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [activeFaq, setActiveFaq] = useState<number | null>(0);

    return (
        <div className="min-h-screen bg-white">

            {/* Hero Section */}
            <section className="relative min-h-[600px] md:min-h-[700px] flex items-center justify-center overflow-hidden">
                {/* Background Image with Overlay */}
                <div className="absolute inset-0">
                    <div
                        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                        style={{
                            backgroundImage: 'url(https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1920&q=80)',
                        }}
                    >
                        <div className="absolute inset-0 bg-blue-900/60"></div>
                    </div>
                </div>

                {/* Content */}
                <div className="relative z-10 container mx-auto px-4 lg:px-6 text-center text-white">
                    <div className="max-w-4xl mx-auto">
                        {/* Main Title */}
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                            {t('hero.title')}
                        </h1>

                        {/* Subtitle */}
                        <p className="text-4xl md:text-5xl text-blue-100 mb-12 max-w-2xl mx-auto">
                            {t('hero.subtitle')}
                        </p>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href={`/${locale}/track-application`}
                                className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-8 py-4 rounded-full font-semibold text-lg border border-white/20 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                </svg>
                                {t('actions.trackApplication')}
                            </Link>
                            <Link
                                href={`/${locale}/RequestPermit`}
                                className="inline-flex items-center justify-center gap-2 bg-info-500 hover:bg-green-600 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                {t('actions.requestPermit')}
                            </Link>
                        </div>
                        <div className="flex sm:flex-row justify-center pt-32 animate-slide-up">
                            <a href={`/${locale}/about`} className="text-white/80 hover:text-white transition-colors duration-300">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-12 animate-bounce">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 5.25 7.5 7.5 7.5-7.5m-15 6 7.5 7.5 7.5-7.5" />
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <HowtWork />

            {/* Services Section */}
            <section id="services" className="py-20 px-4 bg-white">
                <div className="container mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold text-center mb-4" style={{ color: '#1e3a5f' }}>
                        {t('services.title')}
                    </h2>

                    <p className="text-center text-gray-700 mb-16 max-w-2xl mx-auto text-lg">
                        {t('services.subtitle')}
                    </p>
                    {/* CTA Button */}
                    <div className="text-center py-6">
                        <Link
                            href="/RequestPermit"
                            className="inline-flex items-center justify-center gap-2 text-white px-12 py-4 rounded-full font-bold text-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                            style={{ backgroundColor: '#14b8a6' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0d9488'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#14b8a6'}
                        >
                            {t('actions.requestPermit')}
                        </Link>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-12">
                        {[
                            {
                                key: 'seawater',
                                title: t('services.seawater'),
                                describtion: t('services.seawaterDescription'),
                                icon: (
                                    <svg className="w-16 h-16" fill="none" stroke="#14b8a6" viewBox="0 0 24 24" strokeWidth={1.5}>
                                        <circle cx="6" cy="6" r="3" strokeWidth={2} />
                                        <path d="M6 3v6M3 6h6" strokeWidth={1.5} />
                                        <path d="M6 6l-2-2" strokeWidth={1.5} />
                                        <path d="M4 4l1 1M8 4l-1 1" strokeWidth={1.5} strokeLinecap="round" />
                                        <path d="M8 14l-2 4h8l-2-4" strokeWidth={2} strokeLinecap="round" />
                                        <path d="M10 14v-4M10 10l2-2" strokeWidth={2} />
                                        <path d="M4 18c2 0 4-1 6-1s4 1 6 1" strokeWidth={1.5} strokeLinecap="round" />
                                        <path d="M4 20c2 0 4-1 6-1s4 1 6 1" strokeWidth={1.5} strokeLinecap="round" />
                                    </svg>
                                ),
                            },
                            {
                                key: 'cooling',
                                title: t('services.cooling'),
                                describtion: t('services.cooling'),
                                icon: (
                                    <svg className="w-16 h-16" fill="none" stroke="#14b8a6" viewBox="0 0 24 24" strokeWidth={1.5}>
                                        <path d="M8 4h8M8 4v16M16 4v16" strokeWidth={2} />
                                        <path d="M6 20h12" strokeWidth={2} strokeLinecap="round" />
                                        <path d="M10 8h4M10 12h4M10 16h4" strokeWidth={1.5} />
                                        <circle cx="6" cy="20" r="1" fill="#14b8a6" />
                                        <circle cx="9" cy="20" r="0.8" fill="#14b8a6" />
                                        <circle cx="12" cy="20" r="1" fill="#14b8a6" />
                                        <circle cx="15" cy="20" r="0.8" fill="#14b8a6" />
                                        <circle cx="18" cy="20" r="1" fill="#14b8a6" />
                                        <path d="M4 20c1 0 2-0.5 3-0.5s2 0.5 3 0.5" strokeWidth={1} strokeLinecap="round" />
                                    </svg>
                                ),
                            },
                            {
                                key: 'potable',
                                title: t('services.potable'),
                                describtion: t('services.potableDescription'),
                                icon: (
                                    <svg className="w-16 h-16" fill="none" stroke="#14b8a6" viewBox="0 0 24 24" strokeWidth={1.5}>
                                        <path d="M6 12h12v6H6z" strokeWidth={2} />
                                        <path d="M6 12l6-6 6 6" strokeWidth={2} strokeLinecap="round" />
                                        <path d="M10 12v4M14 12v4" strokeWidth={1.5} />
                                        <path d="M16 8v2" strokeWidth={1.5} />
                                        <path d="M12 18v2" strokeWidth={2} />
                                        <path d="M10 20h4" strokeWidth={2} strokeLinecap="round" />
                                        <circle cx="11" cy="22" r="0.8" fill="#14b8a6" />
                                        <circle cx="12" cy="23" r="1" fill="#14b8a6" />
                                        <circle cx="13" cy="22" r="0.8" fill="#14b8a6" />
                                        <circle cx="8" cy="20" r="0.5" fill="#14b8a6" />
                                        <circle cx="16" cy="20" r="0.5" fill="#14b8a6" />
                                        <circle cx="9" cy="22" r="0.5" fill="#14b8a6" />
                                        <circle cx="15" cy="22" r="0.5" fill="#14b8a6" />
                                    </svg>
                                ),
                            },
                            {
                                key: 'irrigation',
                                title: t('services.irrigation'),
                                describtion: t('services.irrigationDescription'),
                                icon: (
                                    <svg className="w-16 h-16" fill="none" stroke="#14b8a6" viewBox="0 0 24 24" strokeWidth={1.5}>
                                        <circle cx="12" cy="8" r="2" strokeWidth={2} />
                                        <path d="M12 6v4" strokeWidth={2} />
                                        <path d="M8 10c2-2 4-1 6 0" strokeWidth={2} strokeLinecap="round" />
                                        <path d="M10 12c1-1 2-0.5 3 0" strokeWidth={1.5} strokeLinecap="round" />
                                        <path d="M14 12c-1-1-2-0.5-3 0" strokeWidth={1.5} strokeLinecap="round" />
                                        <path d="M16 10c-2-2-4-1-6 0" strokeWidth={2} strokeLinecap="round" />
                                        <circle cx="8" cy="16" r="1.5" fill="#14b8a6" opacity="0.6" />
                                        <circle cx="12" cy="17" r="1.5" fill="#14b8a6" opacity="0.6" />
                                        <circle cx="16" cy="16" r="1.5" fill="#14b8a6" opacity="0.6" />
                                        <path d="M8 16v2M12 17v2M16 16v2" strokeWidth={1.5} strokeLinecap="round" />
                                        <path d="M10 4c1 0 2 1 2 2M14 4c-1 0-2 1-2 2" strokeWidth={1.5} strokeLinecap="round" />
                                    </svg>
                                ),
                            },
                            {
                                key: 'process1',
                                title: t('services.process1'),
                                describtion: t('services.process1Description'),
                                icon: (
                                    <svg className="w-16 h-16" fill="none" stroke="#14b8a6" viewBox="0 0 24 24" strokeWidth={1.5}>
                                        <path d="M6 8h12" strokeWidth={2} strokeLinecap="round" />
                                        <path d="M6 8v8h12V8" strokeWidth={2} />
                                        <path d="M8 16v4" strokeWidth={2} strokeLinecap="round" />
                                        <path d="M10 18v2" strokeWidth={1.5} strokeLinecap="round" />
                                        <path d="M12 16v4" strokeWidth={2} strokeLinecap="round" />
                                        <path d="M14 18v2" strokeWidth={1.5} strokeLinecap="round" />
                                        <path d="M16 16v4" strokeWidth={2} strokeLinecap="round" />
                                        <path d="M4 20c2 0 4-1 6-1s4 1 6 1s4-1 6-1" strokeWidth={1.5} strokeLinecap="round" />
                                        <path d="M4 22c2 0 4-1 6-1s4 1 6 1s4-1 6-1" strokeWidth={1.5} strokeLinecap="round" />
                                    </svg>
                                ),
                            },
                            {
                                key: 'process2',
                                title: t('services.process2'),
                                describtion: t('services.process1Description'),
                                icon: (
                                    <svg className="w-16 h-16" fill="none" stroke="#14b8a6" viewBox="0 0 24 24" strokeWidth={1.5}>
                                        <path d="M6 6h12v12H6z" strokeWidth={2} />
                                        <path d="M6 10h12M6 14h12" strokeWidth={1.5} />
                                        <path d="M10 4v2M14 4v2M10 18v2M14 18v2" strokeWidth={1.5} strokeLinecap="round" />
                                        <circle cx="12" cy="12" r="2" strokeWidth={2} />
                                        <path d="M12 10v4M10 12h4" strokeWidth={1.5} />
                                        <rect x="8" y="8" width="8" height="8" strokeWidth={1.5} rx="1" />
                                        <path d="M10 10h4M10 12h4M10 14h4" strokeWidth={1} />
                                    </svg>
                                ),
                            },
                        ].map(({ key, title, icon, describtion }) => (
                            <div
                                key={key}
                                className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition-all flex flex-col items-center gap-4"
                            >
                                <div className="flex-shrink-0">
                                    {icon}
                                </div>
                                <h4 className="font-semibold text-gray-800 text-base flex-1">
                                    {title}
                                </h4>
                                <p className="text-gray-600 text-sm flex-1">
                                    {describtion}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section id="info" className="py-20 px-4 bg-white">
                <div className="container mx-auto">
                    <div className='flex flex-col p-8 md:p-16 lg:p-24 mx-auto rounded-3xl justify-center items-center gap-6 bg-gradient-to-r from-[#0571B6] to-[#003658] text-center'>
                        <h1 className='text-4xl md:text-6xl lg:text-4xl text-white font-bold leading-tight'>{t('services.GetFast')}</h1>
                        <p className='text-lg md:text-xl text-white opacity-90'>{t('services.GetFastDescription')}</p>
                        <Link
                            href={`/${locale}/track-application`}
                            className="inline-flex items-center justify-center gap-2 text-white px-12 py-4 rounded-full font-bold text-xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 "
                            style={{ backgroundColor: '#14b8a6' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0d9488'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#14b8a6'}
                        >
                            {t('actions.trackApplication')}
                        </Link>
                    </div>
                </div>
            </section>


            <section id="request-permit" className="py-20 px-4 bg-white">
                <div className="container mx-auto">
                    <div className='flex flex-col p-8 md:p-16 lg:p-24 mx-auto rounded-3xl justify-center items-center gap-8 text-center'>
                        <h1 className='text-4xl md:text-6xl lg:text-7xl text-blue-900 font-bold leading-tight'>{t('services.GetFast')}</h1>
                        <p className='text-lg md:text-xl text-gray-600 max-w-2xl'>{t('services.GetFastDescription')}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 w-full max-w-7xl mx-auto mb-8">
                            {[
                                {
                                    key: 'seawater',
                                    title: t('services.seawater'),
                                    describtion: t('services.seawaterDescription'),
                                    icon: (
                                        <svg className="w-12 h-12 opacity-70 " fill="none" stroke="#14b8a6" viewBox="0 0 24 24" strokeWidth={1.5}>
                                            {/* Sun with quarter section */}
                                            <circle cx="6" cy="6" r="3" strokeWidth={2} />
                                            <path d="M6 3v6M3 6h6" strokeWidth={1.5} />
                                            <path d="M6 6l-2-2" strokeWidth={1.5} />
                                            {/* Birds */}
                                            <path d="M4 4l1 1M8 4l-1 1" strokeWidth={1.5} strokeLinecap="round" />
                                            {/* Sailboat */}
                                            <path d="M8 14l-2 4h8l-2-4" strokeWidth={2} strokeLinecap="round" />
                                            <path d="M10 14v-4M10 10l2-2" strokeWidth={2} />
                                            {/* Water waves */}
                                            <path d="M4 18c2 0 4-1 6-1s4 1 6 1" strokeWidth={1.5} strokeLinecap="round" />
                                            <path d="M4 20c2 0 4-1 6-1s4 1 6 1" strokeWidth={1.5} strokeLinecap="round" />
                                        </svg>
                                    ),
                                },
                                {
                                    key: 'cooling',
                                    title: t('services.cooling'),
                                    describtion: t('services.cooling'),
                                    icon: (
                                        <svg className="w-12 h-12 opacity-70" fill="none" stroke="#14b8a6" viewBox="0 0 24 24" strokeWidth={1.5}>
                                            {/* Cooling tower structure */}
                                            <path d="M8 4h8M8 4v16M16 4v16" strokeWidth={2} />
                                            <path d="M6 20h12" strokeWidth={2} strokeLinecap="round" />
                                            <path d="M10 8h4M10 12h4M10 16h4" strokeWidth={1.5} />
                                            {/* Water droplets */}
                                            <circle cx="6" cy="20" r="1" fill="#14b8a6" />
                                            <circle cx="9" cy="20" r="0.8" fill="#14b8a6" />
                                            <circle cx="12" cy="20" r="1" fill="#14b8a6" />
                                            <circle cx="15" cy="20" r="0.8" fill="#14b8a6" />
                                            <circle cx="18" cy="20" r="1" fill="#14b8a6" />
                                            {/* Wavy lines */}
                                            <path d="M4 20c1 0 2-0.5 3-0.5s2 0.5 3 0.5" strokeWidth={1} strokeLinecap="round" />
                                        </svg>
                                    ),
                                },
                                {
                                    key: 'potable',
                                    title: t('services.potable'),
                                    describtion: t('services.potableDescription'),
                                    icon: (
                                        <svg className="w-12 h-12 opacity-70" fill="none" stroke="#14b8a6" viewBox="0 0 24 24" strokeWidth={1.5}>
                                            {/* House structure */}
                                            <path d="M6 12h12v6H6z" strokeWidth={2} />
                                            <path d="M6 12l6-6 6 6" strokeWidth={2} strokeLinecap="round" />
                                            <path d="M10 12v4M14 12v4" strokeWidth={1.5} />
                                            {/* Chimney */}
                                            <path d="M16 8v2" strokeWidth={1.5} />
                                            {/* Faucet */}
                                            <path d="M12 18v2" strokeWidth={2} />
                                            <path d="M10 20h4" strokeWidth={2} strokeLinecap="round" />
                                            {/* Dripping water */}
                                            <circle cx="11" cy="22" r="0.8" fill="#14b8a6" />
                                            <circle cx="12" cy="23" r="1" fill="#14b8a6" />
                                            <circle cx="13" cy="22" r="0.8" fill="#14b8a6" />
                                            {/* Water droplets around */}
                                            <circle cx="8" cy="20" r="0.5" fill="#14b8a6" />
                                            <circle cx="16" cy="20" r="0.5" fill="#14b8a6" />
                                            <circle cx="9" cy="22" r="0.5" fill="#14b8a6" />
                                            <circle cx="15" cy="22" r="0.5" fill="#14b8a6" />
                                        </svg>
                                    ),
                                },
                                {
                                    key: 'irrigation',
                                    title: t('services.irrigation'),
                                    describtion: t('services.irrigationDescription'),
                                    icon: (
                                        <svg className="w-12 h-12 opacity-70" fill="none" stroke="#14b8a6" viewBox="0 0 24 24" strokeWidth={1.5}>
                                            {/* Sprinkler head */}
                                            <circle cx="12" cy="8" r="2" strokeWidth={2} />
                                            <path d="M12 6v4" strokeWidth={2} />
                                            {/* Water arc */}
                                            <path d="M8 10c2-2 4-1 6 0" strokeWidth={2} strokeLinecap="round" />
                                            <path d="M10 12c1-1 2-0.5 3 0" strokeWidth={1.5} strokeLinecap="round" />
                                            <path d="M14 12c-1-1-2-0.5-3 0" strokeWidth={1.5} strokeLinecap="round" />
                                            <path d="M16 10c-2-2-4-1-6 0" strokeWidth={2} strokeLinecap="round" />
                                            {/* Plants/flowers */}
                                            <circle cx="8" cy="16" r="1.5" fill="#14b8a6" opacity="0.6" />
                                            <circle cx="12" cy="17" r="1.5" fill="#14b8a6" opacity="0.6" />
                                            <circle cx="16" cy="16" r="1.5" fill="#14b8a6" opacity="0.6" />
                                            <path d="M8 16v2M12 17v2M16 16v2" strokeWidth={1.5} strokeLinecap="round" />
                                            {/* Signal/WiFi icon above */}
                                            <path d="M10 4c1 0 2 1 2 2M14 4c-1 0-2 1-2 2" strokeWidth={1.5} strokeLinecap="round" />
                                        </svg>
                                    ),
                                },
                                {
                                    key: 'process1',
                                    title: t('services.process1'),
                                    describtion: t('services.process1Description'),
                                    icon: (
                                        <svg className="w-12 h-12 opacity-70" fill="none" stroke="#14b8a6" viewBox="0 0 24 24" strokeWidth={1.5}>
                                            {/* Pipe/conduit */}
                                            <path d="M6 8h12" strokeWidth={2} strokeLinecap="round" />
                                            <path d="M6 8v8h12V8" strokeWidth={2} />
                                            {/* Water stream */}
                                            <path d="M8 16v4" strokeWidth={2} strokeLinecap="round" />
                                            <path d="M10 18v2" strokeWidth={1.5} strokeLinecap="round" />
                                            <path d="M12 16v4" strokeWidth={2} strokeLinecap="round" />
                                            <path d="M14 18v2" strokeWidth={1.5} strokeLinecap="round" />
                                            <path d="M16 16v4" strokeWidth={2} strokeLinecap="round" />
                                            {/* Wavy water body */}
                                            <path d="M4 20c2 0 4-1 6-1s4 1 6 1s4-1 6-1" strokeWidth={1.5} strokeLinecap="round" />
                                            <path d="M4 22c2 0 4-1 6-1s4 1 6 1s4-1 6-1" strokeWidth={1.5} strokeLinecap="round" />
                                        </svg>
                                    ),
                                },
                                {
                                    key: 'process2',
                                    title: t('services.process2'),
                                    describtion: t('services.process1Description'),
                                    icon: (
                                        <svg className="w-12 h-12 opacity-70" fill="none" stroke="#14b8a6" viewBox="0 0 24 24" strokeWidth={1.5}>
                                            {/* Interconnected pipes */}
                                            <path d="M6 6h12v12H6z" strokeWidth={2} />
                                            <path d="M6 10h12M6 14h12" strokeWidth={1.5} />
                                            {/* Vertical connections */}
                                            <path d="M10 4v2M14 4v2M10 18v2M14 18v2" strokeWidth={1.5} strokeLinecap="round" />
                                            {/* Valve/wheel */}
                                            <circle cx="12" cy="12" r="2" strokeWidth={2} />
                                            <path d="M12 10v4M10 12h4" strokeWidth={1.5} />
                                            {/* Filter/processing unit */}
                                            <rect x="8" y="8" width="8" height="8" strokeWidth={1.5} rx="1" />
                                            <path d="M10 10h4M10 12h4M10 14h4" strokeWidth={1} />
                                        </svg>
                                    ),
                                },
                            ].map(({ key, title, icon, describtion }) => (
                                <div
                                    key={key}
                                    className="bg-white rounded-full px-4 py-2 border border-gray-200 hover:shadow-md transition-all flex flex items-center gap-4 "
                                >
                                    <div className="flex-shrink-0">
                                        {icon}
                                    </div>
                                    <h4 className="font-semibold text-gray-800 text-base flex-1">
                                        {title}
                                    </h4>

                                </div>
                            ))}

                        </div>
                        <Link
                            href={`/${locale}/track-application`}
                            className="inline-flex items-center justify-center gap-2 text-white px-12 py-4 rounded-full font-bold text-xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 "
                            style={{ backgroundColor: '#14b8a6' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0d9488'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#14b8a6'}
                        >
                            {t('actions.trackApplication')}
                        </Link>


                    </div>
                </div>
            </section>


            <section id="assistance" className="py-20 px-4 bg-white">
                <div className="container mx-auto max-w-7xl">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-3xl font-bold text-blue-900 mb-4">
                            {t('assistance.title')}
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            {t('assistance.description')}
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-12 gap-12 items-start">
                        {/* FAQ Section */}
                        <div className="lg:col-span-7 space-y-4">
                            {[1, 2, 3, 4, 5, 6].map((num) => {
                                const index = num - 1;
                                const isActive = activeFaq === index;
                                return (
                                    <div
                                        key={index}
                                        className={`rounded-xl transition-all duration-300 overflow-hidden ${isActive ? 'bg-slate-900 shadow-lg' : 'bg-white border border-gray-100 hover:border-blue-200'
                                            }`}
                                    >
                                        <button
                                            onClick={() => setActiveFaq(isActive ? null : index)}
                                            className="w-full text-start px-6 py-6 flex items-center justify-between group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <span className={`text-2xl font-bold ${isActive ? 'text-blue-400' : 'text-blue-300 group-hover:text-blue-400'
                                                    }`}>
                                                    {num.toString().padStart(2, '0')}.
                                                </span>
                                                <span className={`text-lg font-bold ${isActive ? 'text-white' : 'text-gray-800'
                                                    }`}>
                                                    {t(`assistance.faqs.item${num}.q`)}
                                                </span>
                                            </div>
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isActive ? 'bg-blue-400 text-white' : 'bg-blue-100 text-blue-500 group-hover:bg-blue-200'
                                                }`}>
                                                <svg className={`w-5 h-5 transition-transform ${isActive ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </button>
                                        <div
                                            className={`transition-all duration-300 ease-in-out ${isActive ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                                                }`}
                                        >
                                            <div className="px-6 pb-6 pt-2 text-gray-300 leading-relaxed ps-[3.5rem]">
                                                {t(`assistance.faqs.item${num}.a`)}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Support Card */}
                        <div className="lg:col-span-5">
                            <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden p-8 text-center sticky top-24">
                                <div className="mb-8 relative hs-illustration bg-blue-50 rounded-2xl p-6">
                                    <Image src="/images/assistance.png" alt="Assistance" width={500} height={500} />
                                </div>

                                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                                    {t('assistance.getInTouch')}
                                </h3>
                                <p className="text-gray-600 mb-8 leading-relaxed">
                                    {t('assistance.supportDescription')}
                                </p>

                                <div className="space-y-4 mb-8">
                                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl group hover:bg-blue-50 transition-colors">
                                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <div className="text-start">
                                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{locale === 'ar' ? 'البريد الإلكتروني' : 'Email'}</p>
                                            <p className="font-bold text-gray-800">{t('assistance.supportEmail')}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl group hover:bg-blue-50 transition-colors">
                                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                        </div>
                                        <div className="text-start">
                                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{locale === 'ar' ? 'الهاتف' : 'Phone'}</p>
                                            <p className="font-bold text-gray-800 tracking-wider font-sans">{t('assistance.supportPhone')}</p>
                                        </div>
                                    </div>
                                </div>

                                <Link
                                    href="#contact"
                                    className="block w-full py-4 text-center font-bold text-teal-500 hover:text-teal-600 border-2 border-teal-50 rounded-2xl hover:border-teal-100 transition-all active:scale-95"
                                >
                                    {t('assistance.contactSupport')}
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            0
        </div>
    );
}
