'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface FAQItem {
    id: string;
    question: string;
    answer: string;
}

export default function FAQAccordion() {
    const t = useTranslations('HomePage.assistance.faqs');
    const [openId, setOpenId] = useState<string | null>('item1');

    const faqItems: FAQItem[] = [
        { id: 'item1', question: t('item1.q'), answer: t('item1.a') },
        { id: 'item2', question: t('item2.q'), answer: t('item2.a') },
        { id: 'item3', question: t('item3.q'), answer: t('item3.a') },
        { id: 'item4', question: t('item4.q'), answer: t('item4.a') },
        { id: 'item5', question: t('item5.q'), answer: t('item5.a') },
        { id: 'item6', question: t('item6.q'), answer: t('item6.a') },
    ];

    const toggleItem = (id: string) => {
        setOpenId(openId === id ? null : id);
    };

    return (
        <div className="space-y-4 max-w-5xl mx-auto">
            {faqItems.map((item, index) => {
                const isOpen = openId === item.id;
                const number = (index + 1).toString().padStart(2, '0');

                return (
                    <div
                        key={item.id}
                        className={`rounded-xl transition-all duration-300 overflow-hidden ${isOpen ? 'bg-[#1e3a5f] text-white shadow-lg' : 'bg-white text-gray-900 border border-gray-100 hover:border-teal-200'
                            }`}
                    >
                        <button
                            onClick={() => toggleItem(item.id)}
                            className="w-full px-6 py-5 flex items-center justify-between text-start gap-4 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <span className={`text-xl font-bold font-mono ${isOpen ? 'text-teal-400' : 'text-teal-500/60'}`}>
                                    {number}.
                                </span>
                                <span className="text-lg font-bold">
                                    {item.question}
                                </span>
                            </div>

                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${isOpen ? 'bg-teal-400 text-[#1e3a5f] rotate-180' : 'bg-teal-100 text-teal-600'
                                }`}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </button>

                        <div
                            className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                                }`}
                        >
                            <div className="px-6 pb-6 pt-0 border-t border-white/10 mt-2">
                                <p className={`leading-relaxed ${isOpen ? 'text-gray-200' : 'text-gray-600'}`}>
                                    {item.answer}
                                </p>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
