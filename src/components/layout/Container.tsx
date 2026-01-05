import React from 'react';

interface ContainerProps {
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    className?: string;
}

const sizeStyles = {
    sm: 'max-w-3xl',
    md: 'max-w-5xl',
    lg: 'max-w-7xl',
    xl: 'max-w-screen-2xl',
    full: 'max-w-full',
};

export const Container: React.FC<ContainerProps> = ({
    children,
    size = 'lg',
    className = '',
}) => {
    return (
        <div className={`container mx-auto px-4 ${sizeStyles[size]} ${className}`.trim()}>
            {children}
        </div>
    );
};
