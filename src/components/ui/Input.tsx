import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    helperText,
    leftIcon,
    rightIcon,
    className = '',
    id,
    ...props
}) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = !!error;

    return (
        <div className="w-full">
            {label && (
                <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                </label>
            )}
            <div className="relative">
                {leftIcon && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        {leftIcon}
                    </div>
                )}
                <input
                    id={inputId}
                    className={`
                        block w-full rounded-lg border
                        ${hasError ? 'border-danger-500 focus:ring-danger-500 focus:border-danger-500' : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'}
                        ${leftIcon ? 'pl-10' : 'pl-3'}
                        ${rightIcon ? 'pr-10' : 'pr-3'}
                        py-2 text-gray-900 placeholder-gray-400
                        focus:outline-none focus:ring-2
                        disabled:bg-gray-100 disabled:cursor-not-allowed
                        ${className}
                    `.trim()}
                    {...props}
                />
                {rightIcon && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        {rightIcon}
                    </div>
                )}
            </div>
            {error && (
                <p className="mt-1 text-sm text-danger-600">{error}</p>
            )}
            {helperText && !error && (
                <p className="mt-1 text-sm text-gray-500">{helperText}</p>
            )}
        </div>
    );
};

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    helperText?: string;
    options: Array<{ value: string; label: string }>;
}

export const Select: React.FC<SelectProps> = ({
    label,
    error,
    helperText,
    options,
    className = '',
    id,
    ...props
}) => {
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = !!error;

    return (
        <div className="w-full">
            {label && (
                <label htmlFor={selectId} className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                </label>
            )}
            <select
                id={selectId}
                className={`
                    block w-full rounded-lg border
                    ${hasError ? 'border-danger-500 focus:ring-danger-500 focus:border-danger-500' : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'}
                    px-3 py-2 text-gray-900 focus:outline-none focus:ring-2
                    disabled:bg-gray-100 disabled:cursor-not-allowed
                    ${className}
                `.trim()}
                {...props}
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            {error && (
                <p className="mt-1 text-sm text-danger-600">{error}</p>
            )}
            {helperText && !error && (
                <p className="mt-1 text-sm text-gray-500">{helperText}</p>
            )}
        </div>
    );
};
