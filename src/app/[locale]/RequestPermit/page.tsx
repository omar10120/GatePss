'use client';

import { useTranslations } from 'next-intl';

import HowtWork from '@/components/ui/HowtWork';
import React from 'react';
import { GatePassForm } from '@/components/gate-pass/GatePassForm';


export default function RequestPermit() {
    const t = useTranslations('GatePassPage');

    return (
        <div className="min-h-screen bg-white">

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
                    <HowtWork />
                </div>
            </main>


        </div>
    );
}
