'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function GatePassRequestPage() {
    const router = useRouter();
    const [locale, setLocale] = useState<'en' | 'ar'>('en');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const toggleLocale = () => {
        setLocale(prev => prev === 'en' ? 'ar' : 'en');
    };

    const t = {
        en: {
            title: 'Submit Gate Pass Request',
            subtitle: 'Fill out the form below to request access to Sohar Port',
            applicantName: 'Full Name',
            applicantEmail: 'Email Address',
            passportIdNumber: 'Passport/ID Number',
            passportIdImage: 'Passport/ID Image',
            purposeOfVisit: 'Purpose of Visit',
            dateOfVisit: 'Date of Visit',
            requestType: 'Request Type',
            submit: 'Submit Request',
            submitting: 'Submitting...',
            backToHome: 'Back to Home',
            types: {
                VISITOR: 'Visitor Pass',
                CONTRACTOR: 'Contractor Pass',
                EMPLOYEE: 'Employee Pass',
                VEHICLE: 'Vehicle Pass',
            },
            placeholders: {
                name: 'Enter your full name',
                email: 'your.email@example.com',
                passport: 'AB123456',
                purpose: 'Describe the purpose of your visit (minimum 10 characters)',
            },
            fileInfo: 'JPG, PNG, or PDF (max 5MB)',
            required: 'All fields are required',
        },
        ar: {
            title: 'تقديم طلب تصريح البوابة',
            subtitle: 'املأ النموذج أدناه لطلب الوصول إلى ميناء صحار',
            applicantName: 'الاسم الكامل',
            applicantEmail: 'عنوان البريد الإلكتروني',
            passportIdNumber: 'رقم جواز السفر/الهوية',
            passportIdImage: 'صورة جواز السفر/الهوية',
            purposeOfVisit: 'الغرض من الزيارة',
            dateOfVisit: 'تاريخ الزيارة',
            requestType: 'نوع الطلب',
            submit: 'تقديم الطلب',
            submitting: 'جاري التقديم...',
            backToHome: 'العودة للرئيسية',
            types: {
                VISITOR: 'تصريح زائر',
                CONTRACTOR: 'تصريح مقاول',
                EMPLOYEE: 'تصريح موظف',
                VEHICLE: 'تصريح مركبة',
            },
            placeholders: {
                name: 'أدخل اسمك الكامل',
                email: 'your.email@example.com',
                passport: 'AB123456',
                purpose: 'اشرح الغرض من زيارتك (10 أحرف على الأقل)',
            },
            fileInfo: 'JPG أو PNG أو PDF (بحد أقصى 5 ميجابايت)',
            required: 'جميع الحقول مطلوبة',
        },
    };

    const content = t[locale];

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        const formData = new FormData(e.currentTarget);

        try {
            const response = await fetch('/api/requests', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to submit request');
            }

            setSuccess(`Request submitted successfully! Request Number: ${data.data.requestNumber}`);
            (e.target as HTMLFormElement).reset();

            // Redirect to home after 3 seconds
            setTimeout(() => {
                router.push('/');
            }, 3000);
        } catch (err: any) {
            setError(err.message || 'An error occurred while submitting your request');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
            {/* Header */}
            <header className="bg-white shadow-sm">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                                <span className="text-white text-xl font-bold">M</span>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">Majis Industrial Services</h1>
                                <p className="text-sm text-gray-600">{content.title}</p>
                            </div>
                        </div>
                        <button
                            onClick={toggleLocale}
                            className="btn btn-secondary text-sm"
                        >
                            {locale === 'en' ? 'العربية' : 'English'}
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-3xl mx-auto">
                    <div className="mb-6">
                        <Link href="/" className="text-info-500 hover:text-primary-700 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            {content.backToHome}
                        </Link>
                    </div>

                    <div className="card">
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">{content.title}</h2>
                        <p className="text-gray-600 mb-8">{content.subtitle}</p>

                        {error && (
                            <div className="mb-6 p-4 bg-danger-50 border border-danger-200 rounded-lg text-danger-700">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="mb-6 p-4 bg-success-50 border border-success-200 rounded-lg text-success-700">
                                {success}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Full Name */}
                            <div>
                                <label htmlFor="applicantName" className="block text-sm font-medium text-gray-700 mb-2">
                                    {content.applicantName} *
                                </label>
                                <input
                                    type="text"
                                    id="applicantName"
                                    name="applicantName"
                                    required
                                    className="input"
                                    placeholder={content.placeholders.name}
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label htmlFor="applicantEmail" className="block text-sm font-medium text-gray-700 mb-2">
                                    {content.applicantEmail} *
                                </label>
                                <input
                                    type="email"
                                    id="applicantEmail"
                                    name="applicantEmail"
                                    required
                                    className="input"
                                    placeholder={content.placeholders.email}
                                />
                            </div>

                            {/* Passport/ID Number */}
                            <div>
                                <label htmlFor="passportIdNumber" className="block text-sm font-medium text-gray-700 mb-2">
                                    {content.passportIdNumber} *
                                </label>
                                <input
                                    type="text"
                                    id="passportIdNumber"
                                    name="passportIdNumber"
                                    required
                                    minLength={6}
                                    maxLength={20}
                                    className="input"
                                    placeholder={content.placeholders.passport}
                                />
                            </div>

                            {/* Passport/ID Image */}
                            <div>
                                <label htmlFor="passportIdImage" className="block text-sm font-medium text-gray-700 mb-2">
                                    {content.passportIdImage} *
                                </label>
                                <input
                                    type="file"
                                    id="passportIdImage"
                                    name="passportIdImage"
                                    required
                                    accept=".jpg,.jpeg,.png,.pdf"
                                    className="input"
                                />
                                <p className="mt-1 text-sm text-gray-500">{content.fileInfo}</p>
                            </div>

                            {/* Request Type */}
                            <div>
                                <label htmlFor="requestType" className="block text-sm font-medium text-gray-700 mb-2">
                                    {content.requestType} *
                                </label>
                                <select
                                    id="requestType"
                                    name="requestType"
                                    required
                                    className="input"
                                >
                                    <option value="">Select a type</option>
                                    <option value="VISITOR">{content.types.VISITOR}</option>
                                    <option value="CONTRACTOR">{content.types.CONTRACTOR}</option>
                                    <option value="EMPLOYEE">{content.types.EMPLOYEE}</option>
                                    <option value="VEHICLE">{content.types.VEHICLE}</option>
                                </select>
                            </div>

                            {/* Date of Visit */}
                            <div>
                                <label htmlFor="dateOfVisit" className="block text-sm font-medium text-gray-700 mb-2">
                                    {content.dateOfVisit} *
                                </label>
                                <input
                                    type="date"
                                    id="dateOfVisit"
                                    name="dateOfVisit"
                                    required
                                    min={new Date().toISOString().split('T')[0]}
                                    className="input"
                                />
                            </div>

                            {/* Purpose of Visit */}
                            <div>
                                <label htmlFor="purposeOfVisit" className="block text-sm font-medium text-gray-700 mb-2">
                                    {content.purposeOfVisit} *
                                </label>
                                <textarea
                                    id="purposeOfVisit"
                                    name="purposeOfVisit"
                                    required
                                    minLength={10}
                                    rows={4}
                                    className="input"
                                    placeholder={content.placeholders.purpose}
                                />
                            </div>

                            {/* Submit Button */}
                            <div className="flex gap-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn btn-primary flex-1"
                                >
                                    {loading ? content.submitting : content.submit}
                                </button>
                            </div>

                            <p className="text-sm text-gray-500 text-center">
                                {content.required}
                            </p>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );

}
