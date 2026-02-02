'use client';

import React, { useState, useEffect } from 'react';
import { Input, Select } from '@/components/ui/Input';
import { Textarea } from '../ui/Textarea';
import { FileUpload } from '@/components/ui/FileUpload';
import enMessages from '../../../messages/en.json';
import arMessages from '../../../messages/ar.json';
import { useLocale } from 'next-intl';

import { SuccessfullDialog } from '../ui/SuccessfullDialog';

interface FieldErrors {
    [key: string]: string;
}

interface PassType {
    id: number;
    name_en: string;
    name_ar: string;
    is_active: boolean;
}

export const GatePassForm: React.FC = () => {
    const locale = useLocale();
    const [passTypes, setPassTypes] = useState<PassType[]>([]);
    const [loadingPassTypes, setLoadingPassTypes] = useState(true);

    // Fetch pass types from database
    useEffect(() => {
        const fetchPassTypes = async (retryCount = 0) => {
            const MAX_RETRIES = 2;
            const RETRY_DELAY = 1000; // 1 second

            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

                const response = await fetch('/api/pass-types', {
                    signal: controller.signal,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                clearTimeout(timeoutId);

                if (response.ok) {
                    const contentType = response.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        const result = await response.json();
                        setPassTypes(result.data || []);
                    } else {
                        throw new Error('Invalid response format');
                    }
                } else {
                    // If server error and we haven't exceeded retries, retry
                    if (response.status >= 500 && retryCount < MAX_RETRIES) {
                        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
                        return fetchPassTypes(retryCount + 1);
                    }
                    const errorData = await response.json().catch(() => ({}));
                    console.error('Error fetching pass types:', errorData.message || 'Failed to fetch pass types');
                    setPassTypes([]); // Set empty array as fallback
                }
            } catch (error: any) {
                console.error('Error fetching pass types:', error);

                // Retry on network errors
                if (
                    (error.name === 'AbortError' ||
                        error.message?.includes('ERR_CONNECTION_RESET') ||
                        error.message?.includes('Failed to fetch') ||
                        error.message?.includes('NetworkError')) &&
                    retryCount < MAX_RETRIES
                ) {
                    console.log(`Retrying fetch pass types (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
                    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
                    return fetchPassTypes(retryCount + 1);
                }

                // Set empty array as fallback on final failure
                setPassTypes([]);
            } finally {
                setLoadingPassTypes(false);
            }
        };

        fetchPassTypes();
    }, []);

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
    const [organizationValue, setOrganizationValue] = useState('');
    const [selectedPassType, setSelectedPassType] = useState<PassType | null>(null);
    const [passEndDate, setPassEndDate] = useState('');

    const isPermanent = (pt: PassType | null) => {
        if (!pt) return false;
        const nameEn = pt.name_en.toLowerCase();
        const nameAr = pt.name_ar;
        return nameEn.includes('permanent') || nameAr.includes('دائم');
    };

    const ORGANIZATION_PREFIX = 'مجيس للخدمات الصناعية / Majis Industrial Services';

    const getFieldLabel = (name: string): string => {
        const fieldMap: { [key: string]: string } = {
            'passTypeId': 'passType',
            'requestType': 'requestType',
            'dateOfVisit': 'passStartingDate',
            'applicantName': 'fullNameEn',
            'applicantEmail': 'email',
            'passportIdImage': 'copyOfCivilId',
            'passportIdNumber': 'idPassportNumber',
            'otherDocuments1': 'otherDocuments1',
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

        // Required fields validation (excluding fields with specific validation)
        const requiredFields = [
            { name: 'nationality', value: formData.get('nationality') },
            { name: 'identification', value: formData.get('identification') },
            { name: 'organization', value: formData.get('organization') },
            // validityPeriod is now conditionally validated later
            { name: 'passFor', value: formData.get('passFor') },
            { name: 'applicantName', value: formData.get('applicantName') },
            { name: 'fullNameAr', value: formData.get('fullNameAr') },
            { name: 'applicantEmail', value: formData.get('applicantEmail') },
            { name: 'gender', value: formData.get('gender') },
            { name: 'profession', value: formData.get('profession') },
        ];

        requiredFields.forEach(({ name, value }) => {
            const error = validateField(name, value as string, true);
            if (error) {
                newFieldErrors[name] = error;
                isValid = false;
            }
        });

        // Date of Visit validation (required and must not be in the past)
        const dateOfVisit = formData.get('dateOfVisit') as string;
        if (!dateOfVisit || dateOfVisit.trim() === '') {
            const fieldLabel = getFieldLabel('dateOfVisit');
            newFieldErrors['dateOfVisit'] = `${fieldLabel} ${getBilingualNested(['errors', 'required'])}`;
            isValid = false;
        } else {
            const selectedDate = new Date(dateOfVisit);
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison
            selectedDate.setHours(0, 0, 0, 0);

            if (selectedDate < today) {
                newFieldErrors['dateOfVisit'] = getBilingualNested(['errors', 'invalidDate']);
                isValid = false;
            }

            // 4-month rule for permanent passes
            if (isPermanent(selectedPassType)) {
                const passEndDateValue = formData.get('passEndDate') as string;
                if (!passEndDateValue) {
                    newFieldErrors['passEndDate'] = getBilingualNested(['errors', 'required']) || 'is required';
                    isValid = false;
                } else {
                    const endDate = new Date(passEndDateValue);
                    const minEndDate = new Date(selectedDate);
                    minEndDate.setMonth(minEndDate.getMonth() + 4);

                    if (endDate < minEndDate) {
                        newFieldErrors['passEndDate'] = locale === 'ar'
                            ? 'يجب أن تكون فترة الصلاحية ٤ أشهر على الأقل'
                            : 'Validity period must be at least 4 months';
                        isValid = false;
                    }
                }
            } else {
                // Validity period required for temporary passes
                const validityPeriod = formData.get('validityPeriod') as string;
                if (!validityPeriod || validityPeriod.trim() === '') {
                    newFieldErrors['validityPeriod'] = getBilingualNested(['errors', 'validityPeriodRequired']) || 'is required';
                    isValid = false;
                }
            }
        }

        // Pass Type validation (from database)
        const passTypeId = formData.get('passTypeId') as string;
        if (!passTypeId || passTypeId.trim() === '') {
            newFieldErrors['passTypeId'] = getBilingualNested(['errors', 'validPassTypeRequired']);
            isValid = false;
        }

        // Request Type validation (VISITOR, CONTRACTOR, EMPLOYEE, VEHICLE)
        const requestType = formData.get('requestType') as string;
        const validRequestTypes = ['VISITOR', 'CONTRACTOR', 'EMPLOYEE', 'VEHICLE'];
        if (!requestType || !validRequestTypes.includes(requestType)) {
            newFieldErrors['requestType'] = getBilingualNested(['errors', 'validRequestTypeRequired']);
            isValid = false;
        }

        // Phone validation (minimum 8 characters)
        const telephone = formData.get('telephone') as string;
        if (!telephone || telephone.trim().length < 8) {
            newFieldErrors['telephone'] = getBilingualNested(['errors', 'validPhoneRequired']);
            isValid = false;
        }

        // Passport/ID Number validation (6-20 alphanumeric characters)
        const passportIdNumber = formData.get('passportIdNumber') as string;
        const passportIdRegex = /^[a-zA-Z0-9]{6,20}$/;
        if (!passportIdNumber || !passportIdRegex.test(passportIdNumber.trim())) {
            newFieldErrors['passportIdNumber'] = getBilingualNested(['errors', 'validPassportIdRequired']);
            isValid = false;
        }

        // Purpose of Visit validation (minimum 10 characters)
        const purposeOfVisit = formData.get('purposeOfVisit') as string;
        if (!purposeOfVisit || purposeOfVisit.trim().length < 10) {
            newFieldErrors['purposeOfVisit'] = getBilingualNested(['errors', 'purposeOfVisitRequired']);
            isValid = false;
        }

        // Email validation
        const email = formData.get('applicantEmail') as string;
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newFieldErrors['applicantEmail'] = getBilingualNested(['errors', 'invalidEmail']);
            isValid = false;
        }

        // File validation
        const passportIdImage = formData.get('passportIdImage') as File | null;
        if (!passportIdImage || passportIdImage.size === 0) {
            const fieldLabel = getFieldLabel('passportIdImage');
            newFieldErrors['passportIdImage'] = `${fieldLabel} ${getBilingualNested(['errors', 'required'])}`;
            isValid = false;
        } else {
            // Validate passport ID image size (max 5MB)
            const maxSize = 5 * 1024 * 1024; // 5MB in bytes
            if (passportIdImage.size > maxSize) {
                newFieldErrors['passportIdImage'] = getBilingualNested(['errors', 'fileSizeExceeded']) || 'File size exceeds 5MB limit';
                isValid = false;
            }
            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
            if (!allowedTypes.includes(passportIdImage.type)) {
                newFieldErrors['passportIdImage'] = getBilingualNested(['errors', 'invalidFileType']) || 'Only JPG, PNG, and PDF files are allowed';
                isValid = false;
            }
        }

        // Photo validation (optional but if provided, validate it)
        const photo = formData.get('photo') as File | null;
        if (photo && photo.size > 0) {
            // Validate photo size (max 5MB)
            const maxSize = 5 * 1024 * 1024; // 5MB in bytes
            if (photo.size > maxSize) {
                newFieldErrors['photo'] = getBilingualNested(['errors', 'fileSizeExceeded']) || 'File size exceeds 5MB limit';
                isValid = false;
            }
            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
            if (!allowedTypes.includes(photo.type)) {
                newFieldErrors['photo'] = getBilingualNested(['errors', 'invalidFileType']) || 'Only JPG, PNG, and PDF files are allowed';
                isValid = false;
            }
        }

        // Other Documents validation (optional but if provided, validate them)
        const otherDocuments1 = formData.get('otherDocuments1') as File | null;
        if (otherDocuments1 && otherDocuments1.size > 0) {
            const maxSize = 5 * 1024 * 1024; // 5MB in bytes
            if (otherDocuments1.size > maxSize) {
                newFieldErrors['otherDocuments1'] = getBilingualNested(['errors', 'fileSizeExceeded']) || 'File size exceeds 5MB limit';
                isValid = false;
            }
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
            if (!allowedTypes.includes(otherDocuments1.type)) {
                newFieldErrors['otherDocuments1'] = getBilingualNested(['errors', 'invalidFileType']) || 'Only JPG, PNG, and PDF files are allowed';
                isValid = false;
            }
        }

        const otherDocuments2 = formData.get('otherDocuments2') as File | null;
        if (otherDocuments2 && otherDocuments2.size > 0) {
            const maxSize = 5 * 1024 * 1024; // 5MB in bytes
            if (otherDocuments2.size > maxSize) {
                newFieldErrors['otherDocuments2'] = getBilingualNested(['errors', 'fileSizeExceeded']) || 'File size exceeds 5MB limit';
                isValid = false;
            }
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
            if (!allowedTypes.includes(otherDocuments2.type)) {
                newFieldErrors['otherDocuments2'] = getBilingualNested(['errors', 'invalidFileType']) || 'Only JPG, PNG, and PDF files are allowed';
                isValid = false;
            }
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

        // Combine organization prefix with user input
        const userOrgInput = organizationValue.trim();
        const fullOrganization = userOrgInput
            ? `${ORGANIZATION_PREFIX} + ${userOrgInput}`
            : ORGANIZATION_PREFIX;
        formData.set('organization', fullOrganization);

        // Validate all fields
        if (!validateForm(formData)) {
            setError(getBilingualNested(['errors', 'fixErrors']));
            // Scroll to first error after state update
            setTimeout(() => {
                // Get the first error field from the updated state
                const errorFields = Object.keys(fieldErrors);
                if (errorFields.length > 0) {
                    const firstErrorField = errorFields[0];
                    // Try to find the input/select/file input
                    const element = document.querySelector(`[name="${firstErrorField}"]`) ||
                        document.querySelector(`#${firstErrorField}`) ||
                        document.querySelector(`label[for="${firstErrorField}"]`);
                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
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

            // Check if response is JSON before parsing
            const contentType = response.headers.get('content-type');
            let data: any = {};

            if (contentType && contentType.includes('application/json')) {
                try {
                    data = await response.json();
                } catch (jsonError) {
                    console.error('JSON parse error:', jsonError);
                    setError(getBilingualNested(['errors', 'submissionFailed']) || 'Failed to process server response. Please try again.');
                    return;
                }
            } else {
                // If not JSON, try to get text response
                const textResponse = await response.text();
                console.error('Non-JSON response:', textResponse);
                setError(getBilingualNested(['errors', 'submissionFailed']) || `Server error: ${response.status} ${response.statusText}. Please try again.`);
                return;
            }

            if (!response.ok) {
                // If there are validation errors array, display them
                if (data.errors && Array.isArray(data.errors)) {
                    setErrors(data.errors);
                    setError(data.message || getBilingualNested(['errors', 'fixErrors']));
                    return;
                }
                // Single error message
                const errorMessage = data.message || data.error || getBilingualNested(['errors', 'submissionFailed']);
                setError(errorMessage);
                return;
            }

            // Success
            setSuccess('true');
            setCreatedRequestNumber(data.data?.requestNumber || null);
            (e.target as HTMLFormElement).reset();
            setOrganizationValue('');
            setSelectedPassType(null);
            setPassEndDate('');
            setConfirmed(false);
        } catch (err: any) {
            console.error('Submission error:', err);
            // Handle network errors or other fetch errors
            if (err instanceof TypeError && err.message.includes('fetch')) {
                setError(getBilingualNested(['errors', 'submissionFailed']) || 'Network error. Please check your connection and try again.');
            } else {
                setError(err.message || getBilingualNested(['errors', 'submissionFailed']) || 'An unexpected error occurred. Please try again.');
            }
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
        setSelectedPassType(null);
        setPassEndDate('');
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
                        name="passTypeId"
                        label={getBilingualNested(['fields', 'passType'])}
                        error={fieldErrors.passTypeId}
                        options={[
                            { value: '', label: getBilingualNested(['placeholders', 'selectPassType']) },
                            ...passTypes
                                .filter(pt => pt.is_active)
                                .map((pt) => ({
                                    value: pt.id.toString(),
                                    label: locale === 'ar'
                                        ? pt.name_ar
                                        : `${pt.name_en}${pt.name_ar ? ` / ${pt.name_ar}` : ''}`,
                                })),
                        ]}
                        required
                        disabled={loadingPassTypes}
                        onChange={(e) => {
                            const id = e.target.value;
                            const pt = passTypes.find(p => p.id.toString() === id) || null;
                            setSelectedPassType(pt);
                            // Clear passEndDate if switching back to temporary
                            if (!isPermanent(pt)) {
                                setPassEndDate('');
                            }
                        }}
                    />
                    <Select
                        name="requestType"
                        label={getBilingualNested(['fields', 'requestType'])}
                        error={fieldErrors.requestType}
                        options={[
                            { value: '', label: getBilingualNested(['placeholders', 'select']) },
                            { value: 'VISITOR', label: 'VISITOR' },
                            { value: 'CONTRACTOR', label: 'CONTRACTOR' },
                            { value: 'EMPLOYEE', label: 'EMPLOYEE' },
                            { value: 'VEHICLE', label: 'VEHICLE' },
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

                    <div className="w-full">
                        <label className="block text-sm font-medium text-gray-700 mb-2 font-['Rubik']">
                            {getBilingualNested(['fields', 'organization'])}
                            <span className="text-red-500 ml-1">*</span>
                        </label>
                        <div className="relative flex ">
                            <div className="flex-1">
                                <Input
                                    name="organization"
                                    value={organizationValue}
                                    onChange={(e) => setOrganizationValue(e.target.value)}
                                    placeholder={getBilingualNested(['placeholders', 'typeOrganization']) || 'Type organization name'}
                                    error={fieldErrors.organization}
                                    required
                                />
                            </div>
                        </div>
                        {fieldErrors.organization && (
                            <p className="mt-1 text-sm text-red-600 font-['Rubik']">{fieldErrors.organization}</p>
                        )}
                    </div>

                    <Input
                        name="dateOfVisit"
                        type="date"
                        label={getBilingualNested(['fields', 'passStartingDate'])}
                        placeholder={getBilingualNested(['placeholders', 'selectDate'])}
                        error={fieldErrors.dateOfVisit}
                        required
                        onChange={(e) => {
                            const selectedDate = e.target.value;
                            if (selectedDate) {
                                const date = new Date(selectedDate);
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                date.setHours(0, 0, 0, 0);

                                if (date < today) {
                                    setFieldErrors(prev => ({
                                        ...prev,
                                        dateOfVisit: getBilingualNested(['errors', 'invalidDate'])
                                    }));
                                } else {
                                    setFieldErrors(prev => {
                                        const newErrors = { ...prev };
                                        delete newErrors.dateOfVisit;
                                        return newErrors;
                                    });
                                }
                            }
                        }}
                        rightIcon={
                            <svg className="w-6 h-6 text-[#747474]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        }
                    />
                    {isPermanent(selectedPassType) ? (
                        <Input
                            name="passEndDate"
                            type="date"
                            label={locale === 'ar' ? 'تاريخ انتهاء التصريح' : 'Pass End Date'}
                            value={passEndDate}
                            error={fieldErrors.passEndDate}
                            required
                            onChange={(e) => setPassEndDate(e.target.value)}
                            min={(() => {
                                const dateOfVisit = (document.querySelector('input[name="dateOfVisit"]') as HTMLInputElement)?.value;
                                if (dateOfVisit) {
                                    const date = new Date(dateOfVisit);
                                    date.setMonth(date.getMonth() + 4);
                                    return date.toISOString().split('T')[0];
                                }
                                return undefined;
                            })()}
                            rightIcon={
                                <svg className="w-6 h-6 text-[#747474]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            }
                        />
                    ) : (
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
                    )}
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
                            error={fieldErrors.passportIdImage}
                        />
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


