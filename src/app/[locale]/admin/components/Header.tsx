import LanguageSelector from '@/components/ui/LanguageSelector'
import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from '@/i18n/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { LogoutConfirm } from '@/components/ui/LogoutConfirm';
import Image from 'next/image';

interface User {
    name?: string;
    email?: string;
    role?: string;
    permissions?: string[];
}

export default function Header() {
    const router = useRouter();
    const locale = useLocale() as 'en' | 'ar';
    const [user, setUser] = useState<User | null>(null);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const t = useTranslations('Admin.dashboard');

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        if (isDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isDropdownOpen]);

    const handleLogout = async () => {
        const token = localStorage.getItem('token');

        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
        } catch (error) {
            console.error('Logout error:', error);
        }

        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/admin/login');
    };

    return (
        <>
            {/* Header */}
            <header className="bg-white sticky top-0 z-30 border-b border-gray-50">
                <div className="px-8 py-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-xl font-bold text-gray-900">{t('title')}</h1>
                        <div className="flex items-center gap-6">
                            <LanguageSelector />
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                                >
                                    <div className={`text-right ${locale === 'ar' ? 'text-left' : 'text-right'}`}>
                                        <p className="text-sm font-bold text-gray-900">{user?.name || 'User'}</p>
                                        <p className="text-xs text-gray-500">{user?.email || 'Enter your Email'}</p>
                                    </div>
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-gray-200 overflow-hidden bg-white">
                                        <Image
                                            src="/images/Logo.png"
                                            alt={user?.name || 'User'}
                                            width={40}
                                            height={40}
                                            className="object-cover w-full h-full"
                                        />
                                    </div>
                                    <svg
                                        className={`w-5 h-5 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {isDropdownOpen && (
                                    <div className={`absolute ${locale === 'ar' ? 'left-0' : 'right-0'} top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50`}>
                                        <button
                                            onClick={() => {
                                                setIsDropdownOpen(false);
                                                setIsLogoutModalOpen(true);
                                            }}
                                            className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 text-gray-700"
                                        >
                                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                            </svg>
                                            <span>{t('logout')}</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <LogoutConfirm
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
                onConfirm={handleLogout}
            />
        </>
    )
}
