'use client';

import React from 'react';

interface VisitorsApplicationsCardProps {
    data: {
        total: number;
        approved: number;
        rejected: number;
    } | null;
}

export const VisitorsApplicationsCard: React.FC<VisitorsApplicationsCardProps> = ({ data }) => {
    // Use real data from database, default to 0 if not available
    const total = data?.total || 0;
    const approved = data?.approved || 0;
    const rejected = data?.rejected || 0;

    // SVG Donut Chart Calculation
    const size = 200;
    const strokeWidth = 40;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    // Calculate percentages, handle division by zero
    const approvedPercentage = total > 0 ? (approved / total) * 100 : 0;
    const rejectedPercentage = total > 0 ? (rejected / total) * 100 : 0;

    const approvedOffset = circumference - (approvedPercentage / 100) * circumference;
    const rejectedOffset = circumference - (rejectedPercentage / 100) * circumference;

    return (
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col items-center h-full">
            <h3 className="text-xl font-bold text-gray-900 mb-1">Visitors Applications Card</h3>
            <p className="text-[#8E8E93] text-sm mb-8">{total} Total applications</p>

            <div className="relative mb-8">
                <svg width={size} height={size} className="transform -rotate-90">
                    {/* Background Circle */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="transparent"
                        stroke="#F2F2F7"
                        strokeWidth={strokeWidth}
                    />
                    {/* Approved Segment (Teal) */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="transparent"
                        stroke="#00B09C"
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        strokeDashoffset={approvedOffset}
                        strokeLinecap="butt"
                    />
                    {/* Rejected Segment (Red) */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="transparent"
                        stroke="#FF5757"
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        strokeDashoffset={rejectedOffset}
                        strokeLinecap="butt"
                        transform={`rotate(${approvedPercentage * 3.6}, ${size / 2}, ${size / 2})`}
                    />
                </svg>
                {/* Center Hole Shadow Effect */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-24 h-24 bg-white rounded-full shadow-inner"></div>
                </div>
            </div>

            <div className="flex gap-8 mt-auto w-full justify-center">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-4 bg-[#00B09C] rounded-full"></div>
                    <span className="text-sm font-bold text-gray-900">{approved}</span>
                    <span className="text-xs text-[#8E8E93]">Approved</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-4 bg-[#FF5757] rounded-full"></div>
                    <span className="text-sm font-bold text-gray-900">{rejected}</span>
                    <span className="text-xs text-[#8E8E93]">Rejected</span>
                </div>
            </div>
        </div>
    );
};
