'use client';

import React from 'react';
import { useTranslations, useLocale } from 'next-intl';

interface TableFilterProps {
    onSearch: (value: string) => void;
    onDateChange: (value: string) => void;
    onStatusChange: (value: string) => void;
    onReset: () => void;
    searchPlaceholder?: string;
    currentFilters: {
        search: string;
        status: string;
        date?: string;
    };
    // New props for customization
    statusOptions?: Array<{ value: string; label: string }>;
    statusLabel?: string;
    hideDate?: boolean;
}

export const TableFilter: React.FC<TableFilterProps> = ({
    onSearch,
    onDateChange,
    onStatusChange,
    onReset,
    currentFilters,
    statusOptions,
    statusLabel,
    hideDate = false,
}) => {
    const t = useTranslations('Admin.requests');
    const locale = useLocale();
    const isRtl = locale === 'ar';

    // Default status options if not provided
    const defaultStatusOptions = [
        { value: "PENDING", label: "Pending" },
        { value: "APPROVED", label: "Approved" },
        { value: "REJECTED", label: "Rejected" },
    ];

    const optionsToRender = statusOptions || defaultStatusOptions;

    return (
        <div className="bg-white rounded-[12px] border border-gray-100 flex items-center h-[60px] overflow-hidden shadow-sm mb-6">
            {/* Filter Label */}
            <div className={`flex items-center gap-3 px-6 h-full bg-gray-50/50 min-w-max border-r border-gray-100 ${isRtl ? 'border-l border-r-0' : 'border-r'}`}>
                <svg className="w-5 h-5 text-gray-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                </svg>
                <span className="text-[#A1A1A1] text-[14px] font-medium whitespace-nowrap">{t('filterBy')}</span>
            </div>

            {/* Search Input */}
            <div className="flex-1 flex items-center px-6 h-full gap-3">
                <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input
                    type="text"
                    placeholder={t('searchPlaceholder')}
                    value={currentFilters.search}
                    onChange={(e) => onSearch(e.target.value)}
                    className="w-full bg-transparent border-none outline-none text-[#222222] text-[14px] font-medium placeholder:text-[#A1A1A1]"
                />
            </div>

            {/* Date Dropdown */}
            {!hideDate && (
                <div className={`flex items-center px-6 h-full border-l border-gray-100 min-w-[140px] ${isRtl ? 'border-r border-l-0' : 'border-l'}`}>
                    <select
                        value={currentFilters.date || ''}
                        onChange={(e) => onDateChange(e.target.value)}
                        className="bg-transparent border-none outline-none text-gray-900 text-[14px] font-bold appearance-none cursor-pointer w-full"
                    >
                        <option value="">{t('date')}</option>
                        <option value="today">Today</option>
                        <option value="yesterday">Yesterday</option>
                        <option value="this_week">This Week</option>
                        <option value="this_month">This Month</option>
                    </select>
                    <svg className="w-4 h-4 text-gray-900 ml-2 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 9l6 6 6-6"></path>
                    </svg>
                </div>
            )}

            {/* Status Dropdown */}
            <div className={`flex items-center px-6 h-full border-l border-gray-100 min-w-[140px] ${isRtl ? 'border-r border-l-0' : 'border-l'}`}>
                <select
                    value={currentFilters.status}
                    onChange={(e) => onStatusChange(e.target.value)}
                    className="bg-transparent border-none outline-none text-gray-900 text-[14px] font-bold appearance-none cursor-pointer w-full"
                >
                    <option value="">{statusLabel || t('status')}</option>
                    {optionsToRender.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                <svg className="w-4 h-4 text-gray-900 ml-2 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9l6 6 6-6"></path>
                </svg>
            </div>

            {/* Reset Button */}
            <button
                onClick={onReset}
                className={`flex items-center gap-2 px-6 h-full border-l border-gray-100 hover:bg-gray-50 transition-colors ${isRtl ? 'border-r border-l-0' : 'border-l'}`}
            >
                <svg className="w-5 h-5 text-danger-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 4v6h-6"></path>
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                </svg>
                <span className="text-danger-500 text-[14px] font-medium whitespace-nowrap">{t('resetFilter')}</span>
            </button>
        </div>
    );
};
