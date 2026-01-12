'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';

export const ActivitiesOfAction: React.FC = () => {
    const t = useTranslations('Admin.dashboard');
    const [filter, setFilter] = useState<'Day' | 'Week' | 'Month'>('Day');

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Mock SVG path for visual matching
    const visitsPath = "M0 80 Q100 0, 200 120 T400 60 T600 100 T800 80 T1000 120";
    const permitsPath = "M0 100 Q150 150, 300 50 T600 120 T900 80 T1000 150";

    return (
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mb-8">
            <div className="flex justify-between items-center mb-12">
                <h3 className="text-xl font-bold text-gray-900">Activities Of Action</h3>
                <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-xl">
                    {(['Day', 'Week', 'Month'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === f ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                    <div className="bg-gray-100 p-2 rounded-lg ml-2 cursor-pointer hover:bg-gray-200 transition-colors">
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                </div>
            </div>

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

                    {/* Visits Line (Blue) */}
                    <path
                        d={visitsPath}
                        fill="none"
                        stroke="#1E40AF"
                        strokeWidth="3"
                        strokeLinecap="round"
                        className="animate-draw"
                    />

                    {/* Permits Line (Green) */}
                    <path
                        d={permitsPath}
                        fill="none"
                        stroke="#34D399"
                        strokeWidth="3"
                        strokeLinecap="round"
                    />

                    {/* Tooltip Points */}
                    <circle cx="310" cy="85" r="5" fill="#1E40AF" stroke="white" strokeWidth="2" />
                    <circle cx="488" cy="73" r="5" fill="#34D399" stroke="white" strokeWidth="2" />
                </svg>

                {/* Tooltip Labels (CSS Positioned) */}
                <div className="absolute top-[85px] left-[26%] bg-white shadow-xl rounded-xl p-3 border border-gray-50">
                    <p className="text-[10px] text-gray-400">June 16</p>
                    <p className="text-xs font-bold text-gray-900">20 Visits</p>
                </div>

                <div className="absolute top-[40px] left-[46%] bg-white shadow-xl rounded-xl p-3 border border-gray-50">
                    <p className="text-[10px] text-gray-400">June 16</p>
                    <p className="text-xs font-bold text-gray-900">20 permits</p>
                </div>
            </div>

            {/* X-Axis Labels */}
            <div className="flex justify-between px-2">
                {months.map((month) => (
                    <span key={month} className="text-xs font-medium text-[#8E8E93]">{month}</span>
                ))}
            </div>
        </div>
    );
};
