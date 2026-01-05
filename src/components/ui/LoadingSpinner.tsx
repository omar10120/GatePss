import React from 'react';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
    message?: string;
}

const sizeStyles = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    size = 'md',
    className = '',
    message,
}) => {
    return (
        <div className={`flex flex-col items-center justify-center ${className}`.trim()}>
            <div className={`${sizeStyles[size]} border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin`} />
            {message && <p className="mt-4 text-gray-600">{message}</p>}
        </div>
    );
};

interface PageLoaderProps {
    message?: string;
}

export const PageLoader: React.FC<PageLoaderProps> = ({ message = 'Loading...' }) => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <LoadingSpinner size="lg" message={message} />
        </div>
    );
};
