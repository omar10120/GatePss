'use client';

import { useTranslations, useLocale } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { MainHeader, MainFooter } from '@/components/layout';

export default function AboutPage() {
    const t = useTranslations('AboutPage');
    const commonT = useTranslations('HomePage'); // Reuse common translations
    const locale = useLocale();

    return (
        <div className="min-h-screen bg-white">
            <MainHeader />

            {/* Sub-Hero Section */}
            {/* Hero Section - Frame 1171277119 */}
            <section
                className="relative w-full h-[458px] flex flex-col justify-center items-center px-0 pt-[88px] pb-[48px] gap-[18px] overflow-hidden self-stretch"
                style={{
                    // Combining the Figma linear gradient with the background image
                    background: `linear-gradient(0deg, rgba(6, 41, 63, 0.88) 0%, rgba(17, 107, 165, 0.5456) 100%), url('/assets/unnamed.jpg')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                }}
            >
                {/* Our Mission And Values - Title */}
                <h1 className="w-full max-w-[530px] h-auto min-h-[57px] font-['Rubik'] font-medium text-[48px] leading-[57px] text-center capitalize text-white z-10">
                    {t('hero.title')}
                </h1>

                {/* Subtitle / Description */}
                <p className="w-full max-w-[672px] h-auto min-h-[76px] font-['Rubik'] font-normal text-[24px] leading-[38px] text-center capitalize text-white z-10">
                    {t('hero.subtitle')}
                </p>
            </section>

            {/* Mission & Vision Section */}
            <section className="flex flex-col items-center py-20 bg-white w-full">
                <div className="flex flex-row items-center gap-[28px] w-[1238px] h-[651px]">

                    {/* Left Side: Image with Experience Card (Frame 1171277140) */}
                    <div
                        className="relative flex flex-col justify-end items-start w-[609px] h-[651px] rounded-[18px] overflow-hidden bg-cover bg-center"
                        style={{
                            backgroundImage: "url('/assets/Sohar_port.png')",
                            // Note: transform: matrix(-1, 0, 0, 1, 0, 0) in CSS means flipped horizontally
                            transform: 'scaleX(-1)'
                        }}
                    >
                        {/* Experience Card Overlay (Frame 1171277139) */}
                        <div
                            className="flex flex-row justify-center items-center gap-[16px] w-[362px] h-[140px] bg-[#00B09C] px-[16px] py-[18px]"
                            style={{ transform: 'scaleX(-1)' }} // Un-flip the text inside the flipped container
                        >
                            <span className="w-[148px] h-[104px] font-['Rubik'] font-medium text-[88px] leading-[104px] text-white">
                                +16
                            </span>
                            <span className="w-[166px] h-[66px] font-['Rubik'] font-medium text-[30px] leading-[38px] text-white capitalize">
                                {t('mission.experience')}
                            </span>
                        </div>
                    </div>

                    {/* Right Side: Content (Frame 1171277145) */}
                    <div className="flex flex-col items-start gap-[28px] w-[551px] h-[523px]">

                        {/* Title Group (Frame 1171277144) */}
                        <div className="flex flex-col items-start gap-[12px] w-full h-[125px]">
                            <h2 className="w-full h-[45px] font-['Rubik'] font-medium text-[38px] leading-[45px] text-[#0666A3]">
                                {t('mission.title')}
                            </h2>
                            <h3 className="w-full h-[68px] font-['Rubik'] font-medium text-[20px] leading-[34px] text-[#38B3E0] capitalize">
                                {t('mission.description')}
                            </h3>
                        </div>

                        {/* Description Group (Frame 1171277143) */}
                        <div className="flex flex-col items-start gap-[28px] w-full h-[370px]">
                            <p className="w-full h-auto font-['Rubik'] font-normal text-[20px] leading-[38px] text-[#1F1F1F]">
                                {t('mission.section1')}
                            </p>
                            <p className="w-full h-auto font-['Rubik'] font-normal text-[20px] leading-[38px] text-[#1F1F1F]">
                                {t('mission.section2')}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <MainFooter />
        </div>
    );
}