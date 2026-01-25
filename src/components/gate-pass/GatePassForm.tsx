'use client';

import React, { useState } from 'react';
import { Input, Select } from '@/components/ui/Input';
import { Textarea } from '../ui/Textarea';
import { FileUpload } from '@/components/ui/FileUpload';
import enMessages from '../../../messages/en.json';
import arMessages from '../../../messages/ar.json';

import { SuccessfullDialog } from '../ui/SuccessfullDialog';

interface FieldErrors {
    [key: string]: string;
}

export const GatePassForm: React.FC = () => {
    // Helper for nested keys
    const getBilingualNested = (path: string[]): string => {
        try {
            let enValue: any = enMessages.GatePassPage;
            let arValue: any = arMessages.GatePassPage;
            
            for (const key of path) {
                if (enValue && typeof enValue === 'object') {
                    enValue = enValue[key];
                } else {
                    enValue = undefined;
                }
                
                if (arValue && typeof arValue === 'object') {
                    arValue = arValue[key];
                } else {
                    arValue = undefined;
                }
            }
            
            const enText = typeof enValue === 'string' ? enValue : '';
            const arText = typeof arValue === 'string' ? arValue : '';
            
            if (!enText && !arText) return '';
            if (!enText) return arText;
            if (!arText) return enText;
            return `${enText} / ${arText}`;
        } catch (error) {
            console.error('Error getting bilingual text:', path, error);
            return '';
        }
    };

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [errors, setErrors] = useState<string[]>([]);
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [success, setSuccess] = useState('');
    const [confirmed, setConfirmed] = useState(false);
    const [createdRequestNumber, setCreatedRequestNumber] = useState<string | null>(null);

    const getFieldLabel = (name: string): string => {
        const fieldMap: { [key: string]: string } = {
            'requestType': 'passType',
            'dateOfVisit': 'passStartingDate',
            'applicantName': 'fullNameEn',
            'applicantEmail': 'email',
            'passportIdImage': 'copyOfCivilId',
            'passportIdNumber': 'idPassportNumber',
        };
        const fieldKey = fieldMap[name] || name;
        return getBilingualNested(['fields', fieldKey]) || name;
    };

    const validateField = (name: string, value: string | File | null, required: boolean = true): string => {
        if (required) {
            if (!value || (typeof value === 'string' && value.trim() === '') || (value instanceof File && value.size === 0)) {
                const fieldLabel = getFieldLabel(name);
                return `${fieldLabel} ${getBilingualNested(['errors', 'required'])}`;
            }
        }
        return '';
    };

    const validateForm = (formData: FormData): boolean => {
        const newFieldErrors: FieldErrors = {};
        let isValid = true;

        // Required fields validation
        const requiredFields = [
            { name: 'requestType', value: formData.get('requestType') },
            { name: 'nationality', value: formData.get('nationality') },
            { name: 'identification', value: formData.get('identification') },
            { name: 'organization', value: formData.get('organization') },
            { name: 'dateOfVisit', value: formData.get('dateOfVisit') },
            { name: 'validityPeriod', value: formData.get('validityPeriod') },
            { name: 'passFor', value: formData.get('passFor') },
            { name: 'purposeOfVisit', value: formData.get('purposeOfVisit') },
            { name: 'applicantName', value: formData.get('applicantName') },
            { name: 'fullNameAr', value: formData.get('fullNameAr') },
            { name: 'telephone', value: formData.get('telephone') },
            { name: 'applicantEmail', value: formData.get('applicantEmail') },
            { name: 'gender', value: formData.get('gender') },
            { name: 'profession', value: formData.get('profession') },
            { name: 'passportIdNumber', value: formData.get('passportIdNumber') },
        ];

        requiredFields.forEach(({ name, value }) => {
            const error = validateField(name, value as string, true);
            if (error) {
                newFieldErrors[name] = error;
                isValid = false;
            }
        });

        // Email validation
        const email = formData.get('applicantEmail') as string;
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newFieldErrors['applicantEmail'] = getBilingualNested(['errors', 'invalidEmail']);
            isValid = false;
        }

        // File validation
        const passportIdImage = formData.get('passportIdImage') as File | null;
        if (!passportIdImage || passportIdImage.size === 0) {
            newFieldErrors['passportIdImage'] = getBilingualNested(['errors', 'passportIdRequired']);
            isValid = false;
        }

        setFieldErrors(newFieldErrors);
        return isValid;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        // Clear previous errors
        setError('');
        setErrors([]);
        setFieldErrors({});

        // Validate confirmation
        if (!confirmed) {
            setError(getBilingualNested(['errors', 'confirmRequired']));
            return;
        }

        const formData = new FormData(e.currentTarget);

        // Validate all fields
        if (!validateForm(formData)) {
            setError(getBilingualNested(['errors', 'fixErrors']));
            // Scroll to first error after state update
            setTimeout(() => {
                const firstErrorField = Object.keys(fieldErrors)[0];
                if (firstErrorField) {
                    const element = document.querySelector(`[name="${firstErrorField}"]`);
                    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
            return;
        }

        setLoading(true);
        setError('');
        setErrors([]);
        setFieldErrors({});
        setSuccess('');
        setCreatedRequestNumber(null);

        try {
            const response = await fetch('/api/requests', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                // If there are validation errors array, display them
                if (data.errors && Array.isArray(data.errors)) {
                    setErrors(data.errors);
                    setError(data.message || getBilingualNested(['errors', 'fixErrors']));
                    return;
                }
                // Single error message
                setError(data.message || getBilingualNested(['errors', 'submissionFailed']));
                return;
            }

            // Success
            setSuccess('true');
            setCreatedRequestNumber(data.data?.requestNumber || null);
            (e.target as HTMLFormElement).reset();
            setConfirmed(false);
        } catch (err: any) {
            console.error('Submission error:', err);
            setError(err.message || getBilingualNested(['errors', 'submissionFailed']));
        } finally {
            setLoading(false);
        }
    };



    const handleReset = () => {
        setSuccess('');
        setCreatedRequestNumber(null);
        setConfirmed(false);
        setError('');
        setErrors([]);
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
        <form onSubmit={handleSubmit} className="space-y-8 px-4 sm:px-6 md:px-8 lg:px-10 py-6 md:py-8 max-w-7xl mx-auto">
            {(error || errors.length > 0) && (
                <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg text-red-700 animate-fade-in text-sm font-medium font-['Rubik'] shadow-sm">
                    {error && <p className="mb-2 font-semibold flex items-center gap-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        {error}
                    </p>}
                    {errors.length > 0 && (
                        <ul className="list-disc list-inside space-y-1 ml-2">
                            {errors.map((err, index) => (
                                <li key={index} className="text-sm">{err}</li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            {/* Pass Permit Info Section */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                    <div className="w-1 h-8 bg-[#00B09C] rounded-full"></div>
                    <h3 className=" font-semibold text-lg md:text-xl capitalize font-['Rubik']">
                        {getBilingualNested(['sections', 'passPermitInfo'])}
                    </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6 ">

                    <Select
                        name="requestType"
                        label={getBilingualNested(['fields', 'passType'])}
                        error={fieldErrors.requestType}
                        options={[
                            { value: '', label: getBilingualNested(['placeholders', 'selectPassType']) },
                            { value: 'VISITOR', label: getBilingualNested(['options', 'visitorPass']) },
                            { value: 'CONTRACTOR', label: getBilingualNested(['options', 'contractorPass']) },
                            { value: 'EMPLOYEE', label: getBilingualNested(['options', 'employeePass']) },
                            { value: 'VEHICLE', label: getBilingualNested(['options', 'vehiclePass']) },
                        ]}
                        required
                    />
                    <Select
                        name="nationality"
                        label={getBilingualNested(['fields', 'nationality'])}
                        error={fieldErrors.nationality}
                        options={[
                            { value: '', label: getBilingualNested(['placeholders', 'select']) },
                            { value: 'OMAN', label: getBilingualNested(['options', 'omani']) },
                            { value: 'OTHER', label: getBilingualNested(['options', 'other']) },
                        ]}
                        required
                    />
                    <Select
                        name="identification"
                        label={getBilingualNested(['fields', 'identification'])}
                        error={fieldErrors.identification}
                        
                        options={[
                            { value: '', label: getBilingualNested(['placeholders', 'select']) },
                            { value: 'ID', label: getBilingualNested(['options', 'idCard']) },
                            { value: 'PASSPORT', label: getBilingualNested(['options', 'passport']) },
                        ]}
                        required
                    />
                    <Input
                        name="organization"
                        label={getBilingualNested(['fields', 'organization'])}
                        value="مجيس للخدمات الصناعية / Majis Industrial Services"
                        readOnly
                        className="bg-gray-50 cursor-not-allowed"
                        error={fieldErrors.organization}
                        required
                    />
                  
                    <Input
                        name="dateOfVisit"
                        type="date"
                        label={getBilingualNested(['fields', 'passStartingDate'])}
                        placeholder={getBilingualNested(['placeholders', 'selectDate'])}
                        error={fieldErrors.dateOfVisit}
                        required
                        rightIcon={
                            <svg className="w-6 h-6 text-[#747474]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        }
                    />
                    <Select
                        name="validityPeriod"
                        label={getBilingualNested(['fields', 'validityPeriod'])}
                        error={fieldErrors.validityPeriod}
                        options={[
                            { value: '', label: getBilingualNested(['placeholders', 'selectDate']) },
                            { value: '1_DAY', label: getBilingualNested(['options', 'oneDay']) },
                            { value: '1_WEEK', label: getBilingualNested(['options', 'oneWeek']) },
                            { value: '1_MONTH', label: getBilingualNested(['options', 'oneMonth']) },
                        ]}
                        required
                    />
                    <Select
                        name="passFor"
                        label={getBilingualNested(['fields', 'passFor'])}
                        error={fieldErrors.passFor}
                        options={[
                            { value: '', label: getBilingualNested(['placeholders', 'selectBeneficiary']) },
                            { value: 'SELF', label: getBilingualNested(['options', 'self']) },
                            { value: 'OTHER', label: getBilingualNested(['options', 'other']) },
                        ]}
                        required
                    />
                    <Textarea
                        name="purposeOfVisit"
                        label={getBilingualNested(['fields', 'purposeOfVisit'])}
                        placeholder={getBilingualNested(['placeholders', 'typePurpose'])}
                        error={fieldErrors.purposeOfVisit}
                        rows={4}
                        required
                    />
                </div>
            </section>

            {/* Pass Holder Info Section */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                    <div className="w-1 h-8 bg-[#00B09C] rounded-full"></div>
                    <h3 className=" font-semibold text-lg md:text-xl capitalize font-['Rubik']">
                        {getBilingualNested(['sections', 'passHolderInfo'])}
                    </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6 text-gray-900">
                    <Input
                        name="applicantName"
                        label={getBilingualNested(['fields', 'fullNameEn'])}
                        placeholder={getBilingualNested(['placeholders', 'enterFullName'])}
                        error={fieldErrors.applicantName}
                        required
                        rightIcon={
                            <svg className="w-6 h-6 text-[#747474]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        }
                    />
                    <Input
                        name="fullNameAr"
                        label={getBilingualNested(['fields', 'fullNameAr'])}
                        placeholder={getBilingualNested(['placeholders', 'enterFullName'])}
                        error={fieldErrors.fullNameAr}
                        required
                        rightIcon={
                            <svg className="w-6 h-6 text-[#747474]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        }
                    />
                    <Input
                        name="telephone"
                        label={getBilingualNested(['fields', 'telephone'])}
                        placeholder={getBilingualNested(['placeholders', 'telephoneHolder'])}
                        error={fieldErrors.telephone}
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
                        label={getBilingualNested(['fields', 'email'])}
                        placeholder={getBilingualNested(['placeholders', 'emailHolder'])}
                        error={fieldErrors.applicantEmail}
                        required
                        rightIcon={
                            <svg className="w-6 h-6 text-[#747474]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        }
                    />
                    <Select
                        name="gender"
                        label={getBilingualNested(['fields', 'gender'])}
                        error={fieldErrors.gender}
                        options={[
                            { value: '', label: getBilingualNested(['placeholders', 'select']) },
                            { value: 'MALE', label: getBilingualNested(['options', 'male']) },
                            { value: 'FEMALE', label: getBilingualNested(['options', 'female']) },
                        ]}
                        required
                    />
                    <Select
                        name="profession"
                        label={getBilingualNested(['fields', 'profession'])}
                        error={fieldErrors.profession}
                        options={[
                            { value: '', label: getBilingualNested(['placeholders', 'select']) },
                            { value: 'ENGINEER', label: getBilingualNested(['options', 'engineer']) },
                            { value: 'TECHNICIAN', label: getBilingualNested(['options', 'technician']) },
                            { value: 'VISITOR', label: getBilingualNested(['options', 'visitor']) },
                            { value: 'TECHNICAL', label: getBilingualNested(['options', 'technical']) },
                            { value: 'MANAGER', label: getBilingualNested(['options', 'manager']) },
                            { value: 'ADMINISTRATOR', label: getBilingualNested(['options', 'administrator']) },
                            { value: 'OTHER', label: getBilingualNested(['options', 'other']) },
                        ]}
                        required
                    />
                    <Input
                        name="otherProfessions"
                        label={getBilingualNested(['fields', 'otherProfessions'])}
                        placeholder={getBilingualNested(['placeholders', 'otherProfessions'])}
                    />
                    <Select
                        name="bloodType"
                        label={getBilingualNested(['fields', 'bloodType'])}
                        options={[
                            { value: '', label: getBilingualNested(['placeholders', 'select']) },
                            { value: 'O+', label: 'O+' },
                            { value: 'O-', label: 'O-' },
                            { value: 'A+', label: 'A+' },
                            { value: 'A-', label: 'A-' },
                            { value: 'B+', label: 'B+' },
                            { value: 'B-', label: 'B-' },
                            { value: 'AB+', label: 'AB+' },
                            { value: 'AB-', label: 'AB-' },
                        ]}
                    />
                    <Input
                        name="passportIdNumber"
                        label={getBilingualNested(['fields', 'idPassportNumber'])}
                        placeholder={getBilingualNested(['placeholders', 'typeIdPassport'])}
                        error={fieldErrors.passportIdNumber}
                        required
                    />
                    <div className="w-full">
                        <FileUpload
                            id="passportIdImage"
                            name="passportIdImage"
                            label={getBilingualNested(['fields', 'copyOfCivilId'])}
                            placeholder={getBilingualNested(['placeholders', 'chooseFile'])}
                            required
                        />
                        {fieldErrors.passportIdImage && (
                            <p className="mt-1.5 text-[12px] text-danger-600 font-medium font-['Rubik']">{fieldErrors.passportIdImage}</p>
                        )}
                    </div>
                    <FileUpload
                        id="photo"
                        name="photo"
                        label={getBilingualNested(['fields', 'photo'])}
                        placeholder={getBilingualNested(['placeholders', 'choosePhoto'])}
                    />
                    <FileUpload
                        id="otherDocuments1"
                        name="otherDocuments1"
                        label={getBilingualNested(['fields', 'otherDocuments1'])}
                        placeholder={getBilingualNested(['placeholders', 'chooseFile'])}
                    />
                    <FileUpload
                        id="otherDocuments2"
                        name="otherDocuments2"
                        label={getBilingualNested(['fields', 'otherDocuments2'])}
                        placeholder={getBilingualNested(['placeholders', 'chooseFile'])}
                    />
                </div>
            </section>

            {/* Confirmation and Submit Section */}
            <div className="flex flex-col items-center gap-6 md:gap-10 pt-6 md:pt-10 w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">

                {/* Checkbox Wrapper - Aligned to the start/left */}
                <label htmlFor="confirmation-checkbox" className="flex items-center gap-3 cursor-pointer group w-full max-w-4xl self-start">
                    <div className="relative flex items-center mt-1">
                        <input
                            id="confirmation-checkbox"
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
                        {getBilingualNested(['confirmation'])}
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
                        getBilingualNested(['submit'])
                    )}
                </button>
            </div>
        </form>
    );
};


