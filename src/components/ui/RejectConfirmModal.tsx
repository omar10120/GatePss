'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface RejectConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => void;
}

export default function RejectConfirmModal({ isOpen, onClose, onConfirm }: RejectConfirmModalProps) {
    const [rejectionReason, setRejectionReason] = useState('');
    const t = useTranslations('Admin.requestDetails');

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (!rejectionReason.trim()) {
            alert(t('rejectReasonPlaceholder'));
            return;
        }
        if (rejectionReason.trim().length < 10) {
            alert('Rejection reason must be at least 10 characters');
            return;
        }
        onConfirm(rejectionReason.trim());
        setRejectionReason('');
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000] p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
                <h3 className="text-xl font-bold text-[#3B82F6] mb-4">
                    Are You Sure You Want To Reject This Request?
                </h3>
                
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rejection Reason
                    </label>
                    <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="type your rejection reason"
                        rows={4}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 resize-none"
                        minLength={10}
                    />
                </div>

                <button
                    onClick={handleConfirm}
                    className="w-full bg-[#E91A1A] text-white py-3 rounded-xl font-bold hover:bg-[#C81A1A] transition-colors"
                >
                    Yes, Reject It
                </button>
            </div>
        </div>
    );
}

