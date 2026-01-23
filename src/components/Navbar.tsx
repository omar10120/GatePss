'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import LanguageSelector from "@/components/ui/LanguageSelector"
import Image from 'next/image';
import Link from 'next/link';

export default function Navbar() {
    const t = useTranslations('HomePage');
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);



    return (
        <header className="bg-white shadow-sm sticky top-0 z-50">
            <div className="container mx-auto px-4 lg:px-6">
                <div className="flex items-center justify-between h-20">
                    {/* Logo */}
                    <Link href={`/${locale}`} className="flex items-center gap-3">
                        <div className="relative w-14 h-14">
                            <Image src="/images/Logo.png" alt="Majis Logo" width={500} height={500} />
                        </div>
                    </Link>

                    {/* Navigation */}
                    <nav className="hidden md:flex items-center gap-8">
                        <Link href={`/${locale}`} className="text-gray-700 hover:text-info-500 font-medium transition-colors">
                            {t('nav.home')}
                        </Link>
                        <Link href="#services" className="text-gray-700 hover:text-info-500 font-medium transition-colors">
                            {t('nav.services')}
                        </Link>
                        <Link href={`/${locale}/about`} className="text-gray-700 hover:text-info-500 font-medium transition-colors">
                            {t('nav.about')}
                        </Link>
                        {/* <Link href="#MAJIS" className="text-gray-700 hover:text-info-500 font-medium transition-colors"> */}
                        <Link href="https://majis.om/" className="text-gray-700 hover:text-info-500 font-medium transition-colors">
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
                    <div className="flex items-center gap-4">
                        {/* Language Selector */}
                        <LanguageSelector />

                        {/* Contact Button */}
                        <Link
                            href={`/${locale}/contact-us`}
                            className="flex items-center gap-2 bg-info-500 hover:bg-green-600 text-white px-5 py-2.5 rounded-full font-medium transition-colors shadow-md hover:shadow-lg"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <span className="hidden sm:inline">{t('contact')}</span>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden border-t border-gray-200 bg-white">
                    <nav className="container mx-auto px-4 py-4 flex flex-col gap-4">
                        <Link href={`/${locale}`} className="text-gray-700 hover:text-info-500 font-medium transition-colors py-2">
                            {t('nav.home')}
                        </Link>
                        <Link href="#services" className="text-gray-700 hover:text-info-500 font-medium transition-colors py-2">
                            {t('nav.services')}
                        </Link>
                        <Link href="#about" className="text-gray-700 hover:text-info-500 font-medium transition-colors py-2">
                            {t('nav.about')}
                        </Link>
                    </nav>
                </div>
            )}
        </header>
    );
}
