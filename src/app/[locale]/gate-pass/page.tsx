'use client';

import { useTranslations } from 'next-intl';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import React from 'react';
import { GatePassForm } from '@/components/gate-pass/GatePassForm';


export default function FAQPage() {
    const t = useTranslations('GatePassPage');

    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <main className="py-10 md:py-20 px-4">
                <div className="container mx-auto">
                    {/* Hero Section */}
                    <section className="py-16 bg-white text-center">
                        <div className="container mx-auto px-4">
                            <h1 className="text-[38px] leading-[45px] font-medium text-[#0666A3] mb-3 font-['Rubik'] capitalize">
                                {t('title')}
                            </h1>
                            <p className="text-[#747474] max-w-[856px] mx-auto text-[18px] leading-[28px] font-['Rubik']">
                                {t('subtitle')}
                            </p>
                        </div>
                    </section>

                    {/* Form Section */}
                    <section className="pb-24">
                        <div className="container mx-auto px-4 max-w-[927px]">
                            <div className="bg-white rounded-3xl p-0">
                                <GatePassForm />
                            </div>
                        </div>
                    </section>

                    {/* How It Works Section */}
                    <section className="py-12 md:py-24 bg-white">
                        <div className="container mx-auto px-4">
                            {/* Header Section */}
                            <div className="text-center mb-10 md:mb-16">
                                <h2 className="text-3xl md:text-[48px] md:leading-[57px] font-medium text-[#0666A3] mb-4 font-['Rubik'] capitalize">
                                    {t('question')}
                                </h2>
                                <p className="text-[#1F1F1F] max-w-2xl mx-auto text-lg md:text-[24px] md:leading-[28px] font-['Rubik']">
                                    {t('answer')}
                                </p>
                            </div>

                            {/* Steps Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[1244px] mx-auto">
                                {[
                                    {
                                        icon: (
                                            <svg className="w-[68px] h-[68px] text-[#00B09C]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                <circle cx="12" cy="12" r="8" />
                                                <path d="M12 8v4l2.5 2.5" strokeLinecap="round" />
                                                <path d="M18 6a4 4 0 0 1 0 8" strokeLinecap="round" />
                                                <text x="14" y="8" fontSize="6" fontWeight="bold" fill="currentColor" stroke="none">24</text>
                                                <path d="M20 12c0 4.418-3.582 8-8 8s-8-3.582-8-8 3.582-8 8-8" strokeDasharray="2 2" />
                                            </svg>
                                        ),
                                        // Fixed: Removed the {} from around the t() calls
                                        title: t('step1_title'),
                                        desc: t('step1_desc')
                                    },
                                    {
                                        icon: (
                                            <svg className="w-[68px] h-[68px] text-[#00B09C]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                <path d="M6 4h12l-5 6v4l5 6H6l5-6v-4L6 4z" strokeLinecap="round" strokeLinejoin="round" />
                                                <circle cx="18" cy="18" r="4" fill="white" />
                                                <path d="M18 16v4M16 18h4" strokeLinecap="round" />
                                                <path d="M9 16l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
                                            </svg>
                                        ),
                                        title: t('step2_title'),
                                        desc: t('step2_desc')
                                    },
                                    {
                                        icon: (
                                            <svg className="w-[68px] h-[68px] text-[#00B09C]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                <rect x="4" y="4" width="10" height="10" rx="1" />
                                                <circle cx="9" cy="8" r="2" />
                                                <path d="M6 12c0-1 1-2 3-2s3 1 3 2" />
                                                <rect x="12" y="10" width="8" height="8" rx="1" fill="#00B09C" />
                                                <path d="M15 13v2" stroke="white" strokeLinecap="round" />
                                                <circle cx="16" cy="14" r="3" stroke="white" />
                                            </svg>
                                        ),
                                        title: t('step3_title'),
                                        desc: t('step3_desc')
                                    }
                                ].map((step, index) => (
                                    <div
                                        key={index}
                                        className="bg-[#E3F7FF] p-8 md:p-[38px] rounded-[28px] min-h-[252px] flex flex-col items-center text-center transition-all hover:shadow-lg border border-transparent hover:border-[#00B09C]/20"
                                    >
                                        <div className="mb-6">
                                            {step.icon}
                                        </div>
                                        <h3 className="text-xl md:text-[24px] md:leading-[28px] font-semibold text-[#1F1F1F] mb-3 font-['Rubik']">
                                            {step.title}
                                        </h3>
                                        <p className="text-[#4C4C4C] text-sm md:text-[16px] md:leading-[22px] font-['Rubik']">
                                            {step.desc}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                </div>
            </main>

            <Footer />
        </div>
    );
}
