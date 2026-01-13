'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import LanguageSelector from '@/components/ui/LanguageSelector';
import VerifyIdentity from '@/components/ui/VerifyIdentity';

export default function AdminLoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showOTPModal, setShowOTPModal] = useState(false);
    const [otpLoading, setOtpLoading] = useState(false);
    const [userEmail, setUserEmail] = useState('');
    const t = useTranslations('HomePage.login');
    const locale = useLocale();



    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const formData = new FormData(e.currentTarget);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            // Check if OTP is required
            if (data.data?.requiresOTP) {
                setUserEmail(data.data.email);
                setShowOTPModal(true);
                setError('');
                return;
            }

            // If no OTP required (shouldn't happen with new flow, but keep for backward compatibility)
            if (data.data?.token) {
                localStorage.setItem('token', data.data.token);
                localStorage.setItem('user', JSON.stringify(data.data.user));
                router.push('/admin/dashboard');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Invalid email or password');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (otp: string) => {
        setOtpLoading(true);
        setError('');

        try {
            const response = await fetch('/api/auth/verify-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: userEmail, otp }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'OTP verification failed');
            }

            // Store token in localStorage
            localStorage.setItem('token', data.data.token);
            localStorage.setItem('user', JSON.stringify(data.data.user));

            // Redirect to dashboard
            router.push('/admin/dashboard');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Invalid OTP code');
        } finally {
            setOtpLoading(false);
        }
    };

    const handleResendOTP = async () => {
        setOtpLoading(true);
        setError('');

        try {
            const response = await fetch('/api/auth/send-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: userEmail }),
            });

            const data = await response.json();
            console.log(response);
            if (!response.ok) {
                throw new Error(data.message || 'Failed to resend OTP');
            }

            setError('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to resend OTP');
        } finally {
            setOtpLoading(false);
        }
    };

    const handleCloseOTPModal = () => {
        setShowOTPModal(false);
        setUserEmail('');
        setError('');
    };

    return (
        <div className="min-h-screen flex" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
            {/* Left Section - Gradient Background */}
            <div
                className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center px-12 text-white"
                style={{
                    background: 'linear-gradient(to bottom, #14b8a6, #0ea5e9)',
                }}
            >
                {/* Icon */}
                <div className="mb-12">
                    <Image
                        src="/images/svg/Pipe_light.svg"
                        alt="Logo"
                        width={80}
                        height={80}
                        className="object-contain"
                        priority
                    />
                </div>

                {/* Main Text */}

                <h2 className="text-4xl font-bold mb-8 text-center">
                    {t('leftTitle')}

                </h2>

                {/* Description */}
                <p className="text-xl text-center max-w-md leading-relaxed">
                    {t('leftDescription')}
                </p>
            </div>

            {/* Right Section - Login Form */}
            <div className="w-full lg:w-1/2 bg-white flex flex-col items-center justify-center px-8 py-12">
                <div className="w-full max-w-md">
                    {/* Logo */}
                    <div className="flex items-center justify-center gap-3 mb-8">
                        <div className="relative w-16 h-16">

                            <Image
                                src="/images/Logo.png"
                                alt="Logo"
                                width={160}
                                height={80}
                                className="object-contain"
                                priority
                            />
                        </div>

                    </div>

                    {/* Title */}
                    <h2 className="text-3xl font-bold mb-2 text-center" style={{ color: '#1e3a5f' }}>
                        {t('signIn')}
                    </h2>

                    {/* Subtitle */}
                    <p className="text-gray-600 text-center mb-8">
                        {t('signInSubtitle')}

                    </p>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email Input */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                {t('emailLabel')}
                            </label>
                            <div className="relative">
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    required
                                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                    placeholder={t('emailPlaceholder')}
                                    autoComplete="email"
                                />
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Password Input */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                {t('passwordLabel')}
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    name="password"
                                    required
                                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                    placeholder={t('passwordPlaceholder')}
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0L3 12m3.59-3.59L12 12m-8.41 8.41L3 21m0 0l3.59-3.59M12 12l3.59 3.59M21 21l-3.59-3.59m0 0L21 12m-3.59 3.59L12 12" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Login Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 rounded-lg font-bold text-white transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ backgroundColor: '#14b8a6' }}
                            onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#0d9488')}
                            onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#14b8a6')}
                        >
                            {loading ? t('signingIn') : t('signIn')}
                        </button>
                    </form>

                    {/* Language Selector */}
                    <div className="mt-8 flex items-center justify-center gap-2">
                        <LanguageSelector />
                    </div>

                    {/* Copyright */}
                    <div className="mt-8 text-center text-sm text-gray-600">
                        {t('CopyRights')} <span style={{ color: '#14b8a6' }}>{t('Ctitle')}</span> {t('copyright')}
                    </div>

                </div>
            </div>

            {/* OTP Verification Modal */}
            {showOTPModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <VerifyIdentity
                        isLoading={otpLoading}
                        onVerify={handleVerifyOTP}
                        onResend={handleResendOTP}
                        onClose={handleCloseOTPModal}
                    />
                </div>
            )}
        </div>
    );
}

