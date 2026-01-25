import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';
import RejectConfirmModal from '@/components/ui/RejectConfirmModal';

interface StatusUpdateProps {
    currentStatus: string;
    onUpdate: (status: 'APPROVED' | 'REJECTED' | 'PENDING', reason?: string) => Promise<void>;
    getStatusColor: (status: string) => string;
    onRejectSuccess?: () => void;
    onEdit?: () => void;
}

export const StatusUpdate = ({ currentStatus, onUpdate, getStatusColor, onRejectSuccess, onEdit }: StatusUpdateProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
    const [isMounted, setIsMounted] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const t = useTranslations('Admin.dashboard');

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
                buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + window.scrollY + 4,
                left: rect.left + window.scrollX,
            });
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const handleSelect = async (status: 'APPROVED' | 'REJECTED' | 'PENDING') => {
        // Prevent editing if status is already APPROVED
        if (currentStatus === 'APPROVED') {
            setIsOpen(false);
            return;
        }

        if (status === currentStatus) {
            setIsOpen(false);
            return;
        }

        setIsOpen(false);

        if (status === 'REJECTED') {
            setShowRejectModal(true);
            return;
        }

        // For APPROVED or PENDING, proceed directly
        setLoading(true);
        try {
            await onUpdate(status);
        } catch (error) {
            console.error("Failed to update status", error);
            alert("Failed to update status");
        } finally {
            setLoading(false);
        }
    };

    const handleRejectConfirm = async (reason: string) => {
        setShowRejectModal(false);
        setLoading(true);
        try {
            await onUpdate('REJECTED', reason);
            if (onRejectSuccess) {
                onRejectSuccess();
            }
        } catch (error) {
            console.error("Failed to reject request", error);
            alert("Failed to reject request");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = () => {
        setIsOpen(false);
        if (onEdit) {
            onEdit();
        }
    };

    const isApproved = currentStatus === 'APPROVED';

    const dropdownContent = isOpen && isMounted ? (
        <div
            ref={dropdownRef}
            className="fixed w-36 bg-white rounded-lg shadow-lg border border-blue-200 overflow-hidden z-[9999]"
            style={{
                top: `${dropdownPosition.top}px`,
                left: `${dropdownPosition.left}px`,
            }}
        >
            <div className="py-1">
                {!isApproved && ['APPROVED', 'REJECTED'].map((status) => (
                    <button
                        key={status}
                        onClick={() => handleSelect(status as any)}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 ${currentStatus === status ? 'bg-gray-50 font-medium' : ''}`}
                    >
                        <span className={`w-2 h-2 rounded-full ${status === 'APPROVED' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        <span className={status === 'APPROVED' ? 'text-green-600' : 'text-red-600'}>
                            {status === 'APPROVED' ? 'Accept' : 'Reject'}
                        </span>
                    </button>
                ))}
                {onEdit && (
                    <>
                        {!isApproved && <div className="border-t border-blue-200 my-1"></div>}
                        <button
                            onClick={handleEdit}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 text-blue-600"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                        </button>
                    </>
                )}
            </div>
        </div>
    ) : null;

    return (
        <>
            <div className="relative">
                <button
                    ref={buttonRef}
                    onClick={() => setIsOpen(!isOpen)}
                    disabled={loading}
                    className={`px-3 py-1 text-[12px] font-bold rounded-full ${getStatusColor(currentStatus)} flex items-center gap-1 transition-opacity ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80 cursor-pointer'}`}
                >
                    {t(`status.${currentStatus}`)}
                    <svg className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
            </div>
            {isMounted && isOpen && createPortal(dropdownContent, document.body)}
            <RejectConfirmModal
                isOpen={showRejectModal}
                onClose={() => setShowRejectModal(false)}
                onConfirm={handleRejectConfirm}
            />
        </>
    );
};
