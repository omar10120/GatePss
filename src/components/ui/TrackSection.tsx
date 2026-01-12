'use client'
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useTranslations } from 'next-intl';

export default function TrackSection() {
    const t = useTranslations('HomePage');
    const locale = useLocale();
    return (
        <section id="info" className="py-20 px-4 bg-white">
            <div className="container mx-auto">
                <div className='flex flex-col p-8 md:p-16 lg:p-24 mx-auto rounded-3xl justify-center items-center gap-6 bg-gradient-to-r from-[#0571B6] to-[#003658] text-center'>
                    <h1 className='text-4xl md:text-6xl lg:text-4xl text-white font-bold leading-tight'>{t('services.GetFast')}</h1>
                    <p className='text-lg md:text-xl text-white opacity-90'>{t('services.GetFastDescription')}</p>
                    <Link
                        href={`/${locale}/ApplicationNumber`}
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
    )
}

