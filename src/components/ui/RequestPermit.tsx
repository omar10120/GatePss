'use client'
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useTranslations } from 'next-intl';

export default function RequestPermit() {
    const t = useTranslations('HomePage');
    const locale = useLocale();
    return (
        <section id="request-permit" className="py-20 px-4 bg-white">
            <div className="container mx-auto">
                <div className='flex flex-col p-8 md:p-16 lg:p-24 mx-auto rounded-3xl justify-center items-center gap-6 md:gap-8 text-center'>
                    <h1 className='text-3xl md:text-4xl lg:text-5xl font-medium leading-tight capitalize' style={{ color: '#0666A3' }}>{t('services.title')}</h1>
                    <p className='text-lg md:text-xl lg:text-2xl max-w-2xl mx-auto' style={{ color: '#1F1F1F' }}>{t('services.subtitle')}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 w-full max-w-7xl mx-auto mb-8">
                        {[
                            {
                                key: 'seawater',
                                title: t('services.seawater'),
                                describtion: t('services.seawaterDescription'),
                                icon: (
                                    <svg className="w-12 h-12 opacity-70 " fill="none" stroke="#14b8a6" viewBox="0 0 24 24" strokeWidth={1.5}>
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
                                    <svg className="w-12 h-12 opacity-70" fill="none" stroke="#14b8a6" viewBox="0 0 24 24" strokeWidth={1.5}>
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
                                    <svg className="w-12 h-12 opacity-70" fill="none" stroke="#14b8a6" viewBox="0 0 24 24" strokeWidth={1.5}>
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
                                    <svg className="w-12 h-12 opacity-70" fill="none" stroke="#14b8a6" viewBox="0 0 24 24" strokeWidth={1.5}>
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
                                    <svg className="w-12 h-12 opacity-70" fill="none" stroke="#14b8a6" viewBox="0 0 24 24" strokeWidth={1.5}>
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
                                    <svg className="w-12 h-12 opacity-70" fill="none" stroke="#14b8a6" viewBox="0 0 24 24" strokeWidth={1.5}>
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
                                className="bg-white rounded-full px-4 md:px-6 py-2 md:py-3 border hover:shadow-md transition-all flex items-center gap-3 md:gap-4"
                                style={{ borderColor: '#00B09C', borderWidth: '0.5px' }}
                            >
                                <div className="flex-shrink-0">
                                    {icon}
                                </div>
                                <h4 className="font-normal text-sm md:text-base md:text-lg flex-1" style={{ color: '#4C4C4C' }}>
                                    {title}
                                </h4>
                            </div>
                        ))}

                    </div>
                    <Link
                        href={`/${locale}/RequestPermit`}
                        className="inline-flex items-center justify-center gap-2 text-white px-8 md:px-12 py-3 md:py-4 rounded-full font-medium text-lg md:text-xl lg:text-2xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        style={{ backgroundColor: '#00B09C' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0d9488'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#00B09C'}
                    >
                        {t('actions.requestPermit')}
                    </Link>


                </div>
            </div>
        </section>

    )
}

