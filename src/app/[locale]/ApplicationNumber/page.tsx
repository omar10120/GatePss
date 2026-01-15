'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';

import HowtWork from '@/components/ui/HowtWork';

type DisplayStatus = 'PENDING' | 'APPROVED' | 'SO_APPROVED' | 'SO_REJECTED' | null;

export default function TrackApplication() {
    const t = useTranslations('HomePage');
    const locale = useLocale();
    const [requestNumber, setRequestNumber] = useState('');
    const [displayStatus, setDisplayStatus] = useState<DisplayStatus>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCheckStatus = async () => {
        if (!requestNumber.trim()) {
            setError('Please enter a request number');
            return;
        }

        setLoading(true);
        setError(null);
        setDisplayStatus(null);

        try {
            const response = await fetch(`/api/requests/check?requestNumber=${encodeURIComponent(requestNumber.trim())}`);
            const data = await response.json();

            if (!response.ok) {
                setError(data.message || 'Failed to check request status');
                return;
            }

            if (data.success && data.data) {
                setDisplayStatus(data.data.displayStatus as DisplayStatus);
            } else {
                setError('Failed to retrieve request status');
            }
        } catch (err) {
            console.error('Error checking status:', err);
            setError('An error occurred while checking the status');
        } finally {
            setLoading(false);
        }
    };

    const renderStatusMessage = () => {
        if (!displayStatus) return null;

        // PENDING or APPROVED (not yet So-Approved) -> First image
        if (displayStatus === 'PENDING' || displayStatus === 'APPROVED') {
            return (
                <div className="max-w-md mx-auto mt-8 p-8 bg-gray-50 rounded-xl shadow-lg">
                    <div className="flex justify-center mb-4">
                        <svg className="w-16 h-16 text-[#14b8a6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-[#1e40af] mb-2">
                        The Request Application Currently
                    </h3>
                    <p className="text-lg text-[#1e40af]">
                        Under Review By <span className="text-[#14b8a6]">SOHAR</span> System
                    </p>
                </div>
            );
        }

        // SO_REJECTED -> Second image
        if (displayStatus === 'SO_REJECTED') {
            return (
                <div className="max-w-md mx-auto mt-8 p-8 bg-pink-50 rounded-xl shadow-lg">
                    <div className="flex justify-center mb-4">
                        <svg className="w-16 h-16 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-4">
                        The Request Application Was Rejected
                    </h3>
                    <p className="text-sm text-gray-700">
                        The system informed you of the reason for the rejection via your Email, Please check it.
                    </p>
                </div>
            );
        }

        // SO_APPROVED -> Third image
        if (displayStatus === 'SO_APPROVED') {
            return (
                <div className="max-w-md mx-auto mt-8 p-8 bg-green-50 rounded-xl shadow-lg">
                    <div className="flex justify-center mb-4">
                        <svg className="w-16 h-16 text-[#14b8a6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-4">
                        The Request Application Was Accepted
                    </h3>
                    <p className="text-sm text-gray-600">
                        The system informed you with the Application Acception via your Email, Please check it.
                    </p>
                </div>
            );
        }

        return null;
    };

    return (
        <div className="min-h-screen bg-white">

            {/* ApplicationNumber Section */}
            <section className="py-20 px-4 bg-white">
                <div className="container mx-auto max-w-4xl text-center">
                    <h1 className="text-4xl md:text-5xl font-bold text-[#0571B6] mb-4">
                        {t('trackApplication.title')}
                    </h1>
                    <p className="text-gray-500 mb-12">
                        {t('trackApplication.subtitle')}
                    </p>

                    <div className="max-w-xl mx-auto mb-16">
                        <div className="text-start mb-2">
                            <label className="text-sm font-semibold text-gray-700">
                                {t('trackApplication.inputLabel')}
                            </label>
                        </div>
                        <div className="relative mb-8">
                            <input
                                type="text"
                                value={requestNumber}
                                onChange={(e) => setRequestNumber(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleCheckStatus()}
                                placeholder={t('trackApplication.inputPlaceholder')}
                                className="w-full px-6 py-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#14b8a6] focus:border-transparent transition-all shadow-sm"
                            />
                        </div>
                        <button 
                            onClick={handleCheckStatus}
                            disabled={loading}
                            className="w-full md:w-auto px-12 py-4 bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-full font-bold text-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {loading ? 'Checking...' : t('trackApplication.checkStatus')}
                        </button>

                        {error && (
                            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-red-600 text-sm">{error}</p>
                            </div>
                        )}

                        {renderStatusMessage()}
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <HowtWork />

        </div>
    );
}
