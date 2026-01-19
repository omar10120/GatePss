'use client';

import Image from 'next/image';

interface RejectSuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    message?: string;
}

export default function RejectSuccessModal({ isOpen, onClose, message = 'The Order Was Successfully Cancelled' }: RejectSuccessModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000] p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center shadow-xl">
                {/* Illustration using Group 2.svg */}
                <div className="w-full max-w-[351px] mx-auto mb-6">
                    <Image
                        src="/images/svg/Group 2.svg"
                        alt="Rejection Success"
                        width={351}
                        height={218}
                        className="w-full h-auto"
                    />
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-6">{message}</h3>
                
                <button
                    onClick={onClose}
                    className="w-full bg-[#00B09C] text-white py-4 rounded-xl font-bold hover:bg-[#008f7e] transition-colors"
                >
                    Done
                </button>
            </div>
        </div>
    );
}

