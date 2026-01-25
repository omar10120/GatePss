'use client';

import React, { useId } from 'react';

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
    const generatedId = useId();
    const inputId = id || `input-${generatedId}`;
    const hasError = !!error;

    return (
        <div className="w-full">
            {label && (
                <label htmlFor={inputId} className="block text-[16px] font-normal text-[#222222] mb-2 font-['Rubik']">
                    {label}
                </label>
            )}
            <div className="relative">
                {leftIcon && (
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        {leftIcon}
                    </div>
                )}
                <input
                    id={inputId}
                    style={{ color: '#111827' }}
                    className={`
                        flex w-full h-[58px] bg-white border-[0.5px] border-[#D0D0D0] rounded-[12px] px-4 py-4 
                        text-[14px] font-['Rubik'] text-gray-900 placeholder:text-[#747474] 
                        focus:outline-none focus:ring-2 focus:ring-[#00B09C]/20 focus:border-[#00B09C] 
                        transition-all disabled:cursor-not-allowed disabled:opacity-50
                        ${hasError ? "border-danger-500 focus:ring-danger-500/20 focus:border-danger-500" : ""}
                        ${leftIcon ? "pl-12" : ""}
                        ${rightIcon ? "pr-12" : ""}
                        ${props.type === 'date' ? "date-input-custom" : ""}
                        ${className}
                    `.trim()}
                    {...props}
                />
                {rightIcon && (
                    <div 
                        className={`absolute inset-y-0 right-0 pr-4 flex items-center ${props.type === 'date' ? 'cursor-pointer hover:opacity-80 transition-opacity' : 'pointer-events-none'}`}
                        onClick={props.type === 'date' ? (e) => {
                            e.preventDefault();
                            const input = document.getElementById(inputId) as HTMLInputElement;
                            if (input) {
                                // Try modern showPicker API first
                                if (input.showPicker && typeof input.showPicker === 'function') {
                                    input.showPicker();
                                } else {
                                    // Fallback: focus and click
                                    input.focus();
                                    input.click();
                                }
                            }
                        } : undefined}
                        role={props.type === 'date' ? 'button' : undefined}
                        tabIndex={props.type === 'date' ? 0 : undefined}
                        onKeyDown={props.type === 'date' ? (e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                const input = document.getElementById(inputId) as HTMLInputElement;
                                if (input) {
                                    if (input.showPicker && typeof input.showPicker === 'function') {
                                        input.showPicker();
                                    } else {
                                        input.focus();
                                        input.click();
                                    }
                                }
                            }
                        } : undefined}
                    >
                        {rightIcon}
                    </div>
                )}
            </div>
            {error && (
                <p className="mt-1.5 text-[12px] text-danger-600 font-medium font-['Rubik']">{error}</p>
            )}
            {helperText && !error && (
                <p className="mt-1.5 text-[12px] text-gray-400 font-['Rubik']">{helperText}</p>
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
    const generatedId = useId();
    const selectId = id || `select-${generatedId}`;
    const hasError = !!error;

    return (
        <div className="w-full">
            {label && (
                <label htmlFor={selectId} className="block text-[16px] font-normal text-[#222222] mb-2 font-['Rubik']">
                    {label}
                </label>
            )}
            <div className="relative">
                <select
                    id={selectId}
                    style={{ color: '#111827' }}
                    className={`
                        flex w-full h-[58px] bg-white border-[0.5px] border-[#D0D0D0] rounded-[12px] px-4 py-4 
                        text-[14px] font-['Rubik'] text-gray-900 appearance-none
                        focus:outline-none focus:ring-2 focus:ring-[#00B09C]/20 focus:border-[#00B09C] 
                        transition-all disabled:cursor-not-allowed disabled:opacity-50
                        ${hasError ? "border-danger-500 focus:ring-danger-500/20 focus:border-danger-500" : ""}
                        ${className}
                    `.trim()}
                    {...props}
                >
                    {options.map((option) => (
                        <option 
                            key={option.value} 
                            value={option.value} 
                            
                        >
                            {option.label}
                        </option>
                    ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <svg className="w-6 h-6 text-[#747474]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>
            {error && (
                <p className="mt-1.5 text-[12px] text-danger-600 font-medium font-['Rubik']">{error}</p>
            )}
            {helperText && !error && (
                <p className="mt-1.5 text-[12px] text-gray-400 font-['Rubik']">{helperText}</p>
            )}
        </div>
    );
};


