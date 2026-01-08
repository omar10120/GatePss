'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { Facebook, Twitter, Instagram, Youtube, Linkedin } from 'lucide-react';

export const MainFooter: React.FC = () => {
    const t = useTranslations('AboutPage'); // Using AboutPage keys as per your JSON
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();

    const toggleLocale = () => {
        const newLocale = locale === 'en' ? 'ar' : 'en';
        const newPathname = pathname.replace(`/${locale}`, `/${newLocale}`);
        router.push(newPathname || `/${newLocale}`);
    };

    return (
        <footer className="relative flex flex-col items-center pt-[38px] pb-[38px] px-[128px] gap-[20px] w-full h-[168px] bg-[#F8F9FA] isolation-auto">
            <div className="flex flex-col w-[1184px] gap-[20px]">

                {/* Frame 1171279255 - Language and Socials */}
                <div className="flex flex-row justify-between items-center w-full h-[36px]">

                    {/* Language Selector (Figma Frame 2) */}
                    <button
                        onClick={toggleLocale}
                        className="flex flex-row items-center gap-[4px] w-[111px] h-[24px] focus:outline-none"
                        dir="ltr"
                    >
                        <div className="relative w-[32px] h-[24px] rounded-[4px] overflow-hidden flex-shrink-0">
                            {locale === 'en' ? (
                                <svg width="32" height="24" viewBox="0 0 32 24" fill="none">
                                    <rect width="32" height="24" rx="4" fill="#003366" />
                                    <path d="M0 0L32 24M32 0L0 24" stroke="white" strokeWidth="4" />
                                    <path d="M0 0L32 24M32 0L0 24" stroke="#B90834" strokeWidth="2" />
                                    <path d="M16 0V24M0 12H32" stroke="white" strokeWidth="6" />
                                    <path d="M16 0V24M0 12H32" stroke="#B90834" strokeWidth="4" />
                                </svg>
                            ) : (
                                <svg width="32" height="24" viewBox="0 0 32 24" fill="none">
                                    <rect width="32" height="24" rx="4" fill="#00B09C" />
                                    <path d="M8 17H24V18H8V17Z" fill="white" />
                                    <path d="M10 16V19H11V16H10Z" fill="white" />
                                    <path d="M10 7C13 6 15 6 18 8C20 8 21 7 22 7" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                            )}
                        </div>
                        <span className="w-[55px] text-[16px] font-normal font-['Inter'] leading-[19px] text-[#003366] text-right">
                            {locale === 'en' ? 'English' : 'العربية'}
                        </span>
                        <svg
                            className={`w-[16px] h-[16px] text-[#003366] transition-transform ${locale === 'ar' ? 'rotate-90' : '-rotate-90'}`}
                            fill="currentColor" viewBox="0 0 20 20"
                        >
                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                    </button>

                    {/* Social Icons (Frame 1000005071) */}
                    <div className="flex flex-row items-center gap-[16px] h-[36px]">
                        {[
                            { Icon: Facebook, name: 'facebook' },
                            { Icon: Twitter, name: 'twitter' }, // This will be the standard bird or X depending on version
                            { Icon: Instagram, name: 'instagram' },
                            { Icon: Youtube, name: 'youtube' },
                            { Icon: Linkedin, name: 'linkedin' }
                        ].map(({ Icon, name }) => (
                            <Link
                                key={name}
                                href="#"
                                className="flex justify-center items-center w-[36px] h-[36px] bg-[#0666A3] rounded-full hover:bg-[#38B3E0] transition-all"
                            >
                                {/* size 16 matches your Figma vector size */}
                                <Icon size={16} color="white" strokeWidth={2} />
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Divider Line */}
                <div className="w-full h-0 border-t-[0.5px] border-[#909090]"></div>

                {/* Lower Section (Frame 1171277150) */}
                <div className="flex flex-row justify-between items-center w-full h-[16px]" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
                    <div className="text-[14px] font-['Rubik'] font-normal leading-[16px] text-[#92989F] tracking-[0.25px]">
                        Technical Support <span className="text-[#38B3E0]">Pixel Tech.</span> ©2025 All right reserved
                    </div>

                    <div className="flex flex-row gap-[28px] text-[14px] font-['Rubik'] font-normal leading-[16px] text-[#92989F]">
                        <Link href="#">FAQ</Link>
                        <Link href="#">Policy Privacy</Link>
                        <Link href="#">Terms& Conditions</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};