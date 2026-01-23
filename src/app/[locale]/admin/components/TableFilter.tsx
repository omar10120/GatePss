'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';

// Helper function to get days in a month
const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
};

// Helper function to get first day of month
const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
};

// Helper function to format date as YYYY-MM-DD
const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

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

    // State for dropdowns
    const [isDateOpen, setIsDateOpen] = useState(false);
    const [isStatusOpen, setIsStatusOpen] = useState(false);
    const dateRef = useRef<HTMLDivElement>(null);
    const statusRef = useRef<HTMLDivElement>(null);

    // Date picker state
    const [selectedDate, setSelectedDate] = useState<Date | null>(
        currentFilters.date ? new Date(currentFilters.date) : null
    );
    const [currentMonth, setCurrentMonth] = useState<Date>(
        selectedDate || new Date()
    );
    const [tempSelectedDate, setTempSelectedDate] = useState<Date | null>(selectedDate);

    // Default status options if not provided
    const defaultStatusOptions = [
        { value: "PENDING", label: "Pending" },
        { value: "APPROVED", label: "Approved" },
        { value: "REJECTED", label: "Rejected" },
    ];

    const optionsToRender = statusOptions || defaultStatusOptions;

    // Get display text for date
    const getDateDisplayText = () => {
        if (!currentFilters.date) return t('date');
        // If it's a date string (YYYY-MM-DD format), format it nicely
        if (currentFilters.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const date = new Date(currentFilters.date);
            return date.toLocaleDateString(locale, { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });
        }
        return currentFilters.date;
    };

    // Calendar helpers
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    const navigateMonth = (direction: 'prev' | 'next') => {
        setCurrentMonth(prev => {
            const newDate = new Date(prev);
            if (direction === 'prev') {
                newDate.setMonth(prev.getMonth() - 1);
            } else {
                newDate.setMonth(prev.getMonth() + 1);
            }
            return newDate;
        });
    };

    const handleDateSelect = (day: number) => {
        const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        setTempSelectedDate(newDate);
    };

    const handleApplyDate = () => {
        if (tempSelectedDate) {
            const dateString = formatDateForInput(tempSelectedDate);
            setSelectedDate(tempSelectedDate);
            onDateChange(dateString);
            setIsDateOpen(false);
        }
    };

    // Update temp selected date when opening picker
    useEffect(() => {
        if (isDateOpen) {
            setTempSelectedDate(selectedDate || new Date());
            setCurrentMonth(selectedDate || new Date());
        }
    }, [isDateOpen, selectedDate]);

    // Get display text for status
    const getStatusDisplayText = () => {
        if (!currentFilters.status) return statusLabel || t('status');
        const option = optionsToRender.find(opt => opt.value === currentFilters.status);
        return option ? option.label : statusLabel || t('status');
    };

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dateRef.current && !dateRef.current.contains(event.target as Node)) {
                setIsDateOpen(false);
            }
            if (statusRef.current && !statusRef.current.contains(event.target as Node)) {
                setIsStatusOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="bg-white rounded-[12px] border border-gray-100 flex items-center h-[60px] shadow-sm mb-6 relative" style={{ overflow: 'visible' }}>
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

            {/* Date Picker */}
            {!hideDate && (
                <div 
                    ref={dateRef}
                    className={`relative flex items-center px-6 h-full border-l border-gray-100 min-w-[180px] ${isRtl ? 'border-r border-l-0' : 'border-l'}`}
                    style={{ overflow: 'visible' }}
                >
                    <button
                        type="button"
                        onClick={() => {
                            setIsDateOpen(!isDateOpen);
                            setIsStatusOpen(false);
                        }}
                        className="flex items-center justify-between w-full bg-transparent border-none outline-none cursor-pointer"
                    >
                        <span className="text-gray-900 text-[14px] font-bold">
                            {getDateDisplayText()}
                        </span>
                        <svg 
                            className={`w-5 h-5 text-gray-900 ${isRtl ? 'mr-2' : 'ml-2'}`} 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                        >
                            <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </button>
                    
                    {isDateOpen && (
                        <div className={`absolute top-full ${isRtl ? 'right-0' : 'left-0'} mt-2 bg-white rounded-lg shadow-xl border border-gray-200 z-[9999] p-4 w-[320px]`}>
                            {/* Calendar Header */}
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-gray-900 font-bold text-base">
                                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                                </h3>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => navigateMonth('prev')}
                                        className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 hover:bg-gray-50 transition-colors"
                                    >
                                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => navigateMonth('next')}
                                        className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 hover:bg-gray-50 transition-colors"
                                    >
                                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Week Days Header */}
                            <div className="grid grid-cols-7 gap-1 mb-2">
                                {weekDays.map((day, index) => (
                                    <div key={index} className="text-center text-xs font-bold text-gray-500 py-2">
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* Calendar Grid */}
                            <div className="grid grid-cols-7 gap-1">
                                {(() => {
                                    const daysInMonth = getDaysInMonth(currentMonth);
                                    const firstDay = getFirstDayOfMonth(currentMonth);
                                    const days: (number | null)[] = [];
                                    
                                    // Add empty cells for days before the first day of the month
                                    for (let i = 0; i < firstDay; i++) {
                                        days.push(null);
                                    }
                                    
                                    // Add days of the month
                                    for (let day = 1; day <= daysInMonth; day++) {
                                        days.push(day);
                                    }
                                    
                                    return days.map((day, index) => {
                                        if (day === null) {
                                            return <div key={index} className="aspect-square"></div>;
                                        }
                                        
                                        const dateForDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                                        const isSelected = tempSelectedDate && 
                                            dateForDay.getDate() === tempSelectedDate.getDate() &&
                                            dateForDay.getMonth() === tempSelectedDate.getMonth() &&
                                            dateForDay.getFullYear() === tempSelectedDate.getFullYear();
                                        const isToday = dateForDay.toDateString() === new Date().toDateString();
                                        
                                        return (
                                            <button
                                                key={index}
                                                type="button"
                                                onClick={() => handleDateSelect(day)}
                                                className={`aspect-square flex items-center justify-center text-sm font-medium rounded transition-colors ${
                                                    isSelected
                                                        ? 'bg-[#00B09C] text-white'
                                                        : isToday
                                                        ? 'bg-gray-100 text-gray-900'
                                                        : 'text-gray-700 hover:bg-gray-50'
                                                }`}
                                            >
                                                {day}
                                            </button>
                                        );
                                    });
                                })()}
                            </div>

                            {/* Apply Button */}
                            <button
                                type="button"
                                onClick={handleApplyDate}
                                className="w-full mt-4 bg-[#00B09C] text-white font-bold py-3 px-4 rounded-lg hover:bg-[#008f7e] transition-colors"
                            >
                                Apply Now
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Status Dropdown */}
            <div 
                ref={statusRef}
                className={`relative flex items-center px-6 h-full border-l border-gray-100 min-w-[140px] ${isRtl ? 'border-r border-l-0' : 'border-l'}`}
                style={{ overflow: 'visible' }}
            >
                <button
                    type="button"
                    onClick={() => {
                        setIsStatusOpen(!isStatusOpen);
                        setIsDateOpen(false);
                    }}
                    className="flex items-center justify-between w-full bg-transparent border-none outline-none cursor-pointer"
                >
                    <span className="text-gray-900 text-[14px] font-bold">
                        {getStatusDisplayText()}
                    </span>
                    <svg 
                        className={`w-4 h-4 text-gray-900 ${isRtl ? 'mr-2' : 'ml-2'} transition-transform ${isStatusOpen ? 'rotate-180' : ''}`} 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                    >
                        <path d="M6 9l6 6 6-6"></path>
                    </svg>
                </button>
                
                {isStatusOpen && (
                    <div className={`absolute top-full ${isRtl ? 'right-0' : 'left-0'} mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-[9999] overflow-hidden min-w-[140px]`}>
                        <button
                            type="button"
                            onClick={() => {
                                onStatusChange('');
                                setIsStatusOpen(false);
                            }}
                            className={`w-full text-left px-4 py-3 text-[14px] font-bold hover:bg-gray-50 transition-colors ${
                                !currentFilters.status 
                                    ? 'bg-teal-50 text-teal-600' 
                                    : 'text-gray-900'
                            }`}
                        >
                            {statusLabel || t('status')}
                        </button>
                        {optionsToRender.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                    onStatusChange(option.value);
                                    setIsStatusOpen(false);
                                }}
                                className={`w-full text-left px-4 py-3 text-[14px] font-bold hover:bg-gray-50 transition-colors ${
                                    currentFilters.status === option.value 
                                        ? 'bg-teal-50 text-teal-600' 
                                        : 'text-gray-900'
                                }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                )}
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
