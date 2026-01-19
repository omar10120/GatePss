import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';

interface StatusUpdateProps {
    currentStatus: string;
    onUpdate: (status: 'APPROVED' | 'REJECTED' | 'PENDING', reason?: string) => Promise<void>;
    getStatusColor: (status: string) => string;
}

export const StatusUpdate = ({ currentStatus, onUpdate, getStatusColor }: StatusUpdateProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const t = useTranslations('Admin.dashboard');

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
        if (status === currentStatus) {
            setIsOpen(false);
            return;
        }

        let reason = '';
        if (status === 'REJECTED') {
            const result = window.prompt("Please enter a reason for rejection (required):");
            if (result === null) {
                setIsOpen(false);
                return; // Cancelled
            }
            if (!result.trim()) {
                alert("Rejection reason is required.");
                return;
            }
            reason = result;
        }

        if (confirm(`Are you sure you want to change status to ${status}?`)) {
            setLoading(true);
            try {
                await onUpdate(status, reason);
            } catch (error) {
                console.error("Failed to update status", error);
                alert("Failed to update status");
            } finally {
                setLoading(false);
                setIsOpen(false);
            }
        } else {
            setIsOpen(false);
        }
    };

    const dropdownContent = isOpen ? (
        <div
            ref={dropdownRef}
            className="fixed w-36 bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden z-[9999]"
            style={{
                top: `${dropdownPosition.top}px`,
                left: `${dropdownPosition.left}px`,
            }}
        >
            <div className="py-1">
                {['APPROVED', 'REJECTED', 'PENDING'].map((status) => (
                    <button
                        key={status}
                        onClick={() => handleSelect(status as any)}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 ${currentStatus === status ? 'bg-gray-50 font-medium' : ''}`}
                    >
                        <span className={`w-2 h-2 rounded-full ${status === 'APPROVED' ? 'bg-green-500' :
                                status === 'REJECTED' ? 'bg-red-500' :
                                    'bg-yellow-500'
                            }`}></span>
                        {t(`status.${status}`)}
                    </button>
                ))}
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
                    className={`px-3 py-1 text-[12px] font-bold rounded-full ${getStatusColor(currentStatus)} flex items-center gap-1 transition-opacity ${loading ? 'opacity-50 cursor-wait' : 'hover:opacity-80'}`}
                >
                    {t(`status.${currentStatus}`)}
                    <svg className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
            </div>
            {typeof window !== 'undefined' && isOpen && createPortal(dropdownContent, document.body)}
        </>
    );
};
