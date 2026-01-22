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
                <div className='flex flex-col p-8 md:p-16 lg:p-24 mx-auto rounded-xl justify-center items-center gap-4 md:gap-6 bg-gradient-to-b from-[#0571B6] to-[#003658] text-center'>
                    <h1 className='text-3xl md:text-4xl lg:text-5xl text-white font-medium leading-tight capitalize'>{t('services.GetFast')}</h1>
                    <p className='text-lg md:text-xl lg:text-2xl text-white opacity-90 max-w-2xl mx-auto'>{t('services.GetFastDescription')}</p>
                    <Link
                        href={`/${locale}/ApplicationNumber`}
                        className="inline-flex items-center justify-center gap-2 text-white px-8 md:px-12 py-3 md:py-4 rounded-full font-medium text-lg md:text-xl lg:text-2xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        style={{ backgroundColor: '#00B09C' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0d9488'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#00B09C'}
                    >
                        {t('actions.trackApplication')}
                    </Link>
                </div>
            </div>
        </section>
    )
}

