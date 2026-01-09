'use client';

import { useTranslations } from 'next-intl';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function FAQPage() {
    const t = useTranslations('HomePage.aboutPage');

    return (
        <div className="min-h-screen bg-white">
            <Navbar />



            <section
                className="relative w-full min-h-[400px] md:h-[458px] flex flex-col justify-center items-center px-6 py-16 md:pt-[88px] md:pb-[48px] gap-6 overflow-hidden"
                style={{
                    background: `linear-gradient(0deg, rgba(6, 41, 63, 0.88) 0%, rgba(17, 107, 165, 0.5456) 100%), url('/images/unnamed.jpg')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                }}
            >
                {/* Our Mission And Values - Title */}
                <h1 className="w-full max-w-[800px] font-['Rubik'] font-medium text-3xl md:text-[48px] leading-tight md:leading-[57px] text-center capitalize text-white z-10">
                    {t('hero.title')}
                </h1>

                {/* Subtitle / Description */}
                <p className="w-full max-w-[672px] font-['Rubik'] font-normal text-lg md:text-[24px] leading-relaxed md:leading-[38px] text-center capitalize text-white z-10">
                    {t('hero.subtitle')}
                </p>
            </section>
            <main className="py-10 md:py-20 px-4">
                <div className="container mx-auto">
                    {/* Mission & Vision Section */}
                    <section className="flex flex-col items-center py-10 md:py-20 bg-white w-full">
                        {/* Main Wrapper: Stacked on mobile, side-by-side on large screens */}
                        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-[28px] w-full max-w-[1238px]">

                            {/* Left Side: Image with Experience Card */}
                            <div
                                className="relative flex flex-col justify-end items-start w-full lg:w-1/2 min-h-[400px] md:h-[651px] rounded-[18px] overflow-hidden bg-cover bg-center"
                                style={{
                                    backgroundImage: "url('/images/Sohar_port.png')",
                                    transform: 'scaleX(-1)'
                                }}
                            >
                                {/* Experience Card Overlay */}
                                <div
                                    className="flex flex-row justify-center items-center gap-4 w-full sm:w-[362px] h-auto py-6 md:h-[140px] bg-[#00B09C] px-4"
                                    style={{ transform: 'scaleX(-1)' }}
                                >
                                    <span className="font-['Rubik'] font-medium text-5xl md:text-[88px] leading-tight text-white">
                                        +16
                                    </span>
                                    <span className="font-['Rubik'] font-medium text-xl md:text-[30px] md:leading-[38px] text-white capitalize">
                                        {t('mission.experience')}
                                    </span>
                                </div>
                            </div>

                            {/* Right Side: Content */}
                            <div className="flex flex-col items-start gap-6 lg:gap-[28px] w-full lg:w-1/2">

                                {/* Title Group */}
                                <div className="flex flex-col items-start gap-3 w-full">
                                    <h2 className="font-['Rubik'] font-medium text-3xl md:text-[38px] leading-tight text-[#0666A3]">
                                        {t('mission.title')}
                                    </h2>
                                    <h3 className="font-['Rubik'] font-medium text-lg md:text-[20px] leading-snug md:leading-[34px] text-[#38B3E0] capitalize">
                                        {t('mission.description')}
                                    </h3>
                                </div>

                                {/* Description Group */}
                                <div className="flex flex-col items-start gap-4 md:gap-[28px] w-full">
                                    <p className="font-['Rubik'] font-normal text-base md:text-[20px] leading-relaxed md:leading-[38px] text-[#1F1F1F]">
                                        {t('mission.section1')}
                                    </p>
                                    <p className="font-['Rubik'] font-normal text-base md:text-[20px] leading-relaxed md:leading-[38px] text-[#1F1F1F]">
                                        {t('mission.section2')}
                                    </p>
                                </div>
                            </div>

                        </div>
                    </section>
                </div>
            </main>

            <Footer />
        </div>
    );
}
