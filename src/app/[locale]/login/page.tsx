'use client';

import { useTranslations, useLocale } from 'next-intl';
import Image from 'next/image';
import LanguageSelector from '@/components/ui/LanguageSelector';


export default function LoginPage() {
    const t = useTranslations('HomePage.login');
    const locale = useLocale();

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-white overflow-hidden">
            {/* Left Side: Gradient and Content */}
            <div
                className="hidden md:flex md:w-1/2 flex-col items-center justify-center p-12 text-center text-white relative overflow-hidden bg-login-gradient"
            >
                {/* Decorative Shape (from design) */}
                <div className="mb-12 relative">
                    <Image
                        src="/images/svg/Pipe_light.svg"
                        alt="Pipe_light"
                        width={97}
                        height={97}
                        className="object-contain"
                        priority
                    />
                </div>

                <div className="max-w-lg space-y-6">
                    <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight">
                        {t('leftTitle')}
                    </h1>
                    <p className="text-xl lg:text-2xl font-medium opacity-90 leading-relaxed">
                        {t('leftDescription')}
                    </p>
                </div>
            </div>

            {/* Right Side: Login Form */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-12 lg:p-20 relative">

                {/* Form Wrapper */}
                <div className="w-full max-w-md">
                    {/* Logo Section */}
                    <div className="flex flex-col items-center mb-12">
                        <div className="mb-6">
                            <Image
                                src="/images/Logo.png"
                                alt="Logo"
                                width={160}
                                height={80}
                                className="object-contain"
                                priority
                            />
                        </div>
                        <h2 className="text-3xl font-extrabold text-[#0571B6] mb-2">
                            {t('signIn')}
                        </h2>
                        <p className="text-gray-500 text-sm">
                            {t('signInSubtitle')}
                        </p>
                    </div>

                    {/* Form Fields */}
                    <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 block">
                                {t('emailLabel')}
                            </label>
                            <div className="relative group">
                                <input
                                    type="email"
                                    placeholder={t('emailPlaceholder')}
                                    className="w-full px-5 py-4 rounded-xl border border-gray-200 outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-50 transition-all text-gray-800 placeholder:text-gray-400"
                                />
                                <div className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-teal-500 transition-colors">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 block">
                                {t('passwordLabel')}
                            </label>
                            <div className="relative group">
                                <input
                                    type="password"
                                    placeholder={t('passwordPlaceholder')}
                                    className="w-full px-5 py-4 rounded-xl border border-gray-200 outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-50 transition-all text-gray-800 font-mono tracking-widest placeholder:text-gray-400"
                                />
                                <div className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-teal-500 transition-colors">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-[#00B09C] hover:bg-[#009a8a] text-white py-4 rounded-full font-bold text-lg shadow-lg shadow-teal-100 transform active:scale-[0.98] transition-all duration-200"
                        >
                            {t('loginButton')}
                        </button>
                    </form>
                </div>

                {/* Bottom Bar: Language and Footer */}
                <div className="mt-auto pt-12 flex flex-col items-center gap-4">
                    <div className="scale-110">
                        <LanguageSelector />
                    </div>
                    <p className="text-gray-400 text-xs font-medium">
                        {t('footerText')}
                    </p>
                </div>
            </div>
        </div>
    );
}
