'use client'
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useTranslations } from 'next-intl';

export default function Hero() {
    const t = useTranslations('HomePage');
    const locale = useLocale();
    return (
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
                            href={`/${locale}/ApplicationNumber`}
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
    )
}

