'use client'
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

interface FAQ {
    id: number;
    question_en: string;
    question_ar: string;
    answer_en: string;
    answer_ar: string;
    created_at: string;
}

export default function Assistance() {
    const t = useTranslations('HomePage');
    const locale = useLocale();
    const [faqs, setFaqs] = useState<FAQ[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFaq, setActiveFaq] = useState<number | null>(null);
    const [contactEmail, setContactEmail] = useState('');
    const [contactPhone, setContactPhone] = useState('');

    useEffect(() => {
        fetchFAQs();
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const [emailRes, phoneRes] = await Promise.all([
                fetch('/api/settings/contact_email'),
                fetch('/api/settings/contact_phone')
            ]);

            if (emailRes.ok) {
                const data = await emailRes.json();
                setContactEmail(data.value);
            }
            if (phoneRes.ok) {
                const data = await phoneRes.json();
                setContactPhone(data.value);
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        }
    };

    const fetchFAQs = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/faq');
            if (!response.ok) {
                throw new Error('Failed to fetch FAQs');
            }
            const result = await response.json();
            const fetchedFaqs = result.data || [];
            setFaqs(fetchedFaqs);
            // Set first FAQ as active if available
            if (fetchedFaqs.length > 0) {
                setActiveFaq(fetchedFaqs[0].id);
            }
        } catch (error) {
            console.error('Error fetching FAQs:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section id="assistance" className="py-20 px-4 bg-white">
            <div className="container mx-auto max-w-7xl">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-3xl font-bold text-blue-900 mb-4">
                        {t('assistance.title')}
                    </h2>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        {t('assistance.description')}
                    </p>
                </div>

                <div className="grid lg:grid-cols-12 gap-12 items-start">
                    {/* FAQ Section */}
                    <div className="lg:col-span-7 space-y-4">
                        {loading ? (
                            <div className="flex items-center justify-center h-64">
                                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                            </div>
                        ) : faqs.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-gray-500">{t('assistance.noFaqs') || 'No FAQs available at the moment.'}</p>
                            </div>
                        ) : (
                            faqs.map((faq, index) => {
                                const isActive = activeFaq === faq.id;
                                const number = (index + 1).toString().padStart(2, '0');
                                const question = locale === 'ar' ? faq.question_ar : faq.question_en;
                                const answer = locale === 'ar' ? faq.answer_ar : faq.answer_en;

                                return (
                                    <div
                                        key={faq.id}
                                        className={`rounded-xl transition-all duration-300 overflow-hidden ${isActive ? 'bg-slate-900 shadow-lg' : 'bg-white border border-gray-100 hover:border-blue-200'
                                            }`}
                                    >
                                        <button
                                            onClick={() => setActiveFaq(isActive ? null : faq.id)}
                                            className="w-full text-start px-6 py-6 flex items-center justify-between group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <span className={`text-2xl font-bold ${isActive ? 'text-blue-400' : 'text-blue-300 group-hover:text-blue-400'
                                                    }`}>
                                                    {number}.
                                                </span>
                                                <span className={`text-lg font-bold ${isActive ? 'text-white' : 'text-gray-800'
                                                    }`}>
                                                    {question}
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
                                                {answer}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Support Card */}
                    <div className="lg:col-span-5">
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden p-8 text-center sticky top-24">
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
                                        <p className="font-bold text-gray-800">{contactEmail || t('assistance.supportEmail')}</p>
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
                                        <p className="font-bold text-gray-800 tracking-wider font-sans">{contactPhone || t('assistance.supportPhone')}</p>
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
    )
}

