import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    padding?: 'none' | 'sm' | 'md' | 'lg';
    hover?: boolean;
    onClick?: () => void;
}

const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
};

export const Card: React.FC<CardProps> = ({
    children,
    className = '',
    padding = 'md',
    hover = false,
    onClick,
}) => {
    const hoverStyle = hover ? 'hover:shadow-lg transition-shadow duration-200' : '';
    const combinedClassName = `bg-white rounded-lg shadow ${paddingStyles[padding]} ${hoverStyle} ${className}`.trim();

    return <div className={combinedClassName} onClick={onClick}>{children}</div>;
};

interface CardHeaderProps {
    children: React.ReactNode;
    className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '' }) => {
    return <div className={`border-b border-gray-200 pb-4 mb-4 ${className}`.trim()}>{children}</div>;
};

interface CardTitleProps {
    children: React.ReactNode;
    className?: string;
}

export const CardTitle: React.FC<CardTitleProps> = ({ children, className = '' }) => {
    return <h3 className={`text-lg font-semibold text-gray-900 ${className}`.trim()}>{children}</h3>;
};

interface CardContentProps {
    children: React.ReactNode;
    className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({ children, className = '' }) => {
    return <div className={className}>{children}</div>;
};
