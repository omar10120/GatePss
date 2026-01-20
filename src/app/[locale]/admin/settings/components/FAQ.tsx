'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import SuccessModal from '@/components/ui/SuccessModal';

interface FAQ {
    id: number;
    question_en: string;
    question_ar: string;
    answer_en: string;
    answer_ar: string;
    created_at: string;
}

export default function FAQ() {
    const t = useTranslations('Admin.settings.faq');
    const [faqs, setFaqs] = useState<FAQ[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
    const [formData, setFormData] = useState({
        question_en: '',
        question_ar: '',
        answer_en: '',
        answer_ar: '',
    });

    const toggleExpand = (id: number) => {
        setExpandedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    useEffect(() => {
        fetchFAQs();
    }, []);

    const fetchFAQs = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        setLoading(true);
        try {
            const response = await fetch('/api/admin/faq', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch FAQs');
            }

            const result = await response.json();
            setFaqs(result.data);
        } catch (error) {
            console.error('Error fetching FAQs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddNew = () => {
        setEditingFAQ(null);
        setFormData({ question_en: '', question_ar: '', answer_en: '', answer_ar: '' });
        setShowForm(true);
    };

    const handleEdit = (faq: FAQ) => {
        setEditingFAQ(faq);
        setFormData({
            question_en: faq.question_en,
            question_ar: faq.question_ar,
            answer_en: faq.answer_en,
            answer_ar: faq.answer_ar,
        });
        setShowForm(true);
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingFAQ(null);
        setFormData({ question_en: '', question_ar: '', answer_en: '', answer_ar: '' });
    };

    const handleSave = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const url = editingFAQ
                ? `/api/admin/faq/${editingFAQ.id}`
                : '/api/admin/faq';
            const method = editingFAQ ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to save FAQ');
            }

            setShowForm(false);
            setEditingFAQ(null);
            setFormData({ question_en: '', question_ar: '', answer_en: '', answer_ar: '' });
            setSuccessMessage(editingFAQ ? t('updatedSuccessfully') : t('createdSuccessfully'));
            setShowSuccessModal(true);
            fetchFAQs();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to save FAQ';
            alert(errorMessage);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    // Show form as a page
    if (showForm) {
        return (
            <>
                <div>
                    {/* Back Button */}
                    <button
                        onClick={handleCancel}
                        className="mb-6 text-gray-600 hover:text-gray-900 flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        {t('back_to_faq')}
                    </button>

                    {/* Page Title */}
                    <h3 className="text-2xl font-bold text-gray-900 mb-8">
                        {editingFAQ ? t('editFAQ') : t('addQuestion')}
                    </h3>

                    {/* Form */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {/* Left Column */}
                        <div className="space-y-4">
                            {/* Question Title (Ar) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('questionTitleAr')}
                                </label>
                                <input
                                    type="text"
                                    value={formData.question_ar}
                                    onChange={(e) => setFormData({ ...formData, question_ar: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-[#00B09C] focus:ring-2 focus:ring-[#00B09C]/20 focus:outline-none"
                                    placeholder="Primary Title"
                                />
                            </div>

                            {/* Question Title (En) - Textarea (for Arabic answer) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('questionTitleEn')}
                                </label>
                                <textarea
                                    value={formData.answer_ar}
                                    onChange={(e) => setFormData({ ...formData, answer_ar: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-[#00B09C] focus:ring-2 focus:ring-[#00B09C]/20 focus:outline-none resize-none"
                                    rows={8}
                                    placeholder="Molestie scelerisque urna etiam scelerisque. Diam elit est pretium posuere. Ultricies pulvinar nisi pulvinar malesuada. Gravida felis vitae habitasse ut. Sed egestas est sodales amet velit nunc leo. Nunc risus aliquet sit consequat hendrerit aliquam ultricies nisl. Lacus et sagittis id mauris curabitur sed."
                                />
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-4">
                            {/* Question Title (En) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('questionTitleEn')}
                                </label>
                                <input
                                    type="text"
                                    value={formData.question_en}
                                    onChange={(e) => setFormData({ ...formData, question_en: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-[#00B09C] focus:ring-2 focus:ring-[#00B09C]/20 focus:outline-none"
                                    placeholder="Primary Title"
                                />
                            </div>

                            {/* Reply Title (En) - Textarea */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('replyTitleEn')}
                                </label>
                                <textarea
                                    value={formData.answer_en}
                                    onChange={(e) => setFormData({ ...formData, answer_en: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-[#00B09C] focus:ring-2 focus:ring-[#00B09C]/20 focus:outline-none resize-none"
                                    rows={8}
                                    placeholder="Molestie scelerisque urna etiam scelerisque. Diam elit est pretium posuere. Ultricies pulvinar nisi pulvinar malesuada. Gravida felis vitae habitasse ut. Sed egestas est sodales amet velit nunc leo. Nunc risus aliquet sit consequat hendrerit aliquam ultricies nisl. Lacus et sagittis id mauris curabitur sed."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="mt-8">
                        <button
                            onClick={handleSave}
                            className="w-full px-6 py-4 bg-[#00B09C] text-white rounded-xl font-bold text-lg hover:bg-[#008f7e] transition-colors"
                        >
                            {t('save')}
                        </button>
                    </div>
                </div>

                {showSuccessModal && (
                    <SuccessModal
                        message={successMessage}
                        onClose={() => setShowSuccessModal(false)}
                    />
                )}
            </>
        );
    }

    return (
        <>
            <div>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-900">{t('title')}</h3>
                    <button
                        onClick={handleAddNew}
                        className="px-6 py-2 bg-[#00B09C] text-white rounded-lg font-medium hover:bg-[#008f7e] transition-colors"
                    >
                        {t('addQuestion')}
                    </button>
                </div>

                <div className="space-y-4">
                    {faqs.map((faq, index) => {
                        const isExpanded = expandedIds.has(faq.id);
                        const faqNumber = String(index + 1).padStart(2, '0');
                        
                        return (
                            <div
                                key={faq.id}
                                className={`rounded-xl transition-all ${
                                    isExpanded ? 'bg-gray-100 p-6' : 'bg-white p-4'
                                }`}
                            >
                                <div className="flex items-start gap-4">
                                    {/* Blue Number Badge */}
                                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                                        <span className="text-white text-sm font-bold">{faqNumber}</span>
                                    </div>

                                    {/* Question and Answer */}
                                    <div className="flex-1">
                                        <h4 className="text-base font-medium text-gray-900 mb-2">
                                            {faq.question_en}
                                        </h4>
                                        {isExpanded && (
                                            <div className="mt-3 space-y-2">
                                                <p className="text-sm text-gray-600 leading-relaxed">
                                                    {faq.answer_en}
                                                </p>
                                                {faq.answer_ar && (
                                                    <p className="text-sm text-gray-600 leading-relaxed">
                                                        {faq.answer_ar}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Icons */}
                                    <div className="flex gap-2 flex-shrink-0">
                                        {/* Edit Icon - Green Circle */}
                                        <button
                                            onClick={() => handleEdit(faq)}
                                            className="w-8 h-8 bg-[#00B09C] rounded-full flex items-center justify-center hover:bg-[#008f7e] transition-colors"
                                        >
                                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                            </svg>
                                        </button>

                                        {/* Collapse/Expand Icon - Blue Circle */}
                                        <button
                                            onClick={() => toggleExpand(faq.id)}
                                            className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
                                        >
                                            <svg
                                                className={`w-4 h-4 text-white transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {showSuccessModal && (
                <SuccessModal
                    message={successMessage}
                    onClose={() => setShowSuccessModal(false)}
                />
            )}
        </>
    );
}

