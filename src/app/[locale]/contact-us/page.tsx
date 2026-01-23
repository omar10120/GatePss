'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';

interface PassType {
    id: number;
    name_en: string;
    name_ar: string;
    is_active: boolean;
}

interface FormData {
    fullName: string;
    email: string;
    passType: string;
    phoneNumber: string;
    message: string;
}

export default function ContactUsPage() {
    const t = useTranslations('HomePage.contactUs');
    const locale = useLocale();
    const [passTypes, setPassTypes] = useState<PassType[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [formData, setFormData] = useState<FormData>({
        fullName: '',
        email: '',
        passType: '',
        phoneNumber: '',
        message: '',
    });
    const [errors, setErrors] = useState<Partial<FormData>>({});

    useEffect(() => {
        fetchPassTypes();
    }, []);

    const fetchPassTypes = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/pass-types');
            if (response.ok) {
                const result = await response.json();
                setPassTypes(result.data || []);
            }
        } catch (error) {
            console.error('Error fetching pass types:', error);
        } finally {
            setLoading(false);
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Partial<FormData> = {};

        if (!formData.fullName.trim()) {
            newErrors.fullName = t('errors.fullNameRequired');
        }

        if (!formData.email.trim()) {
            newErrors.email = t('errors.emailRequired');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = t('errors.invalidEmail');
        }

        if (!formData.passType) {
            newErrors.passType = t('errors.passTypeRequired');
        }

        if (!formData.phoneNumber.trim()) {
            newErrors.phoneNumber = t('errors.phoneRequired');
        }

        if (!formData.message.trim()) {
            newErrors.message = t('errors.messageRequired');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setSubmitting(true);
        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                // Reset form
                setFormData({
                    fullName: '',
                    email: '',
                    passType: '',
                    phoneNumber: '',
                    message: '',
                });
                setErrors({});
                setShowSuccessModal(true);
            } else {
                alert(t('errorMessage') || 'Failed to send message. Please try again.');
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            alert(t('errorMessage') || 'Failed to send message. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleChange = (field: keyof FormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    return (
        <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
            <div className="container mx-auto max-w-5xl">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4" style={{ color: '#0666A3' }}>
                        {t('title')}
                    </h1>
                    <p className="text-lg md:text-xl text-gray-600">
                        {t('subtitle')}
                    </p>
                </div>

                {/* Contact Form */}
                <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 md:p-8 lg:p-10 border border-gray-200 shadow-sm">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                        {/* Left Column */}
                        <div className="space-y-6">
                            {/* Full Name */}
                            <div>
                                <label className="block text-gray-700 text-sm font-medium mb-2">
                                    {t('fields.fullName')}
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={formData.fullName}
                                        onChange={(e) => handleChange('fullName', e.target.value)}
                                        placeholder={t('placeholders.fullName')}
                                        className={`w-full px-4 py-3 pr-12 bg-white border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                            errors.fullName ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    />
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                </div>
                                {errors.fullName && (
                                    <p className="text-red-400 text-xs mt-1">{errors.fullName}</p>
                                )}
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-gray-700 text-sm font-medium mb-2">
                                    {t('fields.email')}
                                </label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => handleChange('email', e.target.value)}
                                        placeholder={t('placeholders.email')}
                                        className={`w-full px-4 py-3 pr-12 bg-white border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                            errors.email ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    />
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                </div>
                                {errors.email && (
                                    <p className="text-red-400 text-xs mt-1">{errors.email}</p>
                                )}
                            </div>

                            {/* Message */}
                            <div>
                                <label className="block text-gray-700 text-sm font-medium mb-2">
                                    {t('fields.message')}
                                </label>
                                <textarea
                                    value={formData.message}
                                    onChange={(e) => handleChange('message', e.target.value)}
                                    placeholder={t('placeholders.message')}
                                    rows={6}
                                    className={`w-full px-4 py-3 bg-white border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                                        errors.message ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                />
                                {errors.message && (
                                    <p className="text-red-400 text-xs mt-1">{errors.message}</p>
                                )}
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-6">
                            {/* Pass Type */}
                            <div>
                                <label className="block text-gray-700 text-sm font-medium mb-2">
                                    {t('fields.passType')}
                                </label>
                                <div className="relative">
                                    <select
                                        value={formData.passType}
                                        onChange={(e) => handleChange('passType', e.target.value)}
                                        className={`w-full px-4 py-3 pr-12 bg-white border rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none ${
                                            errors.passType ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        disabled={loading}
                                    >
                                        <option value="">{t('placeholders.selectPassType')}</option>
                                        {passTypes
                                            .filter(pt => pt.is_active)
                                            .map((pt) => (
                                                <option key={pt.id} value={pt.id}>
                                                    {locale === 'ar' ? pt.name_ar : pt.name_en}
                                                </option>
                                            ))}
                                    </select>
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                                {errors.passType && (
                                    <p className="text-red-400 text-xs mt-1">{errors.passType}</p>
                                )}
                            </div>

                            {/* Phone Number */}
                            <div>
                                <label className="block text-gray-700 text-sm font-medium mb-2">
                                    {t('fields.phoneNumber')}
                                </label>
                                <div className="relative">
                                    <input
                                        type="tel"
                                        value={formData.phoneNumber}
                                        onChange={(e) => handleChange('phoneNumber', e.target.value)}
                                        placeholder={t('placeholders.phoneNumber')}
                                        className={`w-full px-4 py-3 pr-12 bg-white border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                            errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    />
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                    </div>
                                </div>
                                {errors.phoneNumber && (
                                    <p className="text-red-400 text-xs mt-1">{errors.phoneNumber}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="mt-8 flex justify-center">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full md:w-auto px-12 py-4 bg-[#00B09C] hover:bg-[#0d9488] text-white font-semibold rounded-full text-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? t('submitting') : t('sendButton')}
                        </button>
                    </div>
                </form>
            </div>

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
                        {/* Close button */}
                        <button
                            onClick={() => setShowSuccessModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        {/* Success Image */}
                        <div className="flex justify-center mb-6">
                            <img
                                src="/images/contact.jpeg"
                                alt="Success"
                                className="w-64 h-64 object-contain"
                            />
                        </div>

                        {/* Success Message */}
                        <div className="text-center mb-6">
                            <h2 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: '#0666A3' }}>
                                {t('successTitle')}
                            </h2>
                            <p className="text-gray-600 text-sm">
                                {t('successMessage')}
                            </p>
                        </div>

                        {/* Done Button */}
                        <div className="flex justify-center">
                            <button
                                onClick={() => setShowSuccessModal(false)}
                                className="px-12 py-3 bg-[#00B09C] hover:bg-[#0d9488] text-white font-semibold rounded-full text-lg transition-all duration-300 transform hover:scale-105"
                            >
                                {t('done')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
