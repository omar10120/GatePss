'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
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
    const [showModal, setShowModal] = useState(false);
    const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [formData, setFormData] = useState({
        question_en: '',
        question_ar: '',
        answer_en: '',
        answer_ar: '',
    });

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
        setShowModal(true);
    };

    const handleEdit = (faq: FAQ) => {
        setEditingFAQ(faq);
        setFormData({
            question_en: faq.question_en,
            question_ar: faq.question_ar,
            answer_en: faq.answer_en,
            answer_ar: faq.answer_ar,
        });
        setShowModal(true);
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

            setShowModal(false);
            setSuccessMessage(editingFAQ ? t('updatedSuccessfully') : t('createdSuccessfully'));
            setShowSuccessModal(true);
            fetchFAQs();
        } catch (error: any) {
            alert(error.message || 'Failed to save FAQ');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm(t('confirmDelete'))) return;

        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const response = await fetch(`/api/admin/faq/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to delete FAQ');
            }

            setSuccessMessage(t('deletedSuccessfully'));
            setShowSuccessModal(true);
            fetchFAQs();
        } catch (error) {
            console.error('Error deleting FAQ:', error);
            alert('Failed to delete FAQ');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <>
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900">{t('title')}</h3>
                    <button
                        onClick={handleAddNew}
                        className="px-6 py-2 bg-[#00B09C] text-white rounded-lg font-medium hover:bg-[#008f7e] transition-colors"
                    >
                        {t('addNew')}
                    </button>
                </div>

                <div className="space-y-4">
                    {faqs.map((faq) => (
                        <div key={faq.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    <h4 className="text-lg font-semibold text-gray-900 mb-2">{faq.question_en}</h4>
                                    <p className="text-sm text-gray-600 mb-2">{faq.question_ar}</p>
                                    <p className="text-sm text-gray-700">{faq.answer_en}</p>
                                    <p className="text-sm text-gray-700 mt-2">{faq.answer_ar}</p>
                                </div>
                                <div className="flex gap-2 ml-4">
                                    <button
                                        onClick={() => handleEdit(faq)}
                                        className="text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        <Image
                                            src="/images/svg/Edit 2.svg"
                                            alt="Edit"
                                            width={20}
                                            height={20}
                                        />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(faq.id)}
                                        className="text-red-400 hover:text-red-600 transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl max-w-2xl w-full p-8 relative max-h-[90vh] overflow-y-auto">
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <h3 className="text-2xl font-bold text-gray-900 mb-6">
                            {editingFAQ ? t('editFAQ') : t('addNew')}
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('questionEn')}
                                </label>
                                <input
                                    type="text"
                                    value={formData.question_en}
                                    onChange={(e) => setFormData({ ...formData, question_en: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#00B09C] focus:ring-2 focus:ring-[#00B09C]/20"
                                    placeholder={t('enterQuestionEn')}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('questionAr')}
                                </label>
                                <input
                                    type="text"
                                    value={formData.question_ar}
                                    onChange={(e) => setFormData({ ...formData, question_ar: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#00B09C] focus:ring-2 focus:ring-[#00B09C]/20"
                                    placeholder={t('enterQuestionAr')}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('answerEn')}
                                </label>
                                <textarea
                                    value={formData.answer_en}
                                    onChange={(e) => setFormData({ ...formData, answer_en: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#00B09C] focus:ring-2 focus:ring-[#00B09C]/20"
                                    rows={4}
                                    placeholder={t('enterAnswerEn')}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('answerAr')}
                                </label>
                                <textarea
                                    value={formData.answer_ar}
                                    onChange={(e) => setFormData({ ...formData, answer_ar: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#00B09C] focus:ring-2 focus:ring-[#00B09C]/20"
                                    rows={4}
                                    placeholder={t('enterAnswerAr')}
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleSave}
                            className="mt-6 w-full px-6 py-3 bg-[#00B09C] text-white rounded-xl font-bold text-lg hover:bg-[#008f7e] transition-colors"
                        >
                            {t('save')}
                        </button>
                    </div>
                </div>
            )}

            {showSuccessModal && (
                <SuccessModal
                    message={successMessage}
                    onClose={() => setShowSuccessModal(false)}
                />
            )}
        </>
    );
}

