'use client';

import React from 'react';
import { Link, usePathname } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useSidebar } from './SidebarContext';

interface SidebarItem {
    label: string;
    href: string;
    icon: React.ReactNode;
    active?: boolean;
    permission?: string;
}

interface SidebarProps {
    items: SidebarItem[];
    locale?: 'en' | 'ar';
}

export const Sidebar: React.FC<SidebarProps> = ({ items, locale = 'en' }) => {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const t = useTranslations('Admin.dashboard');
    const { isMobile, isSidebarVisible, isLocked, closeSidebar, toggleLock } = useSidebar();

    const isRtl = locale === 'ar';
    const sidePosition = isRtl ? 'right-0' : 'left-0';
    const hiddenTranslate = isRtl ? 'translate-x-full' : '-translate-x-full';

    return (
        <>
            {isMobile && isSidebarVisible && (
                <button
                    type="button"
                    aria-label={t('closeMenu')}
                    className="fixed inset-0 z-40 bg-black/40 lg:hidden"
                    onClick={closeSidebar}
                />
            )}

            <aside
                className={`
                    w-64 bg-white flex flex-col h-screen fixed top-0 z-50 shadow-lg
                    transition-transform duration-300 ease-in-out
                    ${sidePosition}
                    ${isSidebarVisible ? 'translate-x-0' : hiddenTranslate}
                `.trim()}
                dir={isRtl ? 'rtl' : 'ltr'}
            >
                <div className="bg-white px-6 py-6 flex items-center justify-between gap-3">
                    <div className="relative w-16 h-16 flex-shrink-0">
                        <Image src="/images/Logo.png" alt="Majis Logo" width={500} height={500} />
                    </div>

                    {isMobile && (
                        <button
                            type="button"
                            onClick={closeSidebar}
                            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 lg:hidden"
                            aria-label={t('closeMenu')}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>

                <nav className="flex-1 overflow-y-auto">
                    {items.map((item, index) => {
                        let isActive = false;
                        if (item.href === '#') {
                            isActive = false;
                        } else if (item.active !== undefined) {
                            isActive = item.active;
                        } else {
                            const basePath = item.href.split('?')[0];
                            const queryString = item.href.includes('?') ? item.href.split('?')[1] : '';

                            const pathMatches = queryString
                                ? pathname === basePath
                                : pathname === basePath || pathname?.startsWith(basePath + '/');

                            if (pathMatches) {
                                if (queryString) {
                                    const params = new URLSearchParams(queryString);
                                    let allParamsMatch = true;
                                    for (const [key, value] of params.entries()) {
                                        if (searchParams.get(key) !== value) {
                                            allParamsMatch = false;
                                            break;
                                        }
                                    }
                                    isActive = allParamsMatch;
                                } else {
                                    isActive = true;
                                }
                            }
                        }

                        return (
                            <React.Fragment key={item.href + index}>
                                {index > 0 && <div className="border-t border-gray-200" />}
                                <Link
                                    href={item.href}
                                    onClick={closeSidebar}
                                    className={`flex items-center gap-4 px-6 py-4 transition-colors ${
                                        isActive
                                            ? 'bg-teal-500 text-white'
                                            : 'bg-white text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    <div className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-blue-500'}`}>
                                        {item.icon}
                                    </div>
                                    <span className={`font-medium ${isActive ? 'text-white' : 'text-gray-700'}`}>
                                        {item.label}
                                    </span>
                                </Link>
                            </React.Fragment>
                        );
                    })}
                </nav>

                <div className="border-t border-gray-200 p-4">
                    <button
                        type="button"
                        onClick={toggleLock}
                        className="hidden lg:flex w-full items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                        aria-pressed={isLocked}
                        title={isLocked ? t('unlockSidebar') : t('lockSidebar')}
                    >
                        {isLocked ? (
                            <svg className="w-5 h-5 text-[#00B09C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                                />
                            </svg>
                        )}
                        <span>{isLocked ? t('sidebarLocked') : t('sidebarUnlocked')}</span>
                    </button>
                </div>
            </aside>
        </>
    );
};
