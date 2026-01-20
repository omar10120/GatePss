'use client';

import { useState } from 'react';

interface FAQ {
    id: number;
    question_en: string;
    question_ar: string;
    answer_en: string;
    answer_ar: string;
    created_at: string;
}

interface FAQAccordionProps {
    faqs: FAQ[];
    locale: 'en' | 'ar';
}

export default function FAQAccordion({ faqs, locale }: FAQAccordionProps) {
    const [openId, setOpenId] = useState<number | null>(faqs.length > 0 ? faqs[0].id : null);

    const toggleItem = (id: number) => {
        setOpenId(openId === id ? null : id);
    };

    if (faqs.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">No FAQs available at the moment.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 max-w-5xl mx-auto">
            {faqs.map((faq, index) => {
                const isOpen = openId === faq.id;
                const number = (index + 1).toString().padStart(2, '0');
                const question = locale === 'ar' ? faq.question_ar : faq.question_en;
                const answer = locale === 'ar' ? faq.answer_ar : faq.answer_en;

                return (
                    <div
                        key={faq.id}
                        className={`rounded-xl transition-all duration-300 overflow-hidden ${isOpen ? 'bg-[#1e3a5f] text-white shadow-lg' : 'bg-white text-gray-900 border border-gray-100 hover:border-teal-200'
                            }`}
                    >
                        <button
                            onClick={() => toggleItem(faq.id)}
                            className="w-full px-6 py-5 flex items-center justify-between text-start gap-4 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <span className={`text-xl font-bold font-mono ${isOpen ? 'text-teal-400' : 'text-teal-500/60'}`}>
                                    {number}.
                                </span>
                                <span className="text-lg font-bold">
                                    {question}
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
                                    {answer}
                                </p>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
