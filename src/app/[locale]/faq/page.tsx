'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import FAQAccordion from '@/components/ui/FAQAccordion';

interface FAQ {
    id: number;
    question_en: string;
    question_ar: string;
    answer_en: string;
    answer_ar: string;
    created_at: string;
}

export default function FAQPage() {
    const t = useTranslations('HomePage.faqPage');
    const locale = useLocale();
    const [faqs, setFaqs] = useState<FAQ[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFAQs();
    }, []);

    const fetchFAQs = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/faq');
            if (!response.ok) {
                throw new Error('Failed to fetch FAQs');
            }
            const result = await response.json();
            setFaqs(result.data || []);
        } catch (error) {
            console.error('Error fetching FAQs:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white">
            <main className="py-20 px-4">
                <div className="container mx-auto">
                    {/* Header Section */}
                    <div className="text-center mb-16">
                        <div className="flex justify-center mb-6">
                            <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center text-teal-500">
                                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                                </svg>
                            </div>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-[#1e3a5f] mb-4">
                            {t('title')}
                        </h1>
                        <p className="text-xl text-gray-500 max-w-2xl mx-auto">
                            {t('subtitle')}
                        </p>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <FAQAccordion faqs={faqs} locale={locale as 'en' | 'ar'} />
                    )}
                </div>
            </main>
        </div>
    );
}
