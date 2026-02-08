'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { apiFetch } from '@/lib/api-client';

interface ChartDataPoint {
    date: string;
    approved: number;
    adminApproved: number;
    rejected: number;
    pending: number;
}

export const ActivitiesOfAction: React.FC = () => {
    const t = useTranslations('Admin.dashboard');
    const [filter, setFilter] = useState<'Day' | 'Week' | 'Month' | 'Custom'>('Week');
    const [loading, setLoading] = useState(true);
    const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
    const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; data: ChartDataPoint; type: 'requests' | 'permits' } | null>(null);
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    // Temporary state for date inputs (not applied until "Apply" is clicked)
    const [tempStartDate, setTempStartDate] = useState<string>('');
    const [tempEndDate, setTempEndDate] = useState<string>('');
    // Applied date state (used for actual filtering)
    const [appliedStartDate, setAppliedStartDate] = useState<string>('');
    const [appliedEndDate, setAppliedEndDate] = useState<string>('');


    useEffect(() => {
        const fetchChartData = async () => {
            setLoading(true);
            try {
                let url = '/api/admin/dashboard/charts';
    
                if (filter === 'Custom' && appliedStartDate && appliedEndDate) {
                    url += `?startDate=${appliedStartDate}&endDate=${appliedEndDate}`;
                } else {
                    const days =
                        filter === 'Day' ? 1 :
                        filter === 'Week' ? 7 :
                        30;
    
                    url += `?days=${days}`;
                }
    
                const result = await apiFetch<{ lineChart: ChartDataPoint[] }>(url);
    
                if (result?.lineChart) {
                    setChartData(result.lineChart);
                }
            } catch (error) {
                console.error('Error fetching chart data:', error);
            } finally {
                setLoading(false);
            }
        };
    
        fetchChartData();
    }, [filter, appliedStartDate, appliedEndDate]);
    


    const handleFilterClick = (f: 'Day' | 'Week' | 'Month') => {
        setFilter(f);
        setTempStartDate('');
        setTempEndDate('');
        setAppliedStartDate('');
        setAppliedEndDate('');
        setIsDatePickerOpen(false);
    };

    const handleCalendarClick = () => {
        setIsDatePickerOpen(!isDatePickerOpen);
    };

    const handleCustomDateApply = () => {
        if (!tempStartDate || !tempEndDate) return;
    
        const start = new Date(tempStartDate);
        const end = new Date(tempEndDate);
    
        if (start > end) {
            alert('Start date must be before end date');
            return;
        }
    
        // Apply the temporary dates to the actual filter state
        setAppliedStartDate(tempStartDate);
        setAppliedEndDate(tempEndDate);
        setFilter('Custom');
        setIsDatePickerOpen(false);
    };
    

    const handleClearCustomDate = () => {
        setTempStartDate('');
        setTempEndDate('');
        setAppliedStartDate('');
        setAppliedEndDate('');
        setFilter('Day');
        setIsDatePickerOpen(false);
    };

    // Generate SVG paths from real data
    const generatePath = (data: ChartDataPoint[], getValue: (point: ChartDataPoint) => number): string => {
        if (data.length === 0) return '';

        const maxValue = Math.max(...data.map(getValue), 1);
        const width = 1000;
        const height = 200;
        const padding = 20;
        const chartHeight = height - padding * 2;
        const stepX = (width - padding * 2) / Math.max(data.length - 1, 1);

        let path = '';
        data.forEach((point, index) => {
            const x = padding + index * stepX;
            const value = getValue(point);
            const y = height - padding - (value / maxValue) * chartHeight;
            
            if (index === 0) {
                path = `M ${x} ${y}`;
            } else {
                path += ` L ${x} ${y}`;
            }
        });

        return path;
    };

    // Line 1: All Requests (total requests)
    const requestsPath = generatePath(chartData, (point) => point.approved + point.pending + point.rejected);
    // Line 2: Admin-Approved Only (approved without externalReference, not Sohar-approved)
    const adminApprovedPath = generatePath(chartData, (point) => point.adminApproved);

    // Get month labels based on data
    const getXAxisLabels = () => {
        if (chartData.length === 0) return [];
    
        if (filter === 'Day' || filter === 'Week' || filter === 'Custom') {
            return chartData.map(item =>
                new Date(item.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                })
            );
        }
    
        // Month
        return chartData.map(item =>
            new Date(item.date).toLocaleDateString('en-US', {
                month: 'short',
            })
        );
    };
    
    const xAxisLabels = getXAxisLabels();

    // Calculate points for interaction
    const getPoints = (data: ChartDataPoint[], getValue: (point: ChartDataPoint) => number) => {
        if (data.length === 0) return [];

        const maxValue = Math.max(...data.map(getValue), 1);
        const width = 1000;
        const height = 200;
        const padding = 20;
        const chartHeight = height - padding * 2;
        const stepX = (width - padding * 2) / Math.max(data.length - 1, 1);

        return data.map((point, index) => {
            const x = padding + index * stepX;
            const value = getValue(point);
            const y = height - padding - (value / maxValue) * chartHeight;
            return { x, y, data: point, value };
        });
    };

    // Points for all requests line
    const requestsPoints = getPoints(chartData, (point) => point.approved + point.pending + point.rejected);
    // Points for admin-approved line
    const adminApprovedPoints = getPoints(chartData, (point) => point.adminApproved);

    // Set default hovered point to average/middle position
    useEffect(() => {
        if (chartData.length > 0) {
            const middleIndex = Math.floor(chartData.length / 2);
            const middleData = chartData[middleIndex];
            
            if (middleData) {
                // Calculate position for middle point (use requests line)
                const maxValue = Math.max(...chartData.map(p => p.approved + p.pending + p.rejected), 1);
                const width = 1000;
                const height = 200;
                const padding = 20;
                const chartHeight = height - padding * 2;
                const stepX = (width - padding * 2) / Math.max(chartData.length - 1, 1);
                
                const x = padding + middleIndex * stepX;
                const value = middleData.approved + middleData.pending + middleData.rejected;
                const y = height - padding - (value / maxValue) * chartHeight;
                
                setHoveredPoint({ 
                    x, 
                    y, 
                    data: middleData, 
                    type: 'requests' 
                });
            }
        }
    }, [chartData]);

    return (
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mb-8">
            <div className="flex justify-between items-center mb-12">
                <h3 className="text-xl font-bold text-gray-900">{t('activitiesOfAction')}</h3>
                <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-xl">
                    {(['Day', 'Week', 'Month'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => handleFilterClick(f)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === f ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            {t(`filter.${f.toLowerCase()}`)}
                        </button>
                    ))}
                    <div className="bg-gray-100 p-2 rounded-lg ml-2 cursor-pointer hover:bg-gray-200 transition-colors">
                    <div className="relative">
                        <button
                            onClick={handleCalendarClick}
                            className={`bg-gray-100 p-1.5 rounded-lg hover:bg-gray-200 flex items-center justify-center ${
                                filter === 'Custom' ? 'bg-blue-100' : ''
                            }`}
                        >
                            <svg className={`w-5 h-5 ${filter === 'Custom' ? 'text-blue-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </button>
                        {/* Date Picker Popover */}
                        {isDatePickerOpen && (
                            <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-lg border border-gray-200 p-4 z-[10000] min-w-[280px]">
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
                                                value={tempStartDate}
                                                onChange={(e) => setTempStartDate(e.target.value)}
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
                                                value={tempEndDate}
                                                onChange={(e) => setTempEndDate(e.target.value)}
                                                min={tempStartDate || undefined}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                style={{ color: '#111827' }}
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                                        <button
                                            onClick={handleCustomDateApply}
                                            disabled={!tempStartDate || !tempEndDate}
                                            className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Apply
                                        </button>
                                        {(tempStartDate || tempEndDate || filter === 'Custom') && (
                                            <button
                                                onClick={handleClearCustomDate}
                                                className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                                            >
                                                Clear
                                            </button>
                                        )}
                                    </div>
                                    
                                    {filter === 'Custom' && appliedStartDate && appliedEndDate && (
                                        <div className="text-xs text-gray-500 pt-1 border-t border-gray-100">
                                            <span className="font-medium">Active:</span> {new Date(appliedStartDate).toLocaleDateString()} - {new Date(appliedEndDate).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="h-64 flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                </div>
            ) : chartData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-gray-500">
                    <p>{t('noData')}</p>
                </div>
            ) : (
                <>
                    <div className="relative h-64 mb-6 overflow-visible">
                        {/* Custom SVG Line Chart */}
                        <svg viewBox="0 0 1000 200" className="w-full h-full overflow-visible">
                            {/* Grid Lines */}
                            {[...Array(11)].map((_, i) => (
                                <line
                                    key={i}
                                    x1={i * 100}
                                    y1="0"
                                    x2={i * 100}
                                    y2="200"
                                    stroke="#F2F2F7"
                                    strokeDasharray="4 4"
                                />
                            ))}

                            {/* Requests Line (Blue) - All Requests */}
                            {requestsPath && (
                                <path
                                    d={requestsPath}
                                    fill="none"
                                    stroke="#1E40AF"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            )}

                            {/* Permits Line (Teal) - Admin-Approved Only */}
                            {adminApprovedPath && (
                                <path
                                    d={adminApprovedPath}
                                    fill="none"
                                    stroke="#00B09C"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            )}

                            {/* Interactive Points for Requests */}
                            {requestsPoints.map((point, index) => (
                                <circle
                                    key={`requests-${index}`}
                                    cx={point.x}
                                    cy={point.y}
                                    r="5"
                                    fill="#1E40AF"
                                    stroke="white"
                                    strokeWidth="2"
                                    className="cursor-pointer hover:r-7 transition-all"
                                    onMouseEnter={() => setHoveredPoint({ x: point.x, y: point.y, data: point.data, type: 'requests' })}
                                    onMouseLeave={() => {
                                        // Reset to middle point when leaving
                                        const middleIndex = Math.floor(chartData.length / 2);
                                        const middlePoint = requestsPoints[middleIndex];
                                        if (middlePoint) {
                                            setHoveredPoint({ 
                                                x: middlePoint.x, 
                                                y: middlePoint.y, 
                                                data: middlePoint.data, 
                                                type: 'requests' 
                                            });
                                        }
                                    }}
                                />
                            ))}

                            {/* Interactive Points for Admin-Approved */}
                            {adminApprovedPoints.map((point, index) => (
                                <circle
                                    key={`permits-${index}`}
                                    cx={point.x}
                                    cy={point.y}
                                    r="5"
                                    fill="#00B09C"
                                    stroke="white"
                                    strokeWidth="2"
                                    className="cursor-pointer hover:r-7 transition-all"
                                    onMouseEnter={() => setHoveredPoint({ x: point.x, y: point.y, data: point.data, type: 'permits' })}
                                    onMouseLeave={() => {
                                        // Reset to middle point when leaving
                                        const middleIndex = Math.floor(chartData.length / 2);
                                        const middlePoint = requestsPoints[middleIndex];
                                        if (middlePoint) {
                                            setHoveredPoint({ 
                                                x: middlePoint.x, 
                                                y: middlePoint.y, 
                                                data: middlePoint.data, 
                                                type: 'requests' 
                                            });
                                        }
                                    }}
                                />
                            ))}
                        </svg>

                        {/* Tooltip */}
                        {hoveredPoint && (
                            <div
                                className="absolute z-50 bg-white shadow-xl rounded-xl p-3"
                                style={{
                                    left: `${(hoveredPoint.x / 1000) * 100}%`,
                                    top: `${(hoveredPoint.y / 200) * 100}%`,
                                    transform: 'translate(-50%, -100%)',
                                    marginTop: '-10px',
                                }}
                            >
                                <p className="text-[10px] text-gray-400">
                                    {new Date(hoveredPoint.data.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </p>
                                <p className="text-xs font-bold text-gray-900">
                                    {hoveredPoint.type === 'requests' 
                                        ? `${hoveredPoint.data.approved + hoveredPoint.data.pending + hoveredPoint.data.rejected} ${t('requests')}`
                                        : `${hoveredPoint.data.adminApproved} ${t('permits')}`
                                    }
                                </p>
                            </div>
                        )}
                    </div>

                    {/* X-Axis Labels */}
                    <div className="flex justify-between px-2 mb-6">
                        {xAxisLabels.map((label, index) => (
                            <span key={index} className="text-xs font-medium text-[#8E8E93]">
                                {label}
                            </span>
                        ))}
                    </div>

                    {/* Legend */}
                    <div className="flex items-center justify-center gap-8">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-1 bg-[#1E40AF] rounded-full"></div>
                            <span className="text-sm font-medium text-gray-900">{t('requests')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-1 bg-[#00B09C] rounded-full"></div>
                            <span className="text-sm font-medium text-gray-900">{t('permits')}</span>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
