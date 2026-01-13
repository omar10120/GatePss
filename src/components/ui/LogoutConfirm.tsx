'use client';

import React from 'react';
import { useTranslations } from 'next-intl';

interface LogoutConfirmProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export const LogoutConfirm: React.FC<LogoutConfirmProps> = ({ isOpen, onClose, onConfirm }) => {
    const t = useTranslations('Admin.dashboard.logoutConfirm');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl animate-slide-up">
                <div className="flex flex-col items-center text-center">
                    {/* Icon Container */}
                    <div className="w-24 h-24 bg-[#E6F7F5] rounded-full flex items-center justify-center mb-6">
                        <img
                            src="/images/svg/Vector.svg"
                            alt="Logout Icon"
                            className="w-12 h-12"
                        />
                    </div>

                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        {t('title')}
                    </h3>

                    <p className="text-[#8E8E93] mb-8 font-medium">
                        {t('message')}
                    </p>

                    <div className="flex flex-col gap-3 w-full">
                        <button
                            onClick={onConfirm}
                            className="bg-[#00B09C] text-white py-4 rounded-full font-bold text-lg hover:bg-[#009686] transition-all transform active:scale-[0.98] shadow-lg shadow-[#00B09C]/20"
                        >
                            {t('confirm')}
                        </button>

                        <button
                            onClick={onClose}
                            className="bg-transparent text-[#8E8E93] py-4 rounded-full font-bold text-lg hover:bg-gray-50 transition-all"
                        >
                            {t('cancel')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
