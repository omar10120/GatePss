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
    backgroundColor = 'bg-[#F6F6F6]',
    showShadow = false
}) => {
    const t = useTranslations('HomePage');
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();

    const isActive = (path: string) => pathname.includes(path);

    const toggleLocale = () => {
        const newLocale = locale === 'en' ? 'ar' : 'en';
        const newPathname = pathname.replace(`/${locale}`, `/${newLocale}`);
        router.push(newPathname || `/${newLocale}`);
    };

    return (
        <header className={`${backgroundColor} ${showShadow ? 'shadow-sm' : ''} sticky top-0 z-50 h-[132px] flex flex-col justify-end items-center px-[98px] pt-[28px] pb-[14px] w-full`}>
            <div className="w-full max-w-[1244px] flex flex-row justify-between items-center h-[90px]">

                {/* Logo */}
                <div className="flex items-center flex-shrink-0">
                    <Link href={`/${locale}`} className="relative w-[114px] h-[90px]">
                        <Image src="/images/logo.png" alt="Majis" width={114} height={90} className="object-contain" />
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="hidden md:flex flex-row items-center gap-[48px] h-[28px]">
                    <Link href={`/${locale}`} className="text-[#1F1F1F] hover:text-[#0666A3] font-medium text-[24px] leading-[28px] font-['Rubik'] transition-colors">
                        {t('nav.home')}
                    </Link>
                    <Link href={`/${locale}#services`} className="text-[#1F1F1F] hover:text-[#0666A3] font-medium text-[24px] leading-[28px] font-['Rubik'] transition-colors">
                        {t('nav.services')}
                    </Link>
                    <Link
                        href={`/${locale}/about`}
                        className={`${isActive('/about') ? 'text-[#0666A3]' : 'text-[#1F1F1F]'} hover:text-[#0666A3] font-medium text-[24px] leading-[28px] font-['Rubik'] transition-colors`}
                    >
                        {t('nav.about')}
                    </Link>
                    <Link href="https://majis.om" target="_blank" className="text-[#1F1F1F] hover:text-[#0666A3] font-medium text-[24px] leading-[28px] font-['Rubik'] uppercase transition-colors">
                        {t('nav.MAJIS')}
                    </Link>
                </nav>

                {/* Right Side - Language & Contact (Frame 1171277126) */}
                <div className="flex flex-row items-center gap-[12px] w-[321px] h-[68px] flex-shrink-0">

                    {/* Language Selector */}
                    <button
                        onClick={toggleLocale}
                        className="flex flex-row items-center gap-[4px] w-[111px] h-[24px] group focus:outline-none"
                        dir="ltr"
                    >
                        <div className="relative w-[32px] h-[24px] rounded-[4px] overflow-hidden flex-shrink-0 shadow-sm border border-gray-100">
                            {locale === 'en' ? (
                                <svg width="32" height="24" viewBox="0 0 32 24" fill="none">
                                    <rect width="32" height="24" rx="4" fill="#003366" />
                                    <path d="M0 0L32 24M32 0L0 24" stroke="white" strokeWidth="4" />
                                    <path d="M0 0L32 24M32 0L0 24" stroke="#B90834" strokeWidth="2" />
                                    <path d="M16 0V24M0 12H32" stroke="white" strokeWidth="6" />
                                    <path d="M16 0V24M0 12H32" stroke="#B90834" strokeWidth="4" />
                                </svg>
                            ) : (
                                /* Saudi Arabia Flag SVG - Simplified for 32x24 */
                                <svg width="32" height="24" viewBox="0 0 32 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect width="32" height="24" rx="4" fill="#00B09C" /> {/* Brand Green */}
                                    {/* Simplified White Sword */}
                                    <path d="M8 17H24V18H8V17Z" fill="white" />
                                    <path d="M10 16V19H11V16H10Z" fill="white" />
                                    {/* Simplified Script block */}
                                    <path d="M10 7C10 7 11 6 13 6C15 6 16 8 18 8C20 8 21 7 22 7" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                                    <path d="M11 10C11 10 12 11 14 11C16 11 17 9 19 9C21 9 22 10 22 10" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                            )}
                        </div>

                        <span className="w-[55px] text-[16px] font-normal font-['Inter'] leading-[19px] text-[#003366] text-right">
                            {locale === 'en' ? 'English' : 'العربية'}
                        </span>

                        <svg
                            className={`w-[16px] h-[16px] text-[#003366] transition-transform duration-200 ${locale === 'ar' ? 'rotate-90' : '-rotate-90'}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                    </button>

                    {/* Contact Button */}
                    <Link
                        href={`/${locale}#contact`}
                        className="flex flex-row justify-center items-center gap-[10px] bg-[#00B09C] hover:bg-[#009685] text-white w-[198px] h-[68px] rounded-[34px] transition-all shadow-md active:scale-95 px-[28px] py-[23px]"
                    >
                        <svg className="w-[24px] h-[24px] flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20 15.5c-1.2 0-2.4-.2-3.6-.6-.3-.1-.7 0-1 .2l-2.2 2.2c-2.8-1.4-5.1-3.8-6.6-6.6l2.2-2.2c.3-.3.4-.7.2-1-.3-1.1-.5-2.3-.5-3.5 0-.6-.4-1-1-1H4c-.6 0-1 .4-1 1 0 9.4 7.6 17 17 17 .6 0 1-.4 1-1v-3.5c0-.6-.4-1-1-1z" />
                        </svg>
                        <span className="font-['Rubik'] font-semibold text-[20px] leading-[24px] whitespace-nowrap">
                            {t('contact')}
                        </span>
                    </Link>
                </div>
            </div>
        </header>
    );
};