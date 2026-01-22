'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

interface Request {
    id: number;
    requestNumber: string;
    applicantName: string;
    status: string;
    requestType: string;
    createdAt: string;
    email?: string; // Adding optional email if available
}

interface LatestRequestsProps {
    requests: Request[] | undefined;
}

export const LatestRequests: React.FC<LatestRequestsProps> = ({ requests }) => {
    const t = useTranslations('Admin.dashboard');
    const [filter, setFilter] = useState<'Day' | 'Week' | 'Month'>('Day');

    return (
        <div className="bg-white rounded-3xl p-6 shadow-sm mb-8 border border-gray-100">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">{t('recent')}</h3>
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
                        {requests && requests.length > 0 ? (
                            requests.map((request) => (
                                <tr key={request.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="py-4 px-2">
                                        <span className="text-sm text-gray-900">{request.requestNumber.slice(-3)}</span>
                                    </td>
                                    <td className="py-4 px-2">
                                        <div className="flex items-center">
                                            <span className="text-sm font-medium text-gray-900">{request.applicantName}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-2">
                                        <span className="text-sm text-[#8E8E93]">{request.email || 'majis@gmail.com'}</span>
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
                            ))
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
            <div className="mt-6">
                <Link href="/admin/requests" className="text-info-500 hover:text-primary-700 text-sm font-medium flex items-center justify-center py-2 border border-dashed border-gray-200 rounded-xl hover:bg-gray-50 transition-all">
                    {t('viewAll')} →
                </Link>
            </div>
        </div>
    );
};
