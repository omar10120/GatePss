'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

interface ChartDataPoint {
    date: string;
    approved: number;
    rejected: number;
    pending: number;
}

export const ActivitiesOfAction: React.FC = () => {
    const t = useTranslations('Admin.dashboard');
    const [filter, setFilter] = useState<'Day' | 'Week' | 'Month'>('Day');
    const [loading, setLoading] = useState(true);
    const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
    const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; data: ChartDataPoint; type: 'visits' | 'permits' } | null>(null);

    useEffect(() => {
        const fetchChartData = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        setLoading(true);
        try {
            const days = filter === 'Day' ? 7 : filter === 'Week' ? 30 : 365;
            const response = await fetch(`/api/admin/dashboard/charts?days=${days}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch chart data');
            }

            const result = await response.json();
            if (result.success && result.data?.lineChart) {
                setChartData(result.data.lineChart);
            }
        } catch (error) {
            console.error('Error fetching chart data:', error);
        } finally {
            setLoading(false);
        }
        };

        fetchChartData();
    }, [filter]);

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

    const visitsPath = generatePath(chartData, (point) => point.approved + point.pending + point.rejected);
    const permitsPath = generatePath(chartData, (point) => point.approved);

    // Get month labels based on data
    const getMonthLabels = () => {
        if (chartData.length === 0) return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        const labels: string[] = [];
        const step = Math.max(1, Math.floor(chartData.length / 12));
        
        for (let i = 0; i < chartData.length; i += step) {
            const date = new Date(chartData[i].date);
            labels.push(date.toLocaleDateString('en-US', { month: 'short' }));
        }
        
        return labels.slice(0, 12);
    };

    const months = getMonthLabels();

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

    const visitsPoints = getPoints(chartData, (point) => point.approved + point.pending + point.rejected);
    const permitsPoints = getPoints(chartData, (point) => point.approved);

    return (
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mb-8">
            <div className="flex justify-between items-center mb-12">
                <h3 className="text-xl font-bold text-gray-900">{t('activitiesOfAction')}</h3>
                <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-xl">
                    {(['Day', 'Week', 'Month'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === f ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            {t(`filter.${f.toLowerCase()}`)}
                        </button>
                    ))}
                    <div className="bg-gray-100 p-2 rounded-lg ml-2 cursor-pointer hover:bg-gray-200 transition-colors">
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
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
                    <div className="relative h-64 mb-6">
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

                            {/* Visits Line (Blue) - Total Requests */}
                            {visitsPath && (
                                <path
                                    d={visitsPath}
                                    fill="none"
                                    stroke="#1E40AF"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            )}

                            {/* Permits Line (Green) - Approved Requests */}
                            {permitsPath && (
                                <path
                                    d={permitsPath}
                                    fill="none"
                                    stroke="#34D399"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            )}

                            {/* Interactive Points for Visits */}
                            {visitsPoints.map((point, index) => (
                                <circle
                                    key={`visits-${index}`}
                                    cx={point.x}
                                    cy={point.y}
                                    r="5"
                                    fill="#1E40AF"
                                    stroke="white"
                                    strokeWidth="2"
                                    className="cursor-pointer hover:r-7 transition-all"
                                    onMouseEnter={() => setHoveredPoint({ x: point.x, y: point.y, data: point.data, type: 'visits' })}
                                    onMouseLeave={() => setHoveredPoint(null)}
                                />
                            ))}

                            {/* Interactive Points for Permits */}
                            {permitsPoints.map((point, index) => (
                                <circle
                                    key={`permits-${index}`}
                                    cx={point.x}
                                    cy={point.y}
                                    r="5"
                                    fill="#34D399"
                                    stroke="white"
                                    strokeWidth="2"
                                    className="cursor-pointer hover:r-7 transition-all"
                                    onMouseEnter={() => setHoveredPoint({ x: point.x, y: point.y, data: point.data, type: 'permits' })}
                                    onMouseLeave={() => setHoveredPoint(null)}
                                />
                            ))}
                        </svg>

                        {/* Tooltip */}
                        {hoveredPoint && (
                            <div
                                className="absolute bg-white shadow-xl rounded-xl p-3 border border-gray-50 z-10 pointer-events-none"
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
                                    {hoveredPoint.type === 'visits' 
                                        ? `${hoveredPoint.data.approved + hoveredPoint.data.pending + hoveredPoint.data.rejected} ${t('visits')}`
                                        : `${hoveredPoint.data.approved} ${t('permits')}`
                                    }
                                </p>
                            </div>
                        )}
                    </div>

                    {/* X-Axis Labels */}
                    <div className="flex justify-between px-2">
                        {months.map((month, index) => (
                            <span key={`${month}-${index}`} className="text-xs font-medium text-[#8E8E93]">{month}</span>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};
