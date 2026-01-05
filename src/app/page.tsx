'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function HomePage() {
    const [locale, setLocale] = useState<'en' | 'ar'>('en');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const toggleLocale = () => {
        setLocale(prev => prev === 'en' ? 'ar' : 'en');
        document.body.dir = locale === 'en' ? 'rtl' : 'ltr';
    };

    const t = {
        en: {
            nav: {
                home: 'Home',
                services: 'Services',
                about: 'About us',
                // majisWeb: 'MAJIS Web',
            },
            hero: {
                title: 'Get A Fast-Track Entry Permit',
                subtitle: 'Perfect for urgent travel needs or busy schedules',
            },
            categories: {
                visitors: 'Visitors',
                contractors: 'Contractors',
                vehicles: 'Vehicles',
                employees: 'Employees',
            },
            actions: {
                trackApplication: 'Track Application',
                requestPermit: 'Request a permit',
            },
            contact: 'Contact us',
        },
        ar: {
            nav: {
                home: 'الرئيسية',
                services: 'الخدمات',
                about: 'من نحن',
                // majisWeb: 'موقع ماجس',
            },
            hero: {
                title: 'احصل على تصريح دخول سريع',
                subtitle: 'مثالي للاحتياجات العاجلة للسفر أو الجداول المزدحمة',
            },
            categories: {
                visitors: 'زوار',
                contractors: 'مقاولون',
                vehicles: 'مركبات',
                employees: 'موظفون',
            },
            actions: {
                trackApplication: 'تتبع الطلب',
                requestPermit: 'طلب تصريح',
            },
            contact: 'اتصل بنا',
        },
    };

    const content = t[locale];

    return (
        <div className="min-h-screen bg-white" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
            {/* Header */}
            <header className="bg-white shadow-sm sticky top-0 z-50">
                <div className="container mx-auto px-4 lg:px-6">
                    <div className="flex items-center justify-between h-20">
                        {/* Logo */}
                        <div className="flex items-center gap-3">
                            <div className="relative w-14 h-14">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-blue-500 to-green-500 rounded-lg transform rotate-12"></div>
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-green-400 rounded-lg"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
                                    </svg>
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-600 font-medium mb-0.5">
                                    {locale === 'ar' ? 'محسس' : 'MAJIS'}
                                </div>
                                <div className="text-lg font-bold text-gray-900">
                                    {locale === 'ar' ? 'MAJIS' : 'MAJIS'}
                                </div>
                            </div>
                        </div>

                        {/* Navigation */}
                        <nav className="hidden md:flex items-center gap-8">
                            <Link href="/" className="text-gray-700 hover:text-primary-600 font-medium transition-colors">
                                {content.nav.home}
                            </Link>
                            <Link href="#services" className="text-gray-700 hover:text-primary-600 font-medium transition-colors">
                                {content.nav.services}
                            </Link>
                            <Link href="#about" className="text-gray-700 hover:text-primary-600 font-medium transition-colors">
                                {content.nav.about}
                            </Link>
                        </nav>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2 text-gray-700 hover:text-primary-600"
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
                            <button
                                onClick={toggleLocale}
                                className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-primary-600 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                                </svg>
                                <span className="text-sm font-medium">{locale === 'en' ? 'English' : 'العربية'}</span>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {/* Contact Button */}
                            <Link
                                href="#contact"
                                className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-5 py-2.5 rounded-full font-medium transition-colors shadow-md hover:shadow-lg"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                <span className="hidden sm:inline">{content.contact}</span>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden border-t border-gray-200 bg-white">
                        <nav className="container mx-auto px-4 py-4 flex flex-col gap-4">
                            <Link href="/" className="text-gray-700 hover:text-primary-600 font-medium transition-colors py-2">
                                {content.nav.home}
                            </Link>
                            <Link href="#services" className="text-gray-700 hover:text-primary-600 font-medium transition-colors py-2">
                                {content.nav.services}
                            </Link>
                            <Link href="#about" className="text-gray-700 hover:text-primary-600 font-medium transition-colors py-2">
                                {content.nav.about}
                            </Link>
                        </nav>
                    </div>
                )}
            </header>

            {/* Hero Section */}
            <section className="relative min-h-[600px] md:min-h-[700px] flex items-center justify-center overflow-hidden">
                {/* Background Image with Overlay */}
                <div className="absolute inset-0">
                    <div 
                        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                        style={{
                            backgroundImage: 'url(https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1920&q=80)',
                        }}
                    >
                        <div className="absolute inset-0 bg-blue-900/60"></div>
                            </div>
                        </div>

                {/* Content */}
                <div className="relative z-10 container mx-auto px-4 lg:px-6 text-center text-white">
                    <div className="max-w-4xl mx-auto">
                        {/* Main Title */}
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                            {content.hero.title}
                        </h1>

                        {/* Subtitle */}
                        <p className="text-lg md:text-xl text-blue-100 mb-12 max-w-2xl mx-auto">
                            {content.hero.subtitle}
                        </p>

                        {/* Category Buttons */}
                        <div className="flex flex-wrap justify-center gap-4 mb-12">
                            {[
                                { key: 'visitors', label: content.categories.visitors },
                                { key: 'contractors', label: content.categories.contractors },
                                { key: 'vehicles', label: content.categories.vehicles },
                                { key: 'employees', label: content.categories.employees },
                            ].map((category) => (
                                <button
                                    key={category.key}
                                    onClick={() => setSelectedCategory(category.key)}
                                    className={`px-6 py-3 rounded-lg font-medium transition-all ${
                                        selectedCategory === category.key
                                            ? 'bg-white text-blue-900 shadow-lg scale-105'
                                            : 'bg-gray-800/70 text-white hover:bg-gray-700/70 backdrop-blur-sm'
                                    }`}
                                >
                                    {category.label}
                                </button>
                            ))}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/track"
                                className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                {content.actions.trackApplication}
                            </Link>

                            <Link
                                href="/gate-pass"
                                className="inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                {content.actions.requestPermit}
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="services" className="py-20 px-4 bg-white">
                <div className="container mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold text-center mb-4" style={{ color: '#1e3a5f' }}>
                        {locale === 'en' ? 'How It Works' : 'كيف يعمل'}
                    </h2>
                    <p className="text-center text-gray-700 mb-16 max-w-2xl mx-auto text-lg">
                        {locale === 'en' 
                            ? 'To ensures a smooth process for your business needs'
                            : 'لضمان عملية سلسة لاحتياجات عملك'
                        }
                    </p>

                    <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                        {[
                            {
                                // Step 1: Clock with 24 in circular arrow
                                icon: (
                                    <svg className="w-20 h-20" fill="none" stroke="#14b8a6" viewBox="0 0 24 24" strokeWidth={1.5}>
                                        <circle cx="12" cy="12" r="9" strokeWidth={2} />
                                        <path d="M12 6v6l4 2" strokeWidth={2} strokeLinecap="round" />
                                        <circle cx="12" cy="12" r="6" fill="none" strokeWidth={1.5} strokeDasharray="2 2" />
                                        <text x="12" y="15" textAnchor="middle" fontSize="7" fill="#14b8a6" fontWeight="bold">24</text>
                                    </svg>
                                ),
                                title: locale === 'en' ? '1. Submit Application' : '١. تقديم الطلب',
                                desc: locale === 'en' 
                                    ? 'Fill out required details and upload documents'
                                    : 'املأ التفاصيل المطلوبة وقم بتحميل المستندات',
                            },
                            {
                                // Step 2: Hourglass with dollar sign in circle and coins
                                icon: (
                                    <svg className="w-20 h-20" fill="none" stroke="#14b8a6" viewBox="0 0 24 24" strokeWidth={1.5}>
                                        <path d="M8 4h8M8 4v4l-4 4 4 4v4M8 20h8M8 20v-4l4-4 4 4v4" strokeWidth={2} strokeLinecap="round" />
                                        <circle cx="12" cy="19" r="2.5" fill="#14b8a6" />
                                        <text x="12" y="20.5" textAnchor="middle" fontSize="7" fill="white" fontWeight="bold">$</text>
                                        <circle cx="16" cy="19" r="1.5" fill="#14b8a6" opacity="0.6" />
                                        <circle cx="18.5" cy="19" r="1.5" fill="#14b8a6" opacity="0.4" />
                                </svg>
                                ),
                                title: locale === 'en' ? '2. Review & Approval' : '٢. المراجعة والموافقة',
                                desc: locale === 'en'
                                    ? 'Majis team validates and processes your request'
                                    : 'يقوم فريق ماجس بالتحقق من طلبك ومعالجته',
                            },
                            {
                                // Step 3: Person silhouette in frame with open padlock
                                icon: (
                                    <svg className="w-20 h-20" fill="none" stroke="#14b8a6" viewBox="0 0 24 24" strokeWidth={1.5}>
                                        <rect x="6" y="4" width="12" height="16" rx="2" strokeWidth={2} />
                                        <circle cx="12" cy="8" r="2" strokeWidth={2} />
                                        <path d="M8 16v-2a4 4 0 0 1 8 0v2" strokeWidth={2} strokeLinecap="round" />
                                        <rect x="16" y="10" width="4" height="6" rx="1" strokeWidth={2} />
                                        <path d="M18 12v2" strokeWidth={2} strokeLinecap="round" />
                                        <circle cx="18" cy="11" r="0.5" fill="#14b8a6" />
                                </svg>
                                ),
                                title: locale === 'en' ? '3. Receive Digital Permit' : '٣. استلام التصريح الرقمي',
                                desc: locale === 'en'
                                    ? 'Approved applicants receive a QR-coded permit by email'
                                    : 'يحصل المتقدمون المعتمدون على تصريح برمز QR عبر البريد الإلكتروني',
                            },
                        ].map((feature, index) => (
                            <div 
                                key={index} 
                                className="text-center p-8 rounded-xl transition-all"
                                style={{ 
                                    backgroundColor: '#e6f7ff',
                                    border: 'none',
                                }}
                            >
                                <div className="flex items-center justify-center mx-auto mb-6">
                                    {feature.icon}
                            </div>
                                <h3 className="text-lg font-bold text-gray-800 mb-3">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-700 leading-relaxed text-sm">
                                    {feature.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Services Section */}
            <section id="services" className="py-20 px-4 bg-white">
                <div className="container mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold text-center mb-4" style={{ color: '#1e3a5f' }}>
                        {locale === 'en' ? 'You Can Request A Permit To Explore' : 'يمكنك طلب تصريح للاستكشاف'}
                    </h2>
                    <p className="text-center text-gray-700 mb-16 max-w-2xl mx-auto text-lg">
                        {locale === 'en'
                            ? 'Perfect for urgent travel needs or busy schedules'
                            : 'مثالي للاحتياجات العاجلة للسفر أو الجداول المزدحمة'
                        }
                    </p>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-12">
                        {[
                            {
                                key: 'seawater',
                                title: locale === 'en' ? 'Seawater Extraction' : 'استخراج مياه البحر',
                                icon: (
                                    <svg className="w-16 h-16" fill="none" stroke="#14b8a6" viewBox="0 0 24 24" strokeWidth={1.5}>
                                        {/* Sun with quarter section */}
                                        <circle cx="6" cy="6" r="3" strokeWidth={2} />
                                        <path d="M6 3v6M3 6h6" strokeWidth={1.5} />
                                        <path d="M6 6l-2-2" strokeWidth={1.5} />
                                        {/* Birds */}
                                        <path d="M4 4l1 1M8 4l-1 1" strokeWidth={1.5} strokeLinecap="round" />
                                        {/* Sailboat */}
                                        <path d="M8 14l-2 4h8l-2-4" strokeWidth={2} strokeLinecap="round" />
                                        <path d="M10 14v-4M10 10l2-2" strokeWidth={2} />
                                        {/* Water waves */}
                                        <path d="M4 18c2 0 4-1 6-1s4 1 6 1" strokeWidth={1.5} strokeLinecap="round" />
                                        <path d="M4 20c2 0 4-1 6-1s4 1 6 1" strokeWidth={1.5} strokeLinecap="round" />
                                    </svg>
                                ),
                            },
                            {
                                key: 'cooling',
                                title: locale === 'en' ? 'COOLING WATER' : 'مياه التبريد',
                                icon: (
                                    <svg className="w-16 h-16" fill="none" stroke="#14b8a6" viewBox="0 0 24 24" strokeWidth={1.5}>
                                        {/* Cooling tower structure */}
                                        <path d="M8 4h8M8 4v16M16 4v16" strokeWidth={2} />
                                        <path d="M6 20h12" strokeWidth={2} strokeLinecap="round" />
                                        <path d="M10 8h4M10 12h4M10 16h4" strokeWidth={1.5} />
                                        {/* Water droplets */}
                                        <circle cx="6" cy="20" r="1" fill="#14b8a6" />
                                        <circle cx="9" cy="20" r="0.8" fill="#14b8a6" />
                                        <circle cx="12" cy="20" r="1" fill="#14b8a6" />
                                        <circle cx="15" cy="20" r="0.8" fill="#14b8a6" />
                                        <circle cx="18" cy="20" r="1" fill="#14b8a6" />
                                        {/* Wavy lines */}
                                        <path d="M4 20c1 0 2-0.5 3-0.5s2 0.5 3 0.5" strokeWidth={1} strokeLinecap="round" />
                                    </svg>
                                ),
                            },
                            {
                                key: 'potable',
                                title: locale === 'en' ? 'POTABLE WATER' : 'المياه الصالحة للشرب',
                                icon: (
                                    <svg className="w-16 h-16" fill="none" stroke="#14b8a6" viewBox="0 0 24 24" strokeWidth={1.5}>
                                        {/* House structure */}
                                        <path d="M6 12h12v6H6z" strokeWidth={2} />
                                        <path d="M6 12l6-6 6 6" strokeWidth={2} strokeLinecap="round" />
                                        <path d="M10 12v4M14 12v4" strokeWidth={1.5} />
                                        {/* Chimney */}
                                        <path d="M16 8v2" strokeWidth={1.5} />
                                        {/* Faucet */}
                                        <path d="M12 18v2" strokeWidth={2} />
                                        <path d="M10 20h4" strokeWidth={2} strokeLinecap="round" />
                                        {/* Dripping water */}
                                        <circle cx="11" cy="22" r="0.8" fill="#14b8a6" />
                                        <circle cx="12" cy="23" r="1" fill="#14b8a6" />
                                        <circle cx="13" cy="22" r="0.8" fill="#14b8a6" />
                                        {/* Water droplets around */}
                                        <circle cx="8" cy="20" r="0.5" fill="#14b8a6" />
                                        <circle cx="16" cy="20" r="0.5" fill="#14b8a6" />
                                        <circle cx="9" cy="22" r="0.5" fill="#14b8a6" />
                                        <circle cx="15" cy="22" r="0.5" fill="#14b8a6" />
                                    </svg>
                                ),
                            },
                            {
                                key: 'irrigation',
                                title: locale === 'en' ? 'IRRIGATION WATER' : 'مياه الري',
                                icon: (
                                    <svg className="w-16 h-16" fill="none" stroke="#14b8a6" viewBox="0 0 24 24" strokeWidth={1.5}>
                                        {/* Sprinkler head */}
                                        <circle cx="12" cy="8" r="2" strokeWidth={2} />
                                        <path d="M12 6v4" strokeWidth={2} />
                                        {/* Water arc */}
                                        <path d="M8 10c2-2 4-1 6 0" strokeWidth={2} strokeLinecap="round" />
                                        <path d="M10 12c1-1 2-0.5 3 0" strokeWidth={1.5} strokeLinecap="round" />
                                        <path d="M14 12c-1-1-2-0.5-3 0" strokeWidth={1.5} strokeLinecap="round" />
                                        <path d="M16 10c-2-2-4-1-6 0" strokeWidth={2} strokeLinecap="round" />
                                        {/* Plants/flowers */}
                                        <circle cx="8" cy="16" r="1.5" fill="#14b8a6" opacity="0.6" />
                                        <circle cx="12" cy="17" r="1.5" fill="#14b8a6" opacity="0.6" />
                                        <circle cx="16" cy="16" r="1.5" fill="#14b8a6" opacity="0.6" />
                                        <path d="M8 16v2M12 17v2M16 16v2" strokeWidth={1.5} strokeLinecap="round" />
                                        {/* Signal/WiFi icon above */}
                                        <path d="M10 4c1 0 2 1 2 2M14 4c-1 0-2 1-2 2" strokeWidth={1.5} strokeLinecap="round" />
                                    </svg>
                                ),
                            },
                            {
                                key: 'process1',
                                title: locale === 'en' ? 'PROCESS WATER' : 'مياه المعالجة',
                                icon: (
                                    <svg className="w-16 h-16" fill="none" stroke="#14b8a6" viewBox="0 0 24 24" strokeWidth={1.5}>
                                        {/* Pipe/conduit */}
                                        <path d="M6 8h12" strokeWidth={2} strokeLinecap="round" />
                                        <path d="M6 8v8h12V8" strokeWidth={2} />
                                        {/* Water stream */}
                                        <path d="M8 16v4" strokeWidth={2} strokeLinecap="round" />
                                        <path d="M10 18v2" strokeWidth={1.5} strokeLinecap="round" />
                                        <path d="M12 16v4" strokeWidth={2} strokeLinecap="round" />
                                        <path d="M14 18v2" strokeWidth={1.5} strokeLinecap="round" />
                                        <path d="M16 16v4" strokeWidth={2} strokeLinecap="round" />
                                        {/* Wavy water body */}
                                        <path d="M4 20c2 0 4-1 6-1s4 1 6 1s4-1 6-1" strokeWidth={1.5} strokeLinecap="round" />
                                        <path d="M4 22c2 0 4-1 6-1s4 1 6 1s4-1 6-1" strokeWidth={1.5} strokeLinecap="round" />
                                    </svg>
                                ),
                            },
                            {
                                key: 'process2',
                                title: locale === 'en' ? 'PROCESS WATER' : 'مياه المعالجة',
                                icon: (
                                    <svg className="w-16 h-16" fill="none" stroke="#14b8a6" viewBox="0 0 24 24" strokeWidth={1.5}>
                                        {/* Interconnected pipes */}
                                        <path d="M6 6h12v12H6z" strokeWidth={2} />
                                        <path d="M6 10h12M6 14h12" strokeWidth={1.5} />
                                        {/* Vertical connections */}
                                        <path d="M10 4v2M14 4v2M10 18v2M14 18v2" strokeWidth={1.5} strokeLinecap="round" />
                                        {/* Valve/wheel */}
                                        <circle cx="12" cy="12" r="2" strokeWidth={2} />
                                        <path d="M12 10v4M10 12h4" strokeWidth={1.5} />
                                        {/* Filter/processing unit */}
                                        <rect x="8" y="8" width="8" height="8" strokeWidth={1.5} rx="1" />
                                        <path d="M10 10h4M10 12h4M10 14h4" strokeWidth={1} />
                                    </svg>
                                ),
                            },
                        ].map(({ key, title, icon }) => (
                            <div 
                                key={key} 
                                className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition-all flex items-center gap-4"
                            >
                                <div className="flex-shrink-0">
                                    {icon}
                                </div>
                                <h4 className="font-semibold text-gray-800 text-base flex-1">
                                    {title}
                                </h4>
                            </div>
                        ))}
                    </div>

                    {/* CTA Button */}
                    <div className="text-center">
                        <Link
                            href="/gate-pass"
                            className="inline-flex items-center justify-center gap-2 text-white px-12 py-4 rounded-full font-bold text-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                            style={{ backgroundColor: '#14b8a6' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0d9488'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#14b8a6'}
                        >
                            {locale === 'en' ? 'Request a permit' : 'طلب تصريح'}
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer id="about" className="bg-gray-50 py-8 px-4">
                <div className="container mx-auto">
                    {/* Upper Section */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
                        {/* Left Side - Language Selector */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={toggleLocale}
                                className="flex items-center gap-2 text-gray-700 hover:text-primary-600 transition-colors"
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

                        {/* Right Side - Social Media Icons */}
                        <div className="flex items-center gap-3">
                            {/* Facebook */}
                            <a href="#" className="w-10 h-10 rounded-full flex items-center justify-center transition-colors" style={{ backgroundColor: '#1e3a5f' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#152a47'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1e3a5f'} aria-label="Facebook">
                                <span className="text-white font-bold text-sm">f</span>
                            </a>
                            {/* X (Twitter) */}
                            <a href="#" className="w-10 h-10 rounded-full flex items-center justify-center transition-colors" style={{ backgroundColor: '#1e3a5f' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#152a47'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1e3a5f'} aria-label="X (Twitter)">
                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                </svg>
                            </a>
                            {/* Instagram */}
                            <a href="#" className="w-10 h-10 rounded-full flex items-center justify-center transition-colors" style={{ backgroundColor: '#1e3a5f' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#152a47'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1e3a5f'} aria-label="Instagram">
                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                                </svg>
                            </a>
                            {/* YouTube */}
                            <a href="#" className="w-10 h-10 rounded-full flex items-center justify-center transition-colors" style={{ backgroundColor: '#1e3a5f' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#152a47'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1e3a5f'} aria-label="YouTube">
                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                                </svg>
                            </a>
                            {/* LinkedIn */}
                            <a href="#" className="w-10 h-10 rounded-full flex items-center justify-center transition-colors" style={{ backgroundColor: '#1e3a5f' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#152a47'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1e3a5f'} aria-label="LinkedIn">
                                <span className="text-white font-bold text-xs">in</span>
                            </a>
                        </div>
                    </div>

                    {/* Divider Line */}
                    <div className="border-t border-gray-300 my-6"></div>

                    {/* Lower Section */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        {/* Left Side - Copyright */}
                        <div className="text-sm text-gray-600">
                            {locale === 'en' ? (
                                <>
                                    Technical Support <span style={{ color: '#14b8a6' }}>Pixel Tech</span>.©2025 All right reserved
                                </>
                            ) : (
                                <>
                                    الدعم الفني <span style={{ color: '#14b8a6' }}>بيكسل تك</span>.©2025 جميع الحقوق محفوظة
                                </>
                            )}
                        </div>

                        {/* Right Side - Navigation Links */}
                        <div className="flex flex-wrap gap-6 text-sm text-gray-600">
                            <Link href="#faq" className="hover:text-gray-900 transition-colors">
                                {locale === 'en' ? 'FAQ' : 'الأسئلة الشائعة'}
                            </Link>
                            <Link href="#privacy" className="hover:text-gray-900 transition-colors">
                                {locale === 'en' ? 'Policy Privacy' : 'سياسة الخصوصية'}
                            </Link>
                            <Link href="#terms" className="hover:text-gray-900 transition-colors">
                                {locale === 'en' ? 'Terms & Conditions' : 'الشروط والأحكام'}
                            </Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
