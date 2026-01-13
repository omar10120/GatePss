'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
interface KPICardsProps {
    data: {
        total: number;
        approved: number;
        pending: number;
        rejected: number;
    } | null;
}

export const KPICards: React.FC<KPICardsProps> = ({ data }) => {
    const t = useTranslations('Admin.dashboard');

    const cards = [
        {
            label: t('total'),
            value: data?.total || 0,
            trend: '+11.01%',
            isPositive: true,
            bgColor: 'bg-blue-50',
            iconColor: 'bg-purple-100',
            icon: (
                <Image src="/images/icons/icon1.png" alt="Majis Logo" width={42} height={42} />
            )
        },
        {
            label: t('approved'),
            value: data?.approved || 0,
            trend: '-0.03%',
            isPositive: false,
            bgColor: 'bg-blue-50',
            iconColor: 'bg-green-100',
            icon: (
                <Image src="/images/icons/icon2.png" alt="Majis Logo" width={42} height={42} />
            )
        },
        {
            label: t('pending'),
            value: data?.pending || 0,
            trend: '+6.08%',
            isPositive: true,
            bgColor: 'bg-blue-50',
            iconColor: 'bg-orange-100',

            icon: (
                <Image src="/images/icons/icon3.png" alt="Majis Logo" width={42} height={42} />
            )
        },
        {
            label: t('rejected'),
            value: data?.rejected || 0,
            trend: '+15.03%',
            isPositive: true,
            bgColor: 'bg-blue-50',
            iconColor: 'bg-red-100',
            icon: (
                <Image src="/images/icons/icon4.png" alt="Majis Logo" width={42} height={42} />
            )
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {cards.map((card, idx) => (
                <div key={idx} className={`${card.bgColor} rounded-3xl p-6 shadow-sm flex flex-col justify-between h-40`}>
                    <div className="flex justify-between items-start">
                        <div className={`${card.iconColor} p-3 rounded-2xl`}>
                            {card.icon}
                        </div>
                    </div>
                    <div>
                        <p className="text-gray-500 font-medium mb-1">{card.label}</p>
                        <div className="flex items-end justify-between">
                            <h3 className="text-3xl font-bold text-gray-900">{card.value.toLocaleString()}</h3>
                            <div className="flex items-center gap-1">
                                <span className={`text-xs font-semibold ${card.isPositive ? 'text-gray-900' : 'text-gray-900'}`}>
                                    {card.trend}
                                </span>
                                <svg className={`w-4 h-4 ${card.isPositive ? 'text-gray-900' : 'text-gray-900'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    {card.isPositive ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
                                    )}
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
