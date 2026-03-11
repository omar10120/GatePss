import { useTranslations } from 'next-intl';
import React from 'react';

interface RequestHeaderProps {
    requestNumber: string;
    onSync?: () => void;
    isSyncing?: boolean;
}

export const RequestHeader: React.FC<RequestHeaderProps> = ({ requestNumber, onSync, isSyncing }) => {
    const t = useTranslations('Admin.requests');
    const ct = useTranslations('Admin.common');
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h1 className="text-[24px] md:text-[28px] font-bold text-[#3E4259] font-['Rubik']">
                {t('title')} <span className="text-[#00B09C]">{requestNumber}</span>
            </h1>
            
            {onSync && (
                <button
                    onClick={onSync}
                    disabled={isSyncing}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-[#00B09C] rounded-[8px] text-[#00B09C] text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-all shadow-sm"
                >
                    <svg 
                        className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {isSyncing ? 'Syncing...' : 'Sync Status from Sohar'}
                </button>
            )}
        </div>
    );
};
