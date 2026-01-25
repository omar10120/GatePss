'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';

interface VerifyIdentityProps {
    onVerify: (otp: string) => void;
    onResend: () => void;
    onClose: () => void;
    isLoading?: boolean;
    error?: string;
}

export default function VerifyIdentity({ onVerify, onResend, onClose, isLoading, error }: VerifyIdentityProps) {
    const t = useTranslations('HomePage.login.verify');
    const [otp, setOtp] = useState(['', '', '', '']);
    const [timer, setTimer] = useState(60);
    const [canResend, setCanResend] = useState(false);
    const inputRefs = [
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),

    ];

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        } else {
            setCanResend(true);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleChange = (index: number, value: string) => {
        if (value.length > 1) value = value[value.length - 1];
        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Move to next input if value is entered
        if (value && index < 3) {
            inputRefs[index + 1].current?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs[index - 1].current?.focus();
        }
    };

    const handleVerify = () => {
        const otpString = otp.join('');
        if (otpString.length === 4) {
            onVerify(otpString);
        }
    };

    const handleResend = () => {
        setTimer(60);
        setCanResend(false);
        setOtp(['', '', '', '']);
        onResend();
    };

    return (
        <div className="bg-white rounded-[32px] p-8 md:p-12 max-w-lg w-full shadow-xl relative overflow-hidden border border-gray-100">
            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute top-6 right-6 p-2 rounded-full border border-teal-100 text-teal-500 hover:bg-teal-50 transition-colors"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            <div className="flex flex-col items-center text-center">
                <h2 className="text-3xl font-extrabold text-[#1e3a5f] mb-4">
                    {t('title')}
                </h2>
                <p className="text-gray-400 text-lg mb-6 max-w-sm">
                    {t('subtitle')}
                </p>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 w-full p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        {error}
                    </div>
                )}

                {/* OTP Inputs */}
                <div className="flex gap-4 mb-10">
                    {otp.map((digit, index) => (
                        <input
                            key={index}
                            ref={inputRefs[index]}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            className={`w-16 h-16 md:w-20 md:h-20 text-center text-2xl font-bold rounded-2xl border-2 transition-all outline-none
                                ${digit ? 'border-[#00B09C] text-[#00B09C]' : 'border-gray-100 text-gray-400 focus:border-teal-300'}`}
                        />
                    ))}
                </div>

                {/* Verify Button */}
                <button
                    onClick={handleVerify}
                    disabled={otp.some(d => !d) || isLoading}
                    className="w-full bg-[#00B09C] hover:bg-[#009a8a] text-white py-5 rounded-[24px] font-bold text-xl shadow-lg shadow-teal-100 transform active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mb-6"
                >
                    {isLoading ? t('verifying') : t('verifyButton')}
                </button>

                {/* Footer: Timer or Resend */}
                <div className="h-8 flex items-center justify-center">
                    {!canResend ? (
                        <p className="text-gray-400 font-medium text-lg">
                            {formatTime(timer)}
                        </p>
                    ) : (
                        <button
                            onClick={handleResend}
                            className="text-[#00B09C] hover:text-[#009a8a] font-bold text-lg transition-colors underline-offset-4 hover:underline"
                        >
                            {t('resendLink')}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
