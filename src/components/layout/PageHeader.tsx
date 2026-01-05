import React from 'react';
import { Button } from '../ui';

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    actions?: React.ReactNode;
    breadcrumbs?: Array<{ label: string; href?: string }>;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
    title,
    subtitle,
    actions,
    breadcrumbs,
}) => {
    return (
        <div className="mb-8">
            {breadcrumbs && breadcrumbs.length > 0 && (
                <nav className="mb-4">
                    <ol className="flex items-center space-x-2 text-sm text-gray-500">
                        {breadcrumbs.map((crumb, index) => (
                            <li key={index} className="flex items-center">
                                {index > 0 && (
                                    <svg className="w-4 h-4 mx-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path
                                            fillRule="evenodd"
                                            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                )}
                                {crumb.href ? (
                                    <a href={crumb.href} className="hover:text-gray-700">
                                        {crumb.label}
                                    </a>
                                ) : (
                                    <span className="text-gray-900 font-medium">{crumb.label}</span>
                                )}
                            </li>
                        ))}
                    </ol>
                </nav>
            )}
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
                    {subtitle && <p className="mt-2 text-gray-600">{subtitle}</p>}
                </div>
                {actions && <div className="ml-4 flex items-center space-x-3">{actions}</div>}
            </div>
        </div>
    );
};
