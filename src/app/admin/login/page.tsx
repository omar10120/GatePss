'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
    const router = useRouter();
    const [locale, setLocale] = useState<'en' | 'ar'>('en');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const toggleLocale = () => {
        setLocale(prev => prev === 'en' ? 'ar' : 'en');
    };

    const t = {
        en: {
            title: 'Sign In',
            subtitle: 'Please login to continue to your account',
            email: 'Email',
            password: 'Password',
            signIn: 'Login',
            signingIn: 'Signing in...',
            emailPlaceholder: 'Enter Your Email',
            passwordPlaceholder: 'Enter your password',
            leadership: 'Leadership-Focused',
            administrative: 'Administrative',
            description: 'expert with a knack for problem-solving and team coordination',
        },
        ar: {
            title: 'تسجيل الدخول',
            subtitle: 'يرجى تسجيل الدخول للمتابعة إلى حسابك',
            email: 'البريد الإلكتروني',
            password: 'كلمة المرور',
            signIn: 'تسجيل الدخول',
            signingIn: 'جاري تسجيل الدخول...',
            emailPlaceholder: 'أدخل بريدك الإلكتروني',
            passwordPlaceholder: 'أدخل كلمة المرور',
            leadership: 'القيادة',
            administrative: 'الإدارية',
            description: 'خبير مع موهبة في حل المشكلات وتنسيق الفريق',
        },
    };

    const content = t[locale];

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

            // Store token in localStorage
            localStorage.setItem('token', data.data.token);
            localStorage.setItem('user', JSON.stringify(data.data.user));

            // Redirect to dashboard
            router.push('/admin/dashboard');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Invalid email or password');
        } finally {
            setLoading(false);
        }
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
                    <svg className="w-24 h-24" fill="none" stroke="white" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <circle cx="12" cy="12" r="10" strokeWidth={2} />
                        <path d="M12 2v20M2 12h20" strokeWidth={2} />
                        <path d="M12 2l8 8-8 8-8-8z" strokeWidth={1.5} strokeLinecap="round" />
                    </svg>
                </div>

                {/* Main Text */}
                <h1 className="text-5xl font-bold mb-4 text-center">
                    {content.leadership}
                </h1>
                <h2 className="text-5xl font-bold mb-8 text-center">
                    {content.administrative}
                </h2>

                {/* Description */}
                <p className="text-xl text-center max-w-md leading-relaxed">
                    {content.description}
                </p>
            </div>

            {/* Right Section - Login Form */}
            <div className="w-full lg:w-1/2 bg-white flex flex-col items-center justify-center px-8 py-12">
                <div className="w-full max-w-md">
                    {/* Logo */}
                    <div className="flex items-center justify-center gap-3 mb-8">
                        <div className="relative w-16 h-16">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-blue-500 to-green-500 rounded-lg transform rotate-12"></div>
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-green-400 rounded-lg flex items-center justify-center">
                                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
                                </svg>
                            </div>
                        </div>
                        <div>
                            <div className="text-sm font-medium" style={{ color: '#1e3a5f' }}>
                                {locale === 'ar' ? 'مجيس' : 'مجيس'}
                            </div>
                            <div className="text-xl font-bold" style={{ color: '#1e3a5f' }}>
                                MAJIS
                            </div>
                        </div>
                    </div>

                    {/* Title */}
                    <h2 className="text-3xl font-bold mb-2 text-center" style={{ color: '#1e3a5f' }}>
                        {content.title}
                    </h2>

                    {/* Subtitle */}
                    <p className="text-gray-600 text-center mb-8">
                        {content.subtitle}
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
                                {content.email}
                            </label>
                            <div className="relative">
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    required
                                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                    placeholder={content.emailPlaceholder}
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
                                {content.password}
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    name="password"
                                    required
                                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                    placeholder={content.passwordPlaceholder}
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
                            {loading ? content.signingIn : content.signIn}
                        </button>
                    </form>

                    {/* Language Selector */}
                    <div className="mt-8 flex items-center justify-center gap-2">
                        <button
                            onClick={toggleLocale}
                            className="flex items-center gap-2 text-gray-700 hover:text-teal-600 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                            </svg>
                            <span className="text-sm font-medium">{locale === 'en' ? 'English' : 'العربية'}</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                    </div>

                    {/* Copyright */}
                    <div className="mt-8 text-center text-sm text-gray-600">
                        {locale === 'en' ? (
                            <>
                                Design with <span style={{ color: '#14b8a6' }}>Pixel Tech</span>.©2025 All right reserved
                            </>
                        ) : (
                            <>
                                تصميم بواسطة <span style={{ color: '#14b8a6' }}>بيكسل تك</span>.©2025 جميع الحقوق محفوظة
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
