'use client';

import { useTranslations } from 'next-intl';
import HowtWork from '@/components/ui/HowtWork';

export default function HowItWorksPage() {
    const t = useTranslations('HomePage');
    const howtoVideo = '/videos/howtwork.mp4';

    return (
        <div className="min-h-screen bg-white">
            {/* Video Section */}
            <section className="py-20 px-4 bg-gray-50/50">
                <div className="container mx-auto px-4 lg:px-6">
                    <div className="text-center mb-12 md:mb-16">
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-medium mb-4 capitalize" style={{ color: '#0666A3' }}>{t('howItWorks.title')}</h2>
                        <p className="text-lg md:text-xl lg:text-2xl max-w-2xl mx-auto" style={{ color: '#1F1F1F' }}>{t('howItWorks.subtitle')}</p>
                    </div>

                    {/* Video */}
                    <div className="mb-12 md:mb-16 max-w-5xl mx-auto">
                        <div className="bg-gray-200 rounded-2xl shadow-sm border border-gray-300 p-6 md:p-8 lg:p-12 aspect-video flex items-center justify-center">
                            <div className="text-center">
                                {howtoVideo ? (
                                    <video controls src={howtoVideo} className="w-full h-full object-cover" preload="none" />
                                ) : (
                                    <svg className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <HowtWork />
        </div>
    );
}

