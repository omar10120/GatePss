'use client';

import React from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

interface IntegrationErrorModalProps {
    isOpen: boolean;
    onClose: () => void;
    error: string;
    message: string;
    details?: {
        statusCode?: number;
        apiMessage?: string;
        apiError?: string;
    };
}

export default function IntegrationErrorModal({ 
    isOpen, 
    onClose, 
    error, 
    message, 
    details 
}: IntegrationErrorModalProps) {
    const t = useTranslations('Admin.dashboard');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10001] p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center shadow-xl border-t-4 border-red-500">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{error || 'Integration Error'}</h3>
                {/* <p className="text-gray-600 mb-4">{message}</p> */}
                
                {details && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                        <p className="text-xs font-bold text-gray-400 uppercase mb-2">Technical Details</p>
                        {details.apiError && (
                            <p className="text-sm text-red-600 font-medium mb-1">
                                <span className="text-gray-500">Error:</span> {details.apiError}
                            </p>
                        )}
                        {details.statusCode && (
                            <p className="text-sm text-gray-600">
                                <span className="text-gray-500">Status Code:</span> {details.statusCode}
                            </p>
                        )}
                        {(details.apiMessage || message) && (
                            <p className="text-sm text-gray-600 mt-1">
                                <span className="text-gray-500">API Message:</span> {details.apiMessage || message}
                            </p>
                        )}
                    </div>
                )}
                
                <button
                    onClick={onClose}
                    className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold hover:bg-gray-800 transition-colors"
                >
                    Close
                </button>
            </div>
        </div>
    );
}
