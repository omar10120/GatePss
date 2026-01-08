'use client';

import { useTranslations } from 'next-intl';

type Status = 'accepted' | 'rejected' | 'review';

interface StatusCardProps {
    status: Status;
}

export default function StatusCard({ status }: StatusCardProps) {
    const t = useTranslations('HomePage.permitStatus');

    const statusConfig = {
        accepted: {
            bg: 'bg-[#E3FBF1',
            iconColor: 'bg-success-50',
            title: t('acceptedTitle'),
            description: t('acceptedDescription'),
            icon: (
                <div className="w-16 h-16 bg-[#14b8a6] rounded-full flex items-center justify-center text-white shadow-lg shadow-teal-100">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
            )
        },
        rejected: {
            bg: 'bg-red-100', // Light red
            iconColor: 'bg-red-500',
            title: t('rejectedTitle'),
            description: t('rejectedDescription'),
            icon: (
                <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-red-100">
                    <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                    </svg>
                </div>
            )
        },
        review: {
            bg: 'bg-primary-50', // Near white
            iconColor: 'text-[#14b8a6]',
            title: t('reviewTitle'),
            description: '',
            icon: (
                <div className="text-[#14b8a6] animate-spin-slow">
                    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </div>
            )
        }
    };

    const config = statusConfig[status];

    // Workaround to bold SOHAR in the review title if it's the review status
    const renderTitle = () => {
        if (status === 'review') {
            const parts = config.title.split('SOHAR');
            if (parts.length > 1) {
                return (
                    <>
                        {parts[0]}
                        <span className="text-[#14b8a6] font-extrabold mx-1">SOHAR</span>
                        {parts[1]}
                    </>
                );
            }
        }
        return config.title;
    };

    return (
        <div className={`w-full max-w-5xl mx-auto rounded-3xl p-16 md:p-24 text-center ${config.bg} border-2 border-white/50 backdrop-blur-sm shadow-xl`}>
            <div className={`flex justify-center mb-10`}>
                {config.icon}
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#1e3a5f] mb-6 px-4 leading-tight">
                {renderTitle()}
            </h1>
            {config.description && (
                <p className="text-gray-600 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed px-4 opacity-80">
                    {config.description}
                </p>
            )}
        </div>
    );
}
