'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';

interface SuccessModalProps {
    message: string;
    onClose: () => void;
}

export default function SuccessModal({ message, onClose }: SuccessModalProps) {
    const t = useTranslations('Admin.settings');
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-8 text-center">
                <div className="mb-6">
                    <Image
                        src="/images/svg/Illustration (1).svg"
                        alt="Success Illustration"
                        width={348}
                        height={348}
                        className="mx-auto"
                    />
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{message}</h3>
                
                <button
                    onClick={onClose}
                    className="btn bg-[#00B09C] text-white w-full rounded-xl py-3 font-bold text-lg hover:bg-[#008f7e] transition-colors"
                >
                    {t('done')}
                </button>
            </div>
        </div>
    );
}

