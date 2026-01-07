'use client';
import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

export default function HomePage() {
    const t = useTranslations('HomePage');
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();

    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [activeFaq, setActiveFaq] = useState<number | null>(0);

    const toggleLocale = () => {
        const newLocale = locale === 'en' ? 'ar' : 'en';
        // Replace the locale part of the pathname
        const newPathname = pathname.replace(`/${locale}`, `/${newLocale}`);
        router.push(newPathname || `/${newLocale}`);
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="bg-white shadow-sm sticky top-0 z-50">
                <div className="container mx-auto px-4 lg:px-6">
                    <div className="flex items-center justify-between h-20">
                        {/* Logo */}
                        <div className="flex items-center gap-3">
                            <div className="relative w-14 h-14">
                                <Image src="/images/Logo.png" alt="Assistance" width={500} height={500} />
                            </div>
                        </div>

                        {/* Navigation */}
                        <nav className="hidden md:flex items-center gap-8">
                            <Link href={`/${locale}`} className="text-gray-700 hover:text-info-500 font-medium transition-colors">
                                {t('nav.home')}
                            </Link>
                            <Link href="#services" className="text-gray-700 hover:text-info-500 font-medium transition-colors">
                                {t('nav.services')}
                            </Link>
                            <Link href="#about" className="text-gray-700 hover:text-info-500 font-medium transition-colors">
                                {t('nav.about')}
                            </Link>
                            <Link href="#MAJIS" className="text-gray-700 hover:text-info-500 font-medium transition-colors">
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
                            <button
                                onClick={toggleLocale}
                                className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-info-500 transition-colors"
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
                            {t('hero.title')}
                        </h1>

                        {/* Subtitle */}
                        <p className="text-4xl md:text-5xl text-blue-100 mb-12 max-w-2xl mx-auto">
                            {t('hero.subtitle')}
                        </p>

                        {/* Category Buttons */}
                        {/* <div className="flex flex-wrap justify-center gap-4 mb-12">
                            {[
                                { key: 'visitors', label: t('categories.visitors') },
                                { key: 'contractors', label: t('categories.contractors') },
                                { key: 'vehicles', label: t('categories.vehicles') },
                                { key: 'employees', label: t('categories.employees') },
                            ].map((category) => (
                                <button
                                    key={category.key}
                                    onClick={() => setSelectedCategory(category.key)}
                                    className={`px-6 py-3 rounded-lg font-medium transition-all ${selectedCategory === category.key
                                        ? 'bg-white text-blue-900 shadow-lg scale-105'
                                        : 'bg-gray-800/70 text-white hover:bg-gray-700/70 backdrop-blur-sm'
                                        }`}
                                >
                                    {category.label}
                                </button>
                            ))}
                        </div> */}

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/track"
                                className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full  font-semibold text-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                {t('actions.trackApplication')}
                            </Link>

                            <Link
                                href={`/${locale}/gate-pass`}
                                className="inline-flex items-center justify-center gap-2 bg-info-500 hover:bg-green-600 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                {t('actions.requestPermit')}
                            </Link>


                        </div>
                        <div className="flex sm:flex-row justify-center pt-32 animate-slide-up">
                            <a href="#about" className="text-white/80 hover:text-white transition-colors duration-300">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-12 animate-bounce">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 5.25 7.5 7.5 7.5-7.5m-15 6 7.5 7.5 7.5-7.5" />
                                </svg>


                            </a>
                        </div>

                    </div>

                </div>
            </section>

            {/* Features Section */}
            <section id="services" className="py-20 px-4 bg-white">
                <div className="container mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold text-center mb-4" style={{ color: '#1e3a5f' }}>
                        {t('howItWorks.title')}
                    </h2>
                    <p className="text-center text-gray-700 mb-16 max-w-2xl mx-auto text-lg">
                        {t('howItWorks.subtitle')}
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
                                title: t('howItWorks.step1.title'),
                                desc: t('howItWorks.step1.description'),
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
                                title: t('howItWorks.step2.title'),
                                desc: t('howItWorks.step2.description'),
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
                                title: t('howItWorks.step3.title'),
                                desc: t('howItWorks.step3.description'),
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
                                    {t(`howItWorks.step${index + 1}.title`)}
                                </h3>
                                <p className="text-gray-700 leading-relaxed text-sm">
                                    {t(`howItWorks.step${index + 1}.description`)}
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
                        {t('services.title')}
                    </h2>

                    <p className="text-center text-gray-700 mb-16 max-w-2xl mx-auto text-lg">
                        {t('services.subtitle')}
                    </p>
                    {/* CTA Button */}
                    <div className="text-center py-6">
                        <Link
                            href="/gate-pass"
                            className="inline-flex items-center justify-center gap-2 text-white px-12 py-4 rounded-full font-bold text-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                            style={{ backgroundColor: '#14b8a6' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0d9488'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#14b8a6'}
                        >
                            {t('actions.requestPermit')}
                        </Link>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-12">
                        {[
                            {
                                key: 'seawater',
                                title: t('services.seawater'),
                                describtion: t('services.seawaterDescription'),
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
                                title: t('services.cooling'),
                                describtion: t('services.cooling'),
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
                                title: t('services.potable'),
                                describtion: t('services.potableDescription'),
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
                                title: t('services.irrigation'),
                                describtion: t('services.irrigationDescription'),
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
                                title: t('services.process1'),
                                describtion: t('services.process1Description'),
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
                                title: t('services.process2'),
                                describtion: t('services.process1Description'),
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
                        ].map(({ key, title, icon, describtion }) => (
                            <div
                                key={key}
                                className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition-all flex flex-col items-center gap-4"
                            >
                                <div className="flex-shrink-0">
                                    {icon}
                                </div>
                                <h4 className="font-semibold text-gray-800 text-base flex-1">
                                    {title}
                                </h4>
                                <p className="text-gray-600 text-sm flex-1">
                                    {describtion}
                                </p>
                            </div>
                        ))}
                    </div>


                </div>
            </section>
            <section id="info" className="py-20 px-4 bg-white">
                <div className="container mx-auto">
                    <div className='flex flex-col p-8 md:p-16 lg:p-24 mx-auto rounded-3xl justify-center items-center gap-6 bg-gradient-to-r from-[#0571B6] to-[#003658] text-center'>
                        <h1 className='text-4xl md:text-6xl lg:text-7xl text-white font-bold leading-tight'>{t('services.GetFast')}</h1>
                        <p className='text-lg md:text-xl text-white opacity-90'>{t('services.GetFastDescription')}</p>
                        <Link
                            href="/gate-pass"
                            className="inline-flex items-center justify-center gap-2 text-white px-12 py-4 rounded-full font-bold text-xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 "
                            style={{ backgroundColor: '#14b8a6' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0d9488'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#14b8a6'}
                        >
                            {t('actions.trackApplication')}
                        </Link>
                    </div>
                </div>
            </section>


            <section id="request-permit" className="py-20 px-4 bg-white">
                <div className="container mx-auto">
                    <div className='flex flex-col p-8 md:p-16 lg:p-24 mx-auto rounded-3xl justify-center items-center gap-8 text-center'>
                        <h1 className='text-4xl md:text-6xl lg:text-7xl text-blue-900 font-bold leading-tight'>{t('services.GetFast')}</h1>
                        <p className='text-lg md:text-xl text-gray-600 max-w-2xl'>{t('services.GetFastDescription')}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 w-full max-w-7xl mx-auto mb-8">
                            {[
                                {
                                    key: 'seawater',
                                    title: t('services.seawater'),
                                    describtion: t('services.seawaterDescription'),
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
                                    title: t('services.cooling'),
                                    describtion: t('services.cooling'),
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
                                    title: t('services.potable'),
                                    describtion: t('services.potableDescription'),
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
                                    title: t('services.irrigation'),
                                    describtion: t('services.irrigationDescription'),
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
                                    title: t('services.process1'),
                                    describtion: t('services.process1Description'),
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
                                    title: t('services.process2'),
                                    describtion: t('services.process1Description'),
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
                            ].map(({ key, title, icon, describtion }) => (
                                <div
                                    key={key}
                                    className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition-all flex flex-col items-center gap-4"
                                >
                                    <div className="flex-shrink-0">
                                        {icon}
                                    </div>
                                    <h4 className="font-semibold text-gray-800 text-base flex-1">
                                        {title}
                                    </h4>
                                    <p className="text-gray-600 text-sm flex-1">
                                        {describtion}
                                    </p>
                                </div>
                            ))}

                        </div>
                        <Link
                            href="/gate-pass"
                            className="inline-flex items-center justify-center gap-2 text-white px-12 py-4 rounded-full font-bold text-xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 "
                            style={{ backgroundColor: '#14b8a6' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0d9488'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#14b8a6'}
                        >
                            {t('actions.trackApplication')}
                        </Link>


                    </div>
                </div>
            </section>

            <section id="assistance" className="py-20 px-4 bg-white">
                <div className="container mx-auto max-w-7xl">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold text-blue-900 mb-4">
                            {t('assistance.title')}
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            {t('assistance.description')}
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-12 gap-12 items-start">
                        {/* FAQ Section */}
                        <div className="lg:col-span-7 space-y-4">
                            {[1, 2, 3, 4, 5, 6].map((num) => {
                                const index = num - 1;
                                const isActive = activeFaq === index;
                                return (
                                    <div
                                        key={index}
                                        className={`rounded-xl transition-all duration-300 overflow-hidden ${isActive ? 'bg-slate-900 shadow-lg' : 'bg-white border border-gray-100 hover:border-blue-200'
                                            }`}
                                    >
                                        <button
                                            onClick={() => setActiveFaq(isActive ? null : index)}
                                            className="w-full text-start px-6 py-6 flex items-center justify-between group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <span className={`text-2xl font-bold ${isActive ? 'text-blue-400' : 'text-blue-300 group-hover:text-blue-400'
                                                    }`}>
                                                    {num.toString().padStart(2, '0')}.
                                                </span>
                                                <span className={`text-lg font-bold ${isActive ? 'text-white' : 'text-gray-800'
                                                    }`}>
                                                    {t(`assistance.faqs.item${num}.q`)}
                                                </span>
                                            </div>
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isActive ? 'bg-blue-400 text-white' : 'bg-blue-100 text-blue-500 group-hover:bg-blue-200'
                                                }`}>
                                                <svg className={`w-5 h-5 transition-transform ${isActive ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </button>
                                        <div
                                            className={`transition-all duration-300 ease-in-out ${isActive ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                                                }`}
                                        >
                                            <div className="px-6 pb-6 pt-2 text-gray-300 leading-relaxed ps-[3.5rem]">
                                                {t(`assistance.faqs.item${num}.a`)}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Support Card */}
                        <div className="lg:col-span-5">
                            <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden p-8 text-center sticky top-24">
                                {/* Support Illustration */}
                                <div className="mb-8 relative hs-illustration bg-blue-50 rounded-2xl p-6">
                                    <Image src="/images/assistance.png" alt="Assistance" width={500} height={500} />
                                </div>

                                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                                    {t('assistance.getInTouch')}
                                </h3>
                                <p className="text-gray-600 mb-8 leading-relaxed">
                                    {t('assistance.supportDescription')}
                                </p>

                                <div className="space-y-4 mb-8">
                                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl group hover:bg-blue-50 transition-colors">
                                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <div className="text-start">
                                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{locale === 'ar' ? 'البريد الإلكتروني' : 'Email'}</p>
                                            <p className="font-bold text-gray-800">{t('assistance.supportEmail')}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl group hover:bg-blue-50 transition-colors">
                                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                        </div>
                                        <div className="text-start">
                                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{locale === 'ar' ? 'الهاتف' : 'Phone'}</p>
                                            <p className="font-bold text-gray-800 tracking-wider font-sans">{t('assistance.supportPhone')}</p>
                                        </div>
                                    </div>
                                </div>

                                <Link
                                    href="#contact"
                                    className="block w-full py-4 text-center font-bold text-teal-500 hover:text-teal-600 border-2 border-teal-50 rounded-2xl hover:border-teal-100 transition-all active:scale-95"
                                >
                                    {t('assistance.contactSupport')}
                                </Link>
                            </div>
                        </div>
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
                                className="flex items-center gap-2 text-gray-700 hover:text-info-500 transition-colors"
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
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                </svg>
                            </a>
                            {/* Instagram */}
                            <a href="#" className="w-10 h-10 rounded-full flex items-center justify-center transition-colors" style={{ backgroundColor: '#1e3a5f' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#152a47'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1e3a5f'} aria-label="Instagram">
                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                </svg>
                            </a>
                            {/* YouTube */}
                            <a href="#" className="w-10 h-10 rounded-full flex items-center justify-center transition-colors" style={{ backgroundColor: '#1e3a5f' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#152a47'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1e3a5f'} aria-label="YouTube">
                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
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
                            {t('footer.technicalSupport')} <span style={{ color: '#14b8a6' }}>Pixel Tech</span>.©2025 {t('footer.allRightsReserved')}
                        </div>

                        {/* Right Side - Navigation Links */}
                        <div className="flex flex-wrap gap-6 text-sm text-gray-600">
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
        </div>
    );
}
