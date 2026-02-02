'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/config/navigation';

interface Request {
    id: number;
    requestNumber: string;
    applicantName?: string;
    applicantNameEn?: string;
    applicantNameAr?: string;
    applicantEmail?: string;
    status: string;
    requestType: string;
    createdAt: string;
    email?: string;
}

interface LatestRequestsProps {
    requests: Request[] | undefined;
    user?: any;
}

export const LatestRequests: React.FC<LatestRequestsProps> = ({ requests, user }) => {
    const t = useTranslations('Admin.dashboard');
    const [filter, setFilter] = useState<'Day' | 'Week' | 'Month' | 'Custom'>('Day');
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [customStartDate, setCustomStartDate] = useState<string>('');
    const [customEndDate, setCustomEndDate] = useState<string>('');
    const datePickerRef = useRef<HTMLDivElement>(null);
    const { hasPermission } = usePermissions(user);

    // Close date picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
                setIsDatePickerOpen(false);
            }
        };

        if (isDatePickerOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isDatePickerOpen]);

    // Filter requests based on selected time period
    const filteredRequests = useMemo(() => {
        if (!requests || requests.length === 0) return [];

        const now = new Date();
        let filterStartDate = new Date();
        let filterEndDate = new Date(now);
        filterEndDate.setHours(23, 59, 59, 999);

        if (filter === 'Custom' && customStartDate && customEndDate) {
            // Use custom date range
            filterStartDate = new Date(customStartDate);
            filterStartDate.setHours(0, 0, 0, 0);
            filterEndDate = new Date(customEndDate);
            filterEndDate.setHours(23, 59, 59, 999);
        } else {
            // Use predefined filters
            switch (filter) {
                case 'Day':
                    filterStartDate.setHours(0, 0, 0, 0);
                    break;
                case 'Week':
                    filterStartDate.setDate(now.getDate() - 7);
                    filterStartDate.setHours(0, 0, 0, 0);
                    break;
                case 'Month':
                    filterStartDate.setMonth(now.getMonth() - 1);
                    filterStartDate.setHours(0, 0, 0, 0);
                    break;
            }
        }

        return requests.filter((request) => {
            const requestDate = new Date(request.createdAt);
            return requestDate >= filterStartDate && requestDate <= filterEndDate;
        });
    }, [requests, filter, customStartDate, customEndDate]);

    const handleFilterClick = (f: 'Day' | 'Week' | 'Month') => {
        setFilter(f);
        setCustomStartDate('');
        setCustomEndDate('');
        setIsDatePickerOpen(false);
    };

    const handleCalendarClick = () => {
        setIsDatePickerOpen(!isDatePickerOpen);
    };

    const handleCustomDateApply = () => {
        if (customStartDate && customEndDate) {
            const start = new Date(customStartDate);
            const end = new Date(customEndDate);
            
            if (start > end) {
                // Swap dates if start is after end
                setCustomStartDate(customEndDate);
                setCustomEndDate(customStartDate);
            } else {
                setFilter('Custom');
                setIsDatePickerOpen(false);
            }
        }
    };

    const handleClearCustomDate = () => {
        setCustomStartDate('');
        setCustomEndDate('');
        setFilter('Day');
        setIsDatePickerOpen(false);
    };

    return (
        <div className="bg-white rounded-3xl p-6 shadow-sm mb-8 border border-gray-100">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">{t('recent')}</h3>
                {/* Filters UI to match given image */}
                <div className="flex items-center bg-gray-50 p-1 rounded-xl relative">
                    {(['Day', 'Week', 'Month'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => handleFilterClick(f)}
                            className={`px-4 h-8 rounded-lg text-sm font-medium transition-all
                                ${filter === f
                                    ? 'bg-white shadow-sm text-gray-900 font-semibold'
                                    : 'bg-gray-50 text-gray-400 hover:text-gray-600 font-normal'
                                }`}
                            style={{
                                minWidth: 52,
                                ...(filter === f ? { border: 'none' } : {})
                            }}
                        >
                            {t(`filter.${f.toLowerCase()}`)}
                        </button>
                    ))}
                    {/* Calendar icon - now interactive */}
                    <div className="ml-2 flex items-center bg-inherit relative" ref={datePickerRef}>
                        <button
                            onClick={handleCalendarClick}
                            className={`bg-gray-100 p-1.5 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors flex items-center justify-center ${
                                filter === 'Custom' ? 'bg-blue-100 hover:bg-blue-200' : ''
                            }`}
                            aria-label="Select custom date range"
                        >
                            <svg className={`w-5 h-5 ${filter === 'Custom' ? 'text-blue-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </button>
                        
                        {/* Date Picker Popover */}
                        {isDatePickerOpen && (
                            <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 p-4 z-50 min-w-[280px]">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-sm font-semibold text-gray-900">Select Date Range</h4>
                                        <button
                                            onClick={() => setIsDatePickerOpen(false)}
                                            className="text-gray-400 hover:text-gray-600 transition-colors"
                                            aria-label="Close"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Start Date
                                            </label>
                                            <input
                                                type="date"
                                                value={customStartDate}
                                                onChange={(e) => setCustomStartDate(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                style={{ color: '#111827' }}
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                End Date
                                            </label>
                                            <input
                                                type="date"
                                                value={customEndDate}
                                                onChange={(e) => setCustomEndDate(e.target.value)}
                                                min={customStartDate || undefined}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                style={{ color: '#111827' }}
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                                        <button
                                            onClick={handleCustomDateApply}
                                            disabled={!customStartDate || !customEndDate}
                                            className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Apply
                                        </button>
                                        {(customStartDate || customEndDate || filter === 'Custom') && (
                                            <button
                                                onClick={handleClearCustomDate}
                                                className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                                            >
                                                Clear
                                            </button>
                                        )}
                                    </div>
                                    
                                    {filter === 'Custom' && customStartDate && customEndDate && (
                                        <div className="text-xs text-gray-500 pt-1 border-t border-gray-100">
                                            <span className="font-medium">Active:</span> {new Date(customStartDate).toLocaleDateString()} - {new Date(customEndDate).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-50">
                            <th className="text-left py-4 text-xs font-semibold text-[#8E8E93] uppercase tracking-wider px-2">{t('tableHeaders.id')}</th>
                            <th className="text-left py-4 text-xs font-semibold text-[#8E8E93] uppercase tracking-wider px-2">{t('tableHeaders.fullName')}</th>
                            <th className="text-left py-4 text-xs font-semibold text-[#8E8E93] uppercase tracking-wider px-2">{t('tableHeaders.email')}</th>
                            <th className="text-left py-4 text-xs font-semibold text-[#8E8E93] uppercase tracking-wider px-2">{t('tableHeaders.role')}</th>
                            <th className="text-left py-4 text-xs font-semibold text-[#8E8E93] uppercase tracking-wider px-2">{t('tableHeaders.visitType')}</th>
                            <th className="text-left py-4 text-xs font-semibold text-[#8E8E93] uppercase tracking-wider px-2">{t('tableHeaders.visitDate')}</th>
                            <th className="text-left py-4 text-xs font-semibold text-[#8E8E93] uppercase tracking-wider px-2">{t('tableHeaders.date')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredRequests && filteredRequests.length > 0 ? (
                            filteredRequests.map((request) => {
                                // Handle both applicantName formats (direct or from applicantNameEn/Ar)
                                const applicantName = request.applicantName || request.applicantNameEn || request.applicantNameAr || '';
                                // Handle email from API (applicantEmail) or direct email field
                                const email = request.email || request.applicantEmail || '';
                                
                                return (
                                    <tr key={request.id} className="hover:bg-gray-50/50 transition-colors group">
                                        
                                        <td className="py-4 px-2">
                                            <span className="text-sm text-gray-900">{request.requestNumber.slice(-3)}</span>
                                        </td>
                                        <td className="py-4 px-2">
                                            <div className="flex items-center">
                                                <span className="text-sm font-medium text-gray-900">{applicantName}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-2">
                                            <span className="text-sm text-[#8E8E93]">{email || 'majis@gmail.com'}</span>
                                        </td>
                                        <td className="py-4 px-2">
                                            <span className="text-sm text-gray-900">{t(`types.${request.requestType}`)}</span>
                                        </td>
                                        <td className="py-4 px-2">
                                            <span className="text-sm text-gray-900">{t('work')}</span>
                                        </td>
                                        <td className="py-4 px-2">
                                            <span className="text-sm text-gray-900">{new Date(request.createdAt).toLocaleDateString().replace(/\//g, '\\')}</span>
                                        </td>
                                        <td className="py-4 px-2 text-right">
                                            <span className="text-sm text-gray-900">{new Date(request.createdAt).toLocaleDateString().replace(/\//g, '\\')}</span>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={7} className="py-10 text-center text-gray-400">
                                    {t('noRequests')}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {hasPermission(PERMISSIONS.MANAGE_REQUESTS) && (
                <div className="mt-6">
                    <Link href="/admin/requests" className="text-info-500 hover:text-primary-700 text-sm font-medium flex items-center justify-center py-2 border border-dashed border-gray-200 rounded-xl hover:bg-gray-50 transition-all">
                        {t('viewAll')} →
                    </Link>
                </div>
            )}
        </div>
    );
};
