'use client';

import { useTranslations } from 'next-intl';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function TermsAndConditions() {
    const t = useTranslations('HomePage.legal');

    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            <main className="py-20 px-4">
                <div className="container mx-auto max-w-7xl">
                    <h1 className="text-4xl font-bold text-[#003658] mb-12">
                        {t('termsTitle')}
                    </h1>

                    <div className="prose prose-lg max-w-none text-gray-500 leading-relaxed space-y-8">
                        {t('lorem').split('\n\n').map((paragraph, index) => (
                            <p key={index}>{paragraph}</p>
                        ))}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
