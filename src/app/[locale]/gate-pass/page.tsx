'use client';

import React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { GatePassForm } from '@/components/gate-pass/GatePassForm';
import { MainHeader, MainFooter } from '@/components/layout';

export default function GatePassRequestPage() {
    const t = useTranslations('GatePassPage');
    const tHome = useTranslations('HomePage');
    const locale = useLocale();

    return (
        <div className="min-h-screen bg-white">
            <MainHeader backgroundColor="bg-[#F6F6F6]" />

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
            <section className="py-24 bg-white">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-[48px] leading-[57px] font-medium text-[#0666A3] mb-4 font-['Rubik'] capitalize">
                            How It Works
                        </h2>
                        <p className="text-[#1F1F1F] max-w-2xl mx-auto text-[24px] leading-[28px] font-['Rubik']">
                            To ensures a smooth process for your business needs
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-[24px] max-w-[1244px] mx-auto">
                        {[
                            {
                                icon: (
                                    <svg className="w-[68px] h-[68px] text-[#00B09C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                ),
                                title: "24/7 Accessibility",
                                desc: "Submit your permit request anytime, anywhere, without visiting in person"
                            },
                            {
                                icon: (
                                    <svg className="w-[68px] h-[68px] text-[#00B09C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                ),
                                title: "24/7 Accessibility",
                                desc: "Submit your permit request anytime, anywhere, without visiting in person"
                            },
                            {
                                icon: (
                                    <svg className="w-[68px] h-[68px] text-[#00B09C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                ),
                                title: "24/7 Accessibility",
                                desc: "Submit your permit request anytime, anywhere, without visiting in person"
                            }
                        ].map((step, index) => (
                            <div key={index} className="bg-[#DFF6FF] p-[38px] rounded-[28px] h-[252px] flex flex-col items-center text-center transition-all hover:shadow-lg">
                                <div className="mb-8">
                                    {step.icon}
                                </div>
                                <h3 className="text-[24px] leading-[28px] font-medium text-[#1F1F1F] mb-2 font-['Rubik']">{step.title}</h3>
                                <p className="text-[#4C4C4C] text-[16px] leading-[22px] font-['Rubik']">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>


            <MainFooter />
        </div>
    );
}
