'use client';

import React from 'react';
import { Link, usePathname } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
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

    return (
        <aside
            className="w-64 bg-white flex flex-col h-screen fixed top-0 z-40 shadow-lg"
            style={{ [locale === 'ar' ? 'right' : 'left']: 0 }}
            dir={locale === 'ar' ? 'rtl' : 'ltr'}
        >
            {/* Logo Section - Dark Background */}
            <div className="bg-white px-6 py-6">
                <div className="flex items-center gap-3">
                    <div className="relative w-16 h-16">
                        <Image src="/images/Logo.png" alt="Majis Logo" width={500} height={500} />
                    </div>

                </div>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 overflow-y-auto">
                {items.map((item, index) => {
                    // Check if item is active
                    let isActive = false;
                    if (item.href === '#') {
                        isActive = false;
                    } else if (item.active !== undefined) {
                        isActive = item.active;
                    } else {
                        const basePath = item.href.split('?')[0];
                        const queryString = item.href.includes('?') ? item.href.split('?')[1] : '';

                        // Check pathname match
                        // If there's a query string, match exact pathname only
                        // Otherwise, match pathname or sub-paths
                        const pathMatches = queryString 
                            ? pathname === basePath 
                            : (pathname === basePath || pathname?.startsWith(basePath + '/'));
                        
                        if (pathMatches) {
                            // If there's a query string in href, check if current URL has matching params
                            if (queryString) {
                                const params = new URLSearchParams(queryString);
                                // Check if all params in href match current URL params
                                let allParamsMatch = true;
                                for (const [key, value] of params.entries()) {
                                    if (searchParams.get(key) !== value) {
                                        allParamsMatch = false;
                                        break;
                                    }
                                }
                                isActive = allParamsMatch;
                            } else {
                                // No query string, just check pathname
                                isActive = true;
                            }
                        }
                    }

                    return (
                        <React.Fragment key={item.href + index}>
                            {index > 0 && <div className="border-t border-gray-200"></div>}
                            <Link
                                href={item.href}
                                className={`flex items-center gap-4 px-6 py-4 transition-colors ${isActive
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

            {/* Bottom Section - Dark Background */}
            <div className="bg-white h-20"></div>
        </aside>
    );
};

