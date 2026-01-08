'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';

interface MainHeaderProps {
    backgroundColor?: string;
    showShadow?: boolean;
}

export const MainHeader: React.FC<MainHeaderProps> = ({ 
    backgroundColor = 'bg-white',
    showShadow = true 
}) => {
    const t = useTranslations('HomePage');
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const toggleLocale = () => {
        const newLocale = locale === 'en' ? 'ar' : 'en';
        const newPathname = pathname.replace(`/${locale}`, `/${newLocale}`);
        router.push(newPathname || `/${newLocale}`);
    };

    return (
        <header className={`${backgroundColor} ${showShadow ? 'shadow-sm' : ''} sticky top-0 z-50 h-[132px] flex flex-col justify-end items-center px-[98px] pt-[28px] pb-[14px]`}>
            <div className="w-full max-w-[1244px] flex flex-row justify-between items-center h-[90px]">
                {/* Logo */}
                <div className="flex items-center">
                    <Link href={`/${locale}`} className="relative w-[114px] h-[90px]">
                        <Image src="/images/logo.png" alt="Majis" width={114} height={90} className="object-contain" />
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="hidden md:flex flex-row items-center gap-[48px]">
                    <Link href={`/${locale}`} className="text-[#1F1F1F] hover:text-info-500 font-medium text-[24px] leading-[28px] font-['Rubik'] transition-colors">
                        {t('nav.home')}
                    </Link>
                    <Link href={`/${locale}#services`} className="text-[#1F1F1F] hover:text-info-500 font-medium text-[24px] leading-[28px] font-['Rubik'] transition-colors">
                        {t('nav.services')}
                    </Link>
                    <Link href={`/${locale}#about`} className="text-[#1F1F1F] hover:text-info-500 font-medium text-[24px] leading-[28px] font-['Rubik'] transition-colors">
                        {t('nav.about')}
                    </Link>
                    <Link href="https://majis.om" target="_blank" className="text-[#1F1F1F] hover:text-info-500 font-medium text-[24px] leading-[28px] font-['Rubik'] uppercase transition-colors">
                        {t('nav.MAJIS')}
                    </Link>
                </nav>

                {/* Mobile Menu Button */}
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="md:hidden p-2 text-gray-700 hover:text-info-500"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {mobileMenuOpen ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        )}
                    </svg>
                </button>

                {/* Language Selector & Contact */}
                <div className="flex flex-row items-center gap-[12px] h-[68px]">
                    {/* Language Selector */}
                    <div className="flex flex-row items-center gap-[4px]">
                        <button
                            onClick={toggleLocale}
                            className="flex items-center gap-1 text-[#003366] hover:text-info-500 transition-colors"
                        >
                            <span className="text-[16px] font-normal font-['Inter'] leading-[19px]">{locale === 'en' ? 'English' : 'العربية'}</span>
                            <svg className="w-[16px] h-[16px] transform -rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                    </div>

                    {/* Contact Button */}
                    <Link
                        href={`/${locale}#contact`}
                        className="flex flex-row justify-center items-center gap-[10px] bg-[#00B09C] hover:bg-green-600 text-white px-[28px] py-[23px] rounded-[34px] w-[198px] h-[68px] font-semibold text-[20px] leading-[24px] font-['Rubik'] transition-colors shadow-md hover:shadow-lg"
                    >
                        <svg className="w-[24px] h-[24px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span className="hidden sm:inline">{t('contact')}</span>
                    </Link>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden absolute top-[132px] left-0 w-full border-t border-gray-200 bg-white shadow-lg">
                    <nav className="container mx-auto px-4 py-4 flex flex-col gap-4">
                        <Link href={`/${locale}`} className="text-gray-700 hover:text-info-500 font-medium transition-colors py-2" onClick={() => setMobileMenuOpen(false)}>
                            {t('nav.home')}
                        </Link>
                        <Link href={`/${locale}#services`} className="text-gray-700 hover:text-info-500 font-medium transition-colors py-2" onClick={() => setMobileMenuOpen(false)}>
                            {t('nav.services')}
                        </Link>
                        <Link href={`/${locale}#about`} className="text-gray-700 hover:text-info-500 font-medium transition-colors py-2" onClick={() => setMobileMenuOpen(false)}>
                            {t('nav.about')}
                        </Link>
                        <Link href="https://majis.om" target="_blank" className="text-gray-700 hover:text-info-500 font-medium transition-colors py-2" onClick={() => setMobileMenuOpen(false)}>
                            {t('nav.MAJIS')}
                        </Link>
                    </nav>
                </div>
            )}
        </header>
    );
};
