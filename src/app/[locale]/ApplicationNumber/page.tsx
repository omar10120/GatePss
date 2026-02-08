'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import HowtWork from '@/components/ui/HowtWork';
import StatusCard from '@/components/ui/StatusCard';


type DisplayStatus = 'PENDING' | 'APPROVED' | 'SO_APPROVED' | 'SO_REJECTED' | 'REJECTED' | null;

export default function TrackApplication() {
    const t = useTranslations('HomePage');
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

    // Map displayStatus to StatusCard format
    const getStatusCardStatus = (): 'accepted' | 'rejected' | 'review' | null => {
        if (!displayStatus) return null;
        if (displayStatus === 'APPROVED') return 'accepted';
        if (displayStatus === 'REJECTED') return 'rejected';
        // PENDING or APPROVED (not yet So-Approved) -> review
        return 'review';
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
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <HowtWork />

            {/* Status Card Modal */}
            {(() => {
                const statusCardStatus = getStatusCardStatus();
                if (!statusCardStatus) return null;

                return (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-3xl max-w-5xl w-full p-8 md:p-16 relative">
                            {/* Close Button */}
                            <button
                                onClick={() => setDisplayStatus(null)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                            <StatusCard status={statusCardStatus} />
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
