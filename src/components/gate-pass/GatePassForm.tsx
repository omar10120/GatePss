'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { FileUpload } from '@/components/ui/FileUpload';
import Image from 'next/image';

import { SuccessfullDialog } from '../ui/SuccessfullDialog';

export const GatePassForm: React.FC = () => {
    const t = useTranslations('GatePassPage');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [confirmed, setConfirmed] = useState(false);
    const [createdRequestNumber, setCreatedRequestNumber] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!confirmed) {
            setError('Please confirm the information is correct');
            return;
        }

        const formData = new FormData(e.currentTarget);

        // Validate required file upload manually (since hidden inputs can't use required attribute)
        const passportIdImage = formData.get('passportIdImage') as File | null;
        if (!passportIdImage || passportIdImage.size === 0) {
            setError('Passport/ID image is required');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');
        setCreatedRequestNumber(null);


        try {
            const response = await fetch('/api/requests', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();
            console.log('Response data:', data);

            if (!response.ok) {
                // If there are validation errors, format them nicely
                if (data.errors && Array.isArray(data.errors)) {
                    throw new Error(data.errors.join(', '));
                }
                throw new Error(data.message || 'Failed to submit request');
            }

            setSuccess('true');
            setCreatedRequestNumber(data.data.requestNumber);
            (e.target as HTMLFormElement).reset();
            setConfirmed(false);
        } catch (err: any) {
            console.error('Submission error:', err);
            setError(err.message || 'An error occurred while submitting your request');
        } finally {
            setLoading(false);
        }
    };



    const handleReset = () => {
        setSuccess('');
        setCreatedRequestNumber(null);
        setConfirmed(false);
        setError('');
    };

    if (success) {
        return (
            <SuccessfullDialog
                requestNumber={createdRequestNumber}
                onDone={handleReset}
            />
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-12">
            {error && (
                <div className="p-4 bg-danger-50 border border-danger-200 rounded-2xl text-danger-700 animate-fade-in text-sm font-medium font-['Rubik']">
                    {error}
                </div>
            )}

            {/* Pass Permit Info Section */}
            <section>
                <h3 className="text-[#00B09C] font-normal mb-6 text-[14px] capitalize font-['Rubik'] leading-[21px]">
                    {t('sections.passPermitInfo')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-[28px]">
                    <Select
                        name="requestType"
                        label={t('fields.passType')}
                        options={[
                            { value: '', label: t('placeholders.selectPassType') },
                            { value: 'VISITOR', label: 'Visitor Pass' },
                            { value: 'CONTRACTOR', label: 'Contractor Pass' },
                            { value: 'EMPLOYEE', label: 'Employee Pass' },
                            { value: 'VEHICLE', label: 'Vehicle Pass' },
                        ]}
                        required
                    />
                    <Select
                        name="nationality"
                        label={t('fields.nationality')}
                        options={[
                            { value: '', label: t('placeholders.select') },
                            { value: 'OMAN', label: 'Omani' },
                            { value: 'OTHER', label: 'Other' },
                        ]}
                        required
                    />
                    <Select
                        name="identification"
                        label={t('fields.identification')}
                        options={[
                            { value: '', label: t('placeholders.select') },
                            { value: 'ID', label: 'ID Card' },
                            { value: 'PASSPORT', label: 'Passport' },
                        ]}
                        required
                    />
                    <Input
                        name="organization"
                        label={t('fields.organization')}
                        placeholder={t('placeholders.typeOrganization')}
                        required
                    />
                    <Input
                        name="dateOfVisit"
                        type="date"
                        label={t('fields.passStartingDate')}
                        placeholder={t('placeholders.selectDate')}
                        required
                        rightIcon={
                            <svg className="w-6 h-6 text-[#747474]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        }
                    />
                    <Select
                        name="validityPeriod"
                        label={t('fields.validityPeriod')}
                        options={[
                            { value: '', label: t('placeholders.selectDate') },
                            { value: '1_DAY', label: '1 Day' },
                            { value: '1_WEEK', label: '1 Week' },
                            { value: '1_MONTH', label: '1 Month' },
                        ]}
                        required
                    />
                    <Select
                        name="passFor"
                        label={t('fields.passFor')}
                        options={[
                            { value: '', label: t('placeholders.selectBeneficiary') },
                            { value: 'SELF', label: 'Self' },
                            { value: 'OTHER', label: 'Other' },
                        ]}
                        required
                    />
                    <Input
                        name="purposeOfVisit"
                        label={t('fields.purposeOfVisit')}
                        placeholder={t('placeholders.typePurpose')}
                        required
                    />
                </div>
            </section>

            {/* Pass Holder Info Section */}
            <section>
                <h3 className="text-[#00B09C] font-normal mb-6 text-[14px] capitalize font-['Rubik'] leading-[21px]">
                    {t('sections.passHolderInfo')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-[28px]">
                    <Input
                        name="applicantName"
                        label={t('fields.fullNameEn')}
                        placeholder={t('placeholders.enterFullName')}
                        required
                        rightIcon={
                            <svg className="w-6 h-6 text-[#747474]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        }
                    />
                    <Input
                        name="fullNameAr"
                        label={t('fields.fullNameAr')}
                        placeholder={t('placeholders.enterFullName')}
                        required
                        rightIcon={
                            <svg className="w-6 h-6 text-[#747474]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        }
                    />
                    <Input
                        name="telephone"
                        label={t('fields.telephone')}
                        placeholder={t('placeholders.telephoneHolder')}
                        required
                        rightIcon={
                            <svg className="w-6 h-6 text-[#747474]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                        }
                    />
                    <Input
                        name="applicantEmail"
                        type="email"
                        label={t('fields.email')}
                        placeholder={t('placeholders.emailHolder')}
                        required
                        rightIcon={
                            <svg className="w-6 h-6 text-[#747474]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        }
                    />
                    <Select
                        name="gender"
                        label={t('fields.gender')}
                        options={[
                            { value: '', label: t('placeholders.select') },
                            { value: 'MALE', label: 'Male' },
                            { value: 'FEMALE', label: 'Female' },
                        ]}
                        required
                    />
                    <Select
                        name="profession"
                        label={t('fields.profession')}
                        options={[
                            { value: '', label: t('placeholders.select') },
                            { value: 'ENGINEER', label: 'Engineer' },
                            { value: 'TECHNICIAN', label: 'Technician' },
                            { value: 'VISITOR', label: 'Visitor' },
                        ]}
                        required
                    />
                    <Input
                        name="passportIdNumber"
                        label={t('fields.idPassportNumber')}
                        placeholder={t('placeholders.typeIdPassport')}
                        required
                    />
                    <FileUpload
                        id="passportIdImage"
                        name="passportIdImage"
                        label={t('fields.copyOfCivilId')}
                        placeholder="Choose File (PNG, JPG, PDF) max 1MB"
                        required
                    />
                    <FileUpload
                        id="otherDocuments1"
                        name="otherDocuments1"
                        label={t('fields.otherDocuments1')}
                        placeholder="Choose File (PNG, JPG, PDF) max 1MB"
                    />
                    <FileUpload
                        id="otherDocuments2"
                        name="otherDocuments2"
                        label={t('fields.otherDocuments2')}
                        placeholder="Choose File (PNG, JPG, PDF) max 1MB"
                    />
                </div>
            </section>

            {/* Confirmation and Submit Section */}
            <div className="flex flex-col items-center gap-10 pt-10 w-full">

                {/* Checkbox Wrapper - Aligned to the start/left */}
                <label className="flex items-center gap-3 cursor-pointer group w-full max-w-4xl self-start">
                    <div className="relative flex items-center mt-1">
                        <input
                            type="checkbox"
                            className="peer h-6 w-6 cursor-pointer appearance-none rounded border-2 border-[#00B09C] checked:bg-[#00B09C] transition-all"
                            checked={confirmed}
                            onChange={(e) => setConfirmed(e.target.checked)}
                        />
                        <svg
                            className="absolute h-4 w-4 pointer-events-none hidden peer-checked:block text-white left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="4"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <span className="text-[14px] text-[#747474] leading-[21px] font-['Rubik'] capitalize">
                        {t('confirmation')}
                    </span>
                </label>

                {/* Submit Button - Centered */}
                <button
                    type="submit"
                    disabled={loading || !confirmed}
                    className={`
            flex items-center justify-center px-16 py-4 bg-[#00B09C] text-white rounded-full 
            text-[22px] md:text-[28px] font-medium font-['Rubik'] transition-all shadow-md 
            hover:shadow-xl hover:bg-[#009686] active:scale-[0.98] 
            disabled:opacity-50 disabled:cursor-not-allowed
            min-w-[320px] md:min-w-[440px] h-[70px] md:h-[84px]
        `.trim()}
                >
                    {loading ? (
                        <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        t('submit')
                    )}
                </button>
            </div>
        </form>
    );
};


