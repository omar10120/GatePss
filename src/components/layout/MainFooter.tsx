'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';

export const MainFooter: React.FC = () => {
    const t = useTranslations('HomePage');
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();

    const toggleLocale = () => {
        const newLocale = locale === 'en' ? 'ar' : 'en';
        const newPathname = pathname.replace(`/${locale}`, `/${newLocale}`);
        router.push(newPathname || `/${newLocale}`);
    };

    return (
        <footer id="about" className="bg-[#F8F9FA] py-[38px] px-[128px]">
            <div className="container mx-auto">
                {/* Upper Section */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-6">
                    {/* Left Side - Language Selector */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggleLocale}
                            className="flex items-center gap-1 text-[#003366] hover:text-info-500 transition-colors"
                        >
                            <span className="text-[16px] font-normal font-['Inter']">{locale === 'en' ? 'English' : 'العربية'}</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                    </div>

                    {/* Right Side - Social Media Icons */}
                    <div className="flex items-center gap-[16px]">
                        {[
                            { icon: 'f', label: 'Facebook' },
                            { icon: 't', label: 'Twitter' },
                            { icon: 'i', label: 'Instagram' },
                            { icon: 'y', label: 'YouTube' },
                            { icon: 'in', label: 'LinkedIn' }
                        ].map((social, idx) => (
                            <a key={idx} href="#" className="w-[36px] h-[36px] rounded-full bg-[#0666A3] flex items-center justify-center text-white transition-colors hover:bg-blue-700" aria-label={social.label}>
                                <span className="text-sm font-bold uppercase">{social.icon}</span>
                            </a>
                        ))}
                    </div>
                </div>

                {/* Divider Line */}
                <div className="border-t border-[#909090] my-6"></div>

                {/* Lower Section */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    {/* Left Side - Copyright */}
                    <div className="text-[14px] leading-[16px] text-[#92989F] font-['Rubik'] text-center tracking-[0.25px]">
                        {t('footer.technicalSupport')} Pixel Tech.©2025 {t('footer.allRightsReserved')}
                    </div>

                    {/* Right Side - Navigation Links */}
                    <div className="flex gap-[28px] text-[14px] leading-[16px] text-[#92989F] font-['Rubik']">
                        <Link href="#faq" className="hover:text-gray-900 transition-colors">
                            {t('footer.faq')}
                        </Link>
                        <Link href="#privacy" className="hover:text-gray-900 transition-colors">
                            {t('footer.privacy')}
                        </Link>
                        <Link href="#terms" className="hover:text-gray-900 transition-colors">
                            {t('footer.terms')}
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};
