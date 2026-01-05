import React from 'react';
import { Card } from './Card';

interface StatCardProps {
    title: string;
    value: string | number;
    icon?: React.ReactNode;
    trend?: {
        value: string;
        isPositive: boolean;
    };
    color?: 'primary' | 'success' | 'warning' | 'danger';
    onClick?: () => void;
}

const colorStyles = {
    primary: 'bg-primary-50 text-primary-600',
    success: 'bg-success-50 text-success-600',
    warning: 'bg-warning-50 text-warning-600',
    danger: 'bg-danger-50 text-danger-600',
};

export const StatCard: React.FC<StatCardProps> = ({
    title,
    value,
    icon,
    trend,
    color = 'primary',
    onClick,
}) => {
    const isClickable = !!onClick;

    return (
        <Card
            hover={isClickable}
            className={isClickable ? 'cursor-pointer' : ''}
            onClick={onClick}
        >
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">{title}</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
                    {trend && (
                        <div className={`mt-2 flex items-center text-sm ${trend.isPositive ? 'text-success-600' : 'text-danger-600'}`}>
                            <svg
                                className={`w-4 h-4 mr-1 ${trend.isPositive ? '' : 'rotate-180'}`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            <span>{trend.value}</span>
                        </div>
                    )}
                </div>
                {icon && (
                    <div className={`p-3 rounded-lg ${colorStyles[color]}`}>
                        {icon}
                    </div>
                )}
            </div>
        </Card>
    );
};
