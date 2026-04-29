'use client';

import React, { useState, useEffect, useActionState } from 'react';
import { Input, Select } from '@/components/ui/Input';
import { Textarea } from '../ui/Textarea';
import { FileUpload } from '@/components/ui/FileUpload';
import enMessages from '../../../messages/en.json';
import arMessages from '../../../messages/ar.json';


import { SuccessfullDialog } from '../ui/SuccessfullDialog';
import { compressImage } from '@/utils/helpers';

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

    const [passTypes, setPassTypes] = useState<PassType[]>([]);
    const [loadingPassTypes, setLoadingPassTypes] = useState(true);
    const [applicantPhone, setApplicantPhone] = useState("+96892104795"); // Default fallback
    // const [state , action ] = useActionState();

    // Fetch settings
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await fetch('/api/settings/applicant_phone');
                if (response.ok) {
                    const data = await response.json();
                    setApplicantPhone(data.value);
                }
            } catch (error) {
                console.error('Error fetching applicant phone:', error);
            }
        };
        fetchSettings();
    }, []);

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
    const [entityType, setEntityType] = useState<string>('port');
    const [dateOfVisit, setDateOfVisit] = useState('');
    const [passEndDate, setPassEndDate] = useState('');
    const [professionValue, setProfessionValue] = useState('');


    const isPermanent = (pt: PassType | null) => {
        if (!pt) return false;
        const nameEn = pt.name_en.toLowerCase();
        const nameAr = pt.name_ar;
        return nameEn.includes('permanent') || nameAr.includes('دائم');
    };

    const ORGANIZATION_PREFIX = 'مجيس للخدمات الصناعية ';

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
            'otherDocuments2': 'otherDocuments2',
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

    const validateForm = (formData: FormData): { isValid: boolean; errors: FieldErrors } => {
        const newFieldErrors: FieldErrors = {};
        let isValid = true;

        // Required fields validation (excluding fields with specific validation)
        const requiredFields = [
            { name: 'nationality', value: formData.get('nationality') },
            { name: 'identification', value: formData.get('identification') },
            { name: 'organization', value: formData.get('organization') },
            // visitduration is now conditionally validated later
            { name: 'passFor', value: formData.get('passFor') },
            { name: 'entityType', value: formData.get('entityType') },
            // English name is required for Freezone (all types) OR Port (Permanent only)
            ...((entityType === 'freezone' || (entityType === 'port' && isPermanent(selectedPassType)))
                ? [{ name: 'applicantName', value: formData.get('applicantName') }]
                : []),
            { name: 'fullNameAr', value: formData.get('fullNameAr') },
            { name: 'applicantEmail', value: formData.get('applicantEmail') },
            { name: 'gender', value: formData.get('gender') },
            { name: 'profession', value: formData.get('profession') },
            ...(formData.get('profession') === 'Other' ? [{ name: 'otherProfessions', value: formData.get('otherProfessions') }] : []),
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

            // end_date rule: > 3 months and < 2 years for permanent passes
            if (isPermanent(selectedPassType)) {
                const passEndDateValue = formData.get('passEndDate') as string;
                if (!passEndDateValue) {
                    newFieldErrors['passEndDate'] = `${getBilingualNested(['fields', 'passEndDate'])} ${getBilingualNested(['errors', 'required'])}`;
                    isValid = false;
                } else {
                    const endDate = new Date(passEndDateValue);
                    endDate.setHours(0, 0, 0, 0);
                    const startDate = new Date(dateOfVisit);
                    startDate.setHours(0, 0, 0, 0);

                    // Requirement: > 3 months and < 2 years
                    const minEndDate = new Date(startDate);
                    minEndDate.setMonth(minEndDate.getMonth() + 3);
                    minEndDate.setDate(minEndDate.getDate() + 1); // strictly greater than 3 months

                    const maxEndDate = new Date(startDate);
                    maxEndDate.setFullYear(maxEndDate.getFullYear() + 2);
                    maxEndDate.setHours(0, 0, 0, 0);

                    if (endDate < minEndDate || endDate >= maxEndDate) {
                        newFieldErrors['passEndDate'] = getBilingualNested(['errors', 'passEndDateInvalidRange']) || 'Pass End Date must be greater than 3 months and less than 2 years from today';
                        isValid = false;
                    }
                }
            } else {
                // Visit Duration and required for temporary passes
                const visitduration = formData.get('visitduration') as string;
                if (!visitduration || visitduration.trim() === '') {
                    newFieldErrors['visitduration'] = getBilingualNested(['errors', 'visitdurationRequired']) || 'is required';
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

        // Identification Card validation (Resident, Not Resident)
        const requestType = formData.get('requestType') as string;
        const validRequestTypes = ['Resident', 'Not Resident'];
        if (!requestType || !validRequestTypes.includes(requestType)) {
            newFieldErrors['requestType'] = getBilingualNested(['errors', 'validRequestTypeRequired']);
            isValid = false;
        }


        // Passport/ID Number validation (6-20 alphanumeric characters)
        const passportIdNumber = formData.get('passportIdNumber') as string;
        const passportIdRegex = /^[a-zA-Z0-9]{6,20}$/;
        if (!passportIdNumber || !passportIdRegex.test(passportIdNumber.trim())) {
            newFieldErrors['passportIdNumber'] = getBilingualNested(['errors', 'validPassportIdRequired']);
            isValid = false;
        }

        // Purpose of Visit validation:
        // - Temporary: no minimum length check
        // - Permanent: minimum 10 characters
        const purposeOfVisit = formData.get('purposeOfVisit') as string;
        if (!purposeOfVisit || purposeOfVisit.trim() === '') {
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
            // Validate passport ID image size (max 2MB)
            const maxSize = 2 * 1024 * 1024; // 2MB in bytes
            if (passportIdImage.size > maxSize) {
                newFieldErrors['passportIdImage'] = (getBilingualNested(['errors', 'fileSizeExceeded']) || 'File size exceeds limit') + ' (2MB)';
                isValid = false;
            }
            // Validate file type (robust: check both MIME type and extension)
            const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
            const allowedExts = ['jpg', 'jpeg', 'png', 'pdf'];
            const fileExt = passportIdImage.name.split('.').pop()?.toLowerCase().trim();

            const isMimeTypeValid = allowedMimeTypes.includes(passportIdImage.type);
            const isExtValid = fileExt && allowedExts.includes(fileExt);

            if (!isMimeTypeValid && !isExtValid) {
                newFieldErrors['passportIdImage'] = getBilingualNested(['errors', 'invalidFileType']) || 'Only JPG, PNG, and PDF files are allowed';
                isValid = false;
            }
        }

        // Photo validation (optional but if provided, validate it)
        const photo = formData.get('photo') as File | null;
        if (photo && photo.size > 0) {
            // Validate photo size (max 250KB)
            const maxSize = 250 * 1024; // 250KB in bytes
            if (photo.size > maxSize) {
                newFieldErrors['photo'] = (getBilingualNested(['errors', 'fileSizeExceeded']) || 'File size exceeds limit') + ' (250KB)';
                isValid = false;
            }
            // Validate file type (jpg, png only)
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
            if (!allowedTypes.includes(photo.type)) {
                newFieldErrors['photo'] = getBilingualNested(['errors', 'invalidFileType']) || 'Only JPG and PNG files are allowed';
                isValid = false;
            }
        }

        // Other Documents validation
        const otherDocuments1 = formData.get('otherDocuments1') as File | null;
        const permanentPass = isPermanent(selectedPassType);

        // Required for permanent passes
        if (permanentPass && (!otherDocuments1 || otherDocuments1.size === 0)) {
            const fieldLabel = getFieldLabel('otherDocuments1');
            newFieldErrors['otherDocuments1'] = `${fieldLabel} ${getBilingualNested(['errors', 'required'])}`;
            isValid = false;
        } else if (otherDocuments1 && otherDocuments1.size > 0) {
            const maxSize = 2 * 1024 * 1024; // 2MB in bytes
            if (otherDocuments1.size > maxSize) {
                newFieldErrors['otherDocuments1'] = (getBilingualNested(['errors', 'fileSizeExceeded']) || 'File size exceeds limit') + ' (2MB)';
                isValid = false;
            }
            const allowedTypes = ['pdf'];
            const fileExt = otherDocuments1.name.split('.').pop()?.toLowerCase().trim();
            if (!fileExt || !allowedTypes.includes(fileExt)) {
                newFieldErrors['otherDocuments1'] = 'Only PDF files are allowed.';
                isValid = false;
            }
        }

        const otherDocuments2 = formData.get('otherDocuments2') as File | null;

        // Required for permanent passes
        if (permanentPass && (!otherDocuments2 || otherDocuments2.size === 0)) {
            const fieldLabel = getFieldLabel('otherDocuments2');
            newFieldErrors['otherDocuments2'] = `${fieldLabel} ${getBilingualNested(['errors', 'required'])}`;
            isValid = false;
        } else if (otherDocuments2 && otherDocuments2.size > 0) {
            const maxSize = 2 * 1024 * 1024; // 2MB in bytes
            if (otherDocuments2.size > maxSize) {
                newFieldErrors['otherDocuments2'] = (getBilingualNested(['errors', 'fileSizeExceeded']) || 'File size exceeds limit') + ' (2MB)';
                isValid = false;
            }
            const allowedTypes = ['pdf'];
            const fileExt = otherDocuments2.name.split('.').pop()?.toLowerCase().trim();
            if (!fileExt || !allowedTypes.includes(fileExt)) {
                newFieldErrors['otherDocuments2'] = 'Only PDF files are allowed.';
                isValid = false;
            }
        }


        setFieldErrors(newFieldErrors);
        return { isValid, errors: newFieldErrors };
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

        setLoading(true);
        const rawFormData = new FormData(e.currentTarget);
        const formData = new FormData();

        // Process each field, compressing images to meet Sohar Port limits
        for (const [key, value] of rawFormData.entries()) {
            if (value instanceof File && (key === 'photo' || key === 'passportIdImage') && value.size > 0) {
                // Photo needs to be tiny (<50-100KB), Passport ID can be slightly larger
                const options = key === 'photo'
                    ? { maxWidth: 300, maxHeight: 300, quality: 0.4 }
                    : { maxWidth: 600, maxHeight: 600, quality: 0.5 };
                const compressedFile = await compressImage(value, options);
                console.log(`Compressed ${key}: ${value.size} -> ${compressedFile.size} bytes`);
                formData.append(key, compressedFile);
            } else {
                formData.append(key, value);
            }
        }

        // Combine organization prefix with user input
        const userOrgInput = organizationValue.trim();
        const fullOrganization = userOrgInput
            ? `${ORGANIZATION_PREFIX} + ${userOrgInput}`
            : ORGANIZATION_PREFIX;
        formData.set('organization', fullOrganization);

        // Validate all fields
        const validation = validateForm(formData);
        if (!validation.isValid) {
            setLoading(false);
            setError(getBilingualNested(['errors', 'fixErrors']));
            // Scroll to first error after state update
            setTimeout(() => {
                // Get the first error field from the returned validation errors
                const errorFields = Object.keys(validation.errors);
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
            setDateOfVisit('');


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
        setDateOfVisit('');
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
        <form onSubmit={handleSubmit} className="space-y-8 px-4 sm:px-6 md:px-8 lg:px-10 py-6 md:py-8 max-w-7xl max-auto">
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
                <div className="grid grid-cols-1 gap-x-6 gap-y-6 ">

                    <Select
                        name="entityType"
                        label={'Entity Type / نوع الجهة'}
                        value={entityType}
                        error={fieldErrors.entityType}
                        options={[
                            { value: 'port', label: 'Port / ميناء' },
                            // { value: 'freezone', label: 'Freezone / المنطقة الحرة' },
                        ]}
                        required
                        onChange={(e) => setEntityType(e.target.value)}
                    />
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
                                    label: `${pt.name_en}${pt.name_ar ? ` / ${pt.name_ar}` : ''}`,
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
                                setDateOfVisit('');
                            } else if (!dateOfVisit) {
                                const today = new Date();
                                const yyyy = today.getFullYear();
                                const mm = String(today.getMonth() + 1).padStart(2, '0');
                                const dd = String(today.getDate()).padStart(2, '0');
                                setDateOfVisit(`${yyyy}-${mm}-${dd}`);
                            }
                        }}
                    />
                    <Select
                        name="requestType"
                        label={getBilingualNested(['fields', 'requestType'])}
                        error={fieldErrors.requestType}
                        options={[
                            { value: '', label: getBilingualNested(['placeholders', 'select']) },
                            { value: 'Resident', label: 'Resident / مقيم' },
                            { value: 'Not Resident', label: 'Not Resident / غير مقيم' },
                        ]}
                        required
                    />
                    <Select
                        name="nationality"

                        label={getBilingualNested(['fields', 'nationality'])}
                        error={fieldErrors.nationality}
                        options={[
                            { value: '', label: getBilingualNested(['placeholders', 'select']) },

                            { value: 'Afghan', label: getBilingualNested(['options', 'afghan']) },
                            { value: 'Algerian', label: getBilingualNested(['options', 'algerian']) },
                            { value: 'Angolan', label: getBilingualNested(['options', 'angolan']) },
                            { value: 'Argentine', label: getBilingualNested(['options', 'Argentine']) },
                            { value: 'Austrian', label: getBilingualNested(['options', 'austrian']) },
                            { value: 'Australian', label: getBilingualNested(['options', 'australian']) },
                            { value: 'Bangladeshi', label: getBilingualNested(['options', 'bangladeshi']) },
                            { value: 'Belarusian', label: getBilingualNested(['options', 'belarusian']) },
                            { value: 'Belgian', label: getBilingualNested(['options', 'belgian']) },
                            { value: 'Bolivian', label: getBilingualNested(['options', 'bolivian']) },

                            { value: 'Bosnian/Herzegovinc', label: getBilingualNested(['options', 'Bosnian/Herzegovinc']) },

                            { value: 'Brazilian', label: getBilingualNested(['options', 'brazilian']) },
                            { value: 'British', label: getBilingualNested(['options', 'british']) },
                            { value: 'Bulgarian', label: getBilingualNested(['options', 'bulgarian']) },
                            { value: 'Cambodian', label: getBilingualNested(['options', 'cambodian']) },
                            { value: 'Cameroonian', label: getBilingualNested(['options', 'cameroonian']) },
                            { value: 'Canadian', label: getBilingualNested(['options', 'canadian']) },

                            { value: 'Central African', label: getBilingualNested(['options', 'central_african']) },

                            { value: 'Chadian', label: getBilingualNested(['options', 'chadian']) },
                            { value: 'Chinese', label: getBilingualNested(['options', 'chinese']) },
                            { value: 'Colombian', label: getBilingualNested(['options', 'colombian']) },

                            { value: 'Costa Rican', label: getBilingualNested(['options', 'costa_rican']) },

                            { value: 'Croatian', label: getBilingualNested(['options', 'croatian']) },
                            { value: 'Czech', label: getBilingualNested(['options', 'czech']) },
                            { value: 'Congolese', label: getBilingualNested(['options', 'congolese']) },
                            { value: 'Danish', label: getBilingualNested(['options', 'danish']) },
                            { value: 'Ecuadorian', label: getBilingualNested(['options', 'ecuadorian']) },
                            { value: 'Egyptian', label: getBilingualNested(['options', 'egyptian']) },
                            { value: 'Salvadoran', label: getBilingualNested(['options', 'salvadoran']) },
                            // { value: 'English', label: getBilingualNested(['options', 'english']) },
                            { value: 'Estonian', label: getBilingualNested(['options', 'estonian']) },
                            { value: 'Ethiopian', label: getBilingualNested(['options', 'ethiopian']) },
                            { value: 'Finnish', label: getBilingualNested(['options', 'finnish']) },
                            { value: 'French', label: getBilingualNested(['options', 'french']) },
                            { value: 'German', label: getBilingualNested(['options', 'german']) },
                            { value: 'Ghanaian', label: getBilingualNested(['options', 'ghanaian']) },
                            { value: 'Greek', label: getBilingualNested(['options', 'greek']) },
                            { value: 'Guatemalan', label: getBilingualNested(['options', 'guatemalan']) },
                            { value: 'Dutch', label: getBilingualNested(['options', 'dutch']) },
                            { value: 'Honduran', label: getBilingualNested(['options', 'honduran']) },
                            { value: 'Hungarian', label: getBilingualNested(['options', 'hungarian']) },
                            { value: 'Icelandic', label: getBilingualNested(['options', 'icelandic']) },
                            { value: 'Indian', label: getBilingualNested(['options', 'indian']) },
                            { value: 'Indonesian', label: getBilingualNested(['options', 'indonesian']) },
                            { value: 'Iranian', label: getBilingualNested(['options', 'iranian']) },
                            { value: 'Iraqi', label: getBilingualNested(['options', 'iraqi']) },
                            { value: 'Irish', label: getBilingualNested(['options', 'irish']) },
                            { value: 'Israeli', label: getBilingualNested(['options', 'israeli']) },
                            { value: 'Italian', label: getBilingualNested(['options', 'italian']) },
                            { value: 'Ivorian', label: getBilingualNested(['options', 'ivorian']) },
                            { value: 'Jamaican', label: getBilingualNested(['options', 'jamaican']) },
                            { value: 'Japanese', label: getBilingualNested(['options', 'japanese']) },
                            { value: 'Jordanian', label: getBilingualNested(['options', 'jordanian']) },
                            { value: 'Kazakh', label: getBilingualNested(['options', 'kazakh']) },

                            { value: 'Kenyan', label: getBilingualNested(['options', 'kenyan']) },
                            // { value: 'Lao', label: getBilingualNested(['options', 'lao']) },
                            // { value: 'Latvian', label: getBilingualNested(['options', 'latvian']) },
                            { value: 'Libyan', label: getBilingualNested(['options', 'libyan']) },
                            { value: 'Lithuanian', label: getBilingualNested(['options', 'lithuanian']) },
                            // { value: 'Malagasy', label: getBilingualNested(['options', 'malagasy']) },
                            { value: 'Malaysian', label: getBilingualNested(['options', 'malaysian']) },
                            // { value: 'Malian', label: getBilingualNested(['options', 'malian']) },
                            // { value: 'Mauritanian', label: getBilingualNested(['options', 'mauritanian']) },
                            { value: 'Mexican', label: getBilingualNested(['options', 'mexican']) },
                            { value: 'Moroccan', label: getBilingualNested(['options', 'moroccan']) },
                            // { value: 'Namibian', label: getBilingualNested(['options', 'namibian']) },

                            // { value: 'New Zealand', label: getBilingualNested(['options', 'new_zealand']) },

                            // { value: 'Nicaraguan', label: getBilingualNested(['options', 'nicaraguan']) },
                            // { value: 'Nigerien', label: getBilingualNested(['options', 'nigerien']) },
                            { value: 'Nigerian', label: getBilingualNested(['options', 'nigerian']) },
                            { value: 'Norwegian', label: getBilingualNested(['options', 'norwegian']) },
                            { value: 'Omani', label: getBilingualNested(['options', 'omani']) },
                            { value: 'Pakistani', label: getBilingualNested(['options', 'pakistani']) },
                            // { value: 'Panamanian', label: getBilingualNested(['options', 'panamanian']) },
                            // { value: 'Paraguayan', label: getBilingualNested(['options', 'paraguayan']) },
                            { value: 'Peruvian', label: getBilingualNested(['options', 'peruvian']) },
                            { value: 'Philippine', label: getBilingualNested(['options', 'philippine']) },
                            { value: 'Polish', label: getBilingualNested(['options', 'polish']) },
                            { value: 'Portuguese', label: getBilingualNested(['options', 'portuguese']) },
                            { value: 'Romanian', label: getBilingualNested(['options', 'romanian']) },
                            { value: 'Russian', label: getBilingualNested(['options', 'russian']) },

                            // { value: 'Saudi, Saudi Arabian', label: getBilingualNested(['options', 'saudi_arabian']) },

                            // { value: 'Scottish', label: getBilingualNested(['options', 'scottish']) },
                            { value: 'Senegalese', label: getBilingualNested(['options', 'senegalese']) },
                            { value: 'Serbian', label: getBilingualNested(['options', 'serbian']) },
                            { value: 'Singaporean', label: getBilingualNested(['options', 'singaporean']) },
                            // { value: 'Slovak', label: getBilingualNested(['options', 'slovak']) },
                            // { value: 'Somalian', label: getBilingualNested(['options', 'somalian']) },

                            { value: 'South African', label: getBilingualNested(['options', 'south_african']) },

                            { value: 'Spanish', label: getBilingualNested(['options', 'spanish']) },
                            { value: 'Sudanese', label: getBilingualNested(['options', 'sudanese']) },
                            { value: 'Swedish', label: getBilingualNested(['options', 'swedish']) },
                            { value: 'Swiss', label: getBilingualNested(['options', 'swiss']) },
                            { value: 'Syrian', label: getBilingualNested(['options', 'syrian']) },
                            // { value: 'Thai', label: getBilingualNested(['options', 'thai']) },
                            { value: 'Tunisian', label: getBilingualNested(['options', 'tunisian']) },
                            { value: 'Turkish', label: getBilingualNested(['options', 'turkish']) },
                            // { value: 'Turkmen', label: getBilingualNested(['options', 'turkmen']) },
                            { value: 'Ukranian', label: getBilingualNested(['options', 'ukranian']) },
                            { value: 'Emirati', label: getBilingualNested(['options', 'emirati']) },
                            { value: 'American', label: getBilingualNested(['options', 'american']) },
                            { value: 'Uruguayan', label: getBilingualNested(['options', 'uruguayan']) },
                            { value: 'Vietnamese', label: getBilingualNested(['options', 'vietnamese']) },
                            { value: 'Welsh', label: getBilingualNested(['options', 'welsh']) },
                            { value: 'Zambian', label: getBilingualNested(['options', 'zambian']) },
                            { value: 'Zimbabwean', label: getBilingualNested(['options', 'zimbabwean']) },
                            { value: 'sri_lanka', label: getBilingualNested(['options', 'sri_lanka']) },
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
                        value={dateOfVisit}
                        error={fieldErrors.dateOfVisit}
                        required
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => {
                            const selectedDate = e.target.value;
                            setDateOfVisit(selectedDate);
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
                                    // Re-validate passEndDate against new start date
                                    if (passEndDate) {
                                        const endDate = new Date(passEndDate);
                                        endDate.setHours(0, 0, 0, 0);
                                        const minEnd = new Date(date);
                                        minEnd.setMonth(minEnd.getMonth() + 3);
                                        minEnd.setDate(minEnd.getDate() + 1);
                                        if (endDate < minEnd) {
                                            setFieldErrors(prev => ({
                                                ...prev,
                                                passEndDate: getBilingualNested(['errors', 'passEndDateMin4Months'])
                                            }));
                                        } else {
                                            setFieldErrors(prev => {
                                                const newErrors = { ...prev };
                                                delete newErrors.passEndDate;
                                                return newErrors;
                                            });
                                        }
                                    }
                                }
                            } else {
                                setFieldErrors(prev => {
                                    const newErrors = { ...prev };
                                    delete newErrors.dateOfVisit;
                                    return newErrors;
                                });
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
                            label={getBilingualNested(['fields', 'passEndDate'])}
                            value={passEndDate}
                            error={fieldErrors.passEndDate}
                            required
                            onChange={(e) => {
                                const selectedEndDate = e.target.value;
                                setPassEndDate(selectedEndDate);

                                // Real-time validation: check if end date is at least 4 months after start date
                                if (selectedEndDate) {
                                    const dateOfVisitValue = dateOfVisit;
                                    if (dateOfVisitValue) {
                                        const startDate = new Date(dateOfVisitValue);
                                        startDate.setHours(0, 0, 0, 0);
                                        const endDate = new Date(selectedEndDate);
                                        endDate.setHours(0, 0, 0, 0);

                                        // Calculate minimum end date (4 months after start date)
                                        const minEndDate = new Date(startDate);
                                        minEndDate.setMonth(minEndDate.getMonth() + 3);
                                        minEndDate.setHours(0, 0, 0, 0);

                                        if (endDate < minEndDate) {
                                            setFieldErrors(prev => ({
                                                ...prev,
                                                passEndDate: getBilingualNested(['errors', 'passEndDateMin4Months'])
                                            }));
                                        } else {
                                            setFieldErrors(prev => {
                                                const newErrors = { ...prev };
                                                delete newErrors.passEndDate;
                                                return newErrors;
                                            });
                                        }
                                    }
                                } else {
                                    // Clear error if field is cleared
                                    setFieldErrors(prev => {
                                        const newErrors = { ...prev };
                                        delete newErrors.passEndDate;
                                        return newErrors;
                                    });
                                }
                            }}
                            min={(() => {
                                if (dateOfVisit) {
                                    const date = new Date(dateOfVisit);
                                    date.setMonth(date.getMonth() + 3);
                                    date.setDate(date.getDate() + 1);
                                    return date.toISOString().split('T')[0];
                                }
                                return undefined;
                            })()}
                            max={(() => {
                                if (dateOfVisit) {
                                    const date = new Date(dateOfVisit);
                                    date.setFullYear(date.getFullYear() + 2);
                                    date.setDate(date.getDate() - 1);
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
                            name="visitduration"
                            label={getBilingualNested(['fields', 'visitduration'])}
                            error={fieldErrors.visitduration}
                            options={[
                                { value: '', label: getBilingualNested(['placeholders', 'selectDate']) },
                                { value: '1_DAY', label: getBilingualNested(['options', 'oneDay']) },
                                { value: '2_DAY', label: getBilingualNested(['options', 'twoDay']) },
                                { value: '3_DAY', label: getBilingualNested(['options', 'threeDay']) },
                                { value: '4_DAY', label: getBilingualNested(['options', 'fourDay']) },
                                { value: '5_DAY', label: getBilingualNested(['options', 'fiveDay']) },
                                { value: '10_DAY', label: getBilingualNested(['options', 'tenDay']) },
                                { value: '1_MONTH', label: getBilingualNested(['options', 'oneMonth']) },
                                { value: '2_MONTH', label: getBilingualNested(['options', 'twoMonth']) },
                                { value: '3_MONTH', label: getBilingualNested(['options', 'threeMonth']) },

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
                            ...(isPermanent(selectedPassType)
                                ? [
                                    { value: 'SERVICE_PROVIDER', label: getBilingualNested(['options', 'SERVICE_PROVIDER']) },
                                    { value: 'SUB_CONTRACTOR', label: getBilingualNested(['options', 'SUB_CONTRACTOR']) },
                                    { value: 'EMPLOYEE', label: getBilingualNested(['options', 'EMPLOYEE']) }
                                ]
                                : [
                                    { value: 'VISITOR', label: getBilingualNested(['options', 'VISITOR']) },
                                    { value: 'SERVICE_PROVIDER', label: getBilingualNested(['options', 'SERVICE_PROVIDER']) },
                                    { value: 'SUB_CONTRACTOR', label: getBilingualNested(['options', 'SUB_CONTRACTOR']) }
                                ]
                            )
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
                <div className="grid grid-cols-1 gap-x-6 gap-y-6 text-gray-900">
                    {(entityType === 'freezone' || (entityType === 'port' && isPermanent(selectedPassType))) && (
                        <Input
                            name="applicantName"
                            label={getBilingualNested(['fields', 'fullNameEn'])}
                            placeholder={getBilingualNested(['placeholders', 'enterFullName'])}
                            error={fieldErrors.applicantName}



                            rightIcon={
                                <svg className="w-6 h-6 text-[#747474]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            }
                        />
                    )}
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
                        disabled
                        value={applicantPhone}

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
                        value={professionValue}
                        error={fieldErrors.profession}
                        options={[
                            { value: '', label: getBilingualNested(['placeholders', 'select']) },
                            { value: 'Driver', label: getBilingualNested(['options', 'driver']) },
                            { value: 'Pro', label: getBilingualNested(['options', 'pro']) },
                            { value: 'Administrator', label: getBilingualNested(['options', 'administrator']) },
                            { value: 'Financial', label: getBilingualNested(['options', 'financial']) },
                            { value: 'Technical', label: getBilingualNested(['options', 'technical']) },
                            { value: 'Hr', label: getBilingualNested(['options', 'hr']) },
                            { value: 'Marine', label: getBilingualNested(['options', 'marine']) },
                            { value: 'Security', label: getBilingualNested(['options', 'security']) },
                            { value: 'Marketing', label: getBilingualNested(['options', 'marketing']) },
                            { value: 'Procurement', label: getBilingualNested(['options', 'procurement']) },
                            { value: 'Other', label: getBilingualNested(['options', 'other']) },
                        ]}
                        required
                        onChange={(e) => setProfessionValue(e.target.value)}
                    />
                    {professionValue === 'Other' && (
                        <Input
                            name="otherProfessions"
                            label={getBilingualNested(['fields', 'otherProfessions'])}
                            placeholder={getBilingualNested(['placeholders', 'otherProfessions'])}
                            error={fieldErrors.otherProfessions}
                            required
                        />
                    )}

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
                            placeholder={getBilingualNested(['placeholders', 'choosePhotoOrPdf'])}
                            required
                            accept=".png,.jpg,.jpeg,.pdf"
                            helperText="(jpg, png, pdf) max 2MB"
                            error={fieldErrors.passportIdImage}
                        />
                    </div>
                    <FileUpload
                        id="photo"
                        name="photo"
                        label={getBilingualNested(['fields', 'photo'])}
                        placeholder={getBilingualNested(['placeholders', 'choosePhoto'])}
                        accept=".png,.jpg,.jpeg"
                        helperText="(jpg, png) max 250KB"
                        error={fieldErrors.photo}
                    />
                    <FileUpload
                        id="otherDocuments1"
                        name="otherDocuments1"
                        label={getBilingualNested(['fields', 'otherDocuments1'])}
                        placeholder={getBilingualNested(['placeholders', 'chooseFile'])}
                        accept=".pdf"
                        helperText="(pdf) max 2MB"
                        required={isPermanent(selectedPassType)}
                        error={fieldErrors.otherDocuments1}
                    />

                    <FileUpload
                        id="otherDocuments2"
                        name="otherDocuments2"
                        label={getBilingualNested(['fields', 'otherDocuments2'])}
                        placeholder={getBilingualNested(['placeholders', 'chooseFile'])}
                        accept=".pdf"
                        helperText="(pdf) max 2MB"
                        required={isPermanent(selectedPassType)}
                        error={fieldErrors.otherDocuments2}
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



