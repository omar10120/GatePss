'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { useLocale, useTranslations } from 'next-intl';
import Header from '../../components/Header';
import { Sidebar } from '@/components/layout';
import { getSidebarItems } from '@/config/navigation';
import { Link } from '@/i18n/navigation';

import { RequestHeader } from './components/RequestHeader';
import { InfoSection } from './components/InfoSection';
import { DocumentCard } from './components/DocumentCard';
import { PermitSection } from './components/PermitSection';

interface RequestDetails {
    id: number;
    requestNumber: string;
    applicantNameEn: string;
    applicantNameAr: string;
    applicantEmail: string;
    applicantPhone: string | null;
    gender: string;
    profession: string;
    passportIdNumber: string;
    passportIdImagePath: string | null;
    nationality: string;
    identification: string;
    organization: string;
    validFrom: string;
    validTo: string;
    purposeOfVisit: string;
    dateOfVisit: string;
    requestType: string;
    status: string;
    rejectionReason: string | null;
    passFor: string | null;
    createdAt: string;
    updatedAt: string;
    approvedById: number | null;
    externalReference: string | null;
    lastIntegrationStatusCode: number | null;
    lastIntegrationStatusMessage: string | null;
    approvedBy: {
        id: number;
        name: string;
        email: string;
    } | null;
    uploads: Array<{
        id: number;
        fileType: string;
        filePath: string;
        uploadedAt: string;
    }>;
    logs: Array<{
        id: number;
        timestamp: string;
        actionPerformed: string;
        user: { name: string } | null;
    }>;
}

interface UserData {
    id: number;
    name: string;
    email: string;
    role: string;
    permissions?: string[];
}

export default function RequestDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const requestId = params.id as string;
    const locale = useLocale();
    const isRtl = locale === 'ar';
    const t = useTranslations('Admin.requestDetails');
    const dt = useTranslations('Admin.dashboard');

    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [request, setRequest] = useState<RequestDetails | null>(null);
    const [user, setUser] = useState<UserData | null>(null);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [permissionDenied, setPermissionDenied] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editData, setEditData] = useState<Partial<RequestDetails>>({});

    // Helper function to check if user has a specific permission
    const hasPermission = (permissionKey: string) => {
        if (!user) return false;
        if (user.role === 'SUPER_ADMIN') return true;
        return user.permissions?.includes(permissionKey) || false;
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token) {
            router.push('/admin/login');
            return;
        }

        if (userData) {
            setUser(JSON.parse(userData));
        }


        if (requestId) {
            fetchRequestDetails(token, requestId);
        }

        // Check if edit mode is enabled from URL
        const editParam = searchParams.get('edit');
        setIsEditMode(editParam === 'true');
    }, [requestId, searchParams]);

    // Initialize editData when request is loaded and entering edit mode
    useEffect(() => {
        if (request && isEditMode) {
            // Only initialize if editData is empty or doesn't have the same id
            if (Object.keys(editData).length === 0 || editData.id !== request.id) {
                setEditData({ ...request });
            }
        }
    }, [request, isEditMode]); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchRequestDetails = async (token: string, id: string) => {
        setLoading(true);
        setPermissionDenied(false);
        try {
            const response = await fetch(`/api/admin/requests/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.status === 403) {
                setPermissionDenied(true);
                return;
            }

            if (!response.ok) {
                throw new Error('Failed to fetch request details');
            }

            const result = await response.json();
            setRequest(result.data);
            // Only initialize editData if not in edit mode (to preserve user changes)
            if (!isEditMode) {
                setEditData({ ...result.data });
            } else {
                // If in edit mode, merge with existing editData to preserve user changes
                setEditData(prev => ({ ...result.data, ...prev }));
            }
        } catch (error) {
            console.error('Error fetching request details:', error);
            setError('Failed to load request details');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        const token = localStorage.getItem('token');
        if (!token || !request) return;

        setProcessing(true);
        setError('');
        setSuccess('');

        try {
            // Prepare update data - only include fields that have changed
            const updatePayload: any = {};
            
            if (editData.applicantNameEn && editData.applicantNameEn !== request.applicantNameEn) {
                updatePayload.applicantNameEn = editData.applicantNameEn;
            }
            if (editData.applicantNameAr && editData.applicantNameAr !== request.applicantNameAr) {
                updatePayload.applicantNameAr = editData.applicantNameAr;
            }
            if (editData.applicantEmail && editData.applicantEmail !== request.applicantEmail) {
                updatePayload.applicantEmail = editData.applicantEmail;
            }
            if (editData.applicantPhone !== undefined && editData.applicantPhone !== request.applicantPhone) {
                updatePayload.applicantPhone = editData.applicantPhone;
            }
            if (editData.passportIdNumber && editData.passportIdNumber !== request.passportIdNumber) {
                updatePayload.passportIdNumber = editData.passportIdNumber;
            }
            if (editData.purposeOfVisit && editData.purposeOfVisit !== request.purposeOfVisit) {
                updatePayload.purposeOfVisit = editData.purposeOfVisit;
            }
            if (editData.requestType && editData.requestType !== request.requestType) {
                updatePayload.requestType = editData.requestType;
            }
            if (editData.passFor !== undefined && editData.passFor !== request.passFor) {
                updatePayload.passFor = editData.passFor;
            }
            if (editData.nationality && editData.nationality !== request.nationality) {
                updatePayload.nationality = editData.nationality;
            }
            if (editData.identification && editData.identification !== request.identification) {
                updatePayload.identification = editData.identification;
            }
            if (editData.gender && editData.gender !== request.gender) {
                updatePayload.gender = editData.gender;
            }
            if (editData.profession && editData.profession !== request.profession) {
                updatePayload.profession = editData.profession;
            }
            if (editData.dateOfVisit) {
                updatePayload.dateOfVisit = editData.dateOfVisit;
            }
            if (editData.validFrom) {
                updatePayload.validFrom = editData.validFrom;
            }
            if (editData.validTo) {
                updatePayload.validTo = editData.validTo;
            }

            if (Object.keys(updatePayload).length === 0) {
                setError('No changes to save');
                setProcessing(false);
                return;
            }

            const response = await fetch(`/api/admin/requests/${requestId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatePayload),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to update request');
            }

            setSuccess('Request updated successfully!');
            setIsEditMode(false);
            // Remove edit query parameter from URL
            router.replace(`/admin/requests/${requestId}`);
            fetchRequestDetails(token, requestId);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setProcessing(false);
        }
    };

    const handleCancel = () => {
        if (request) {
            setEditData({ ...request }); // Reset to original data
        }
        setIsEditMode(false);
        router.replace(`/admin/requests/${requestId}`);
    };

    const toggleEditMode = () => {
        if (isEditMode) {
            handleCancel();
        } else {
            // Initialize editData with current request data when entering edit mode
            if (request) {
                setEditData({ ...request });
            }
            setIsEditMode(true);
            router.replace(`/admin/requests/${requestId}?edit=true`);
        }
    };

    const handleApprove = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        setProcessing(true);
        setError('');
        setSuccess('');

        try {
            const response = await fetch(`/api/admin/requests/${requestId}/approve`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to approve request');
            }

            setSuccess('Request approved successfully!');
            fetchRequestDetails(token, requestId);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async () => {
        if (rejectionReason.length < 10) {
            setError('Rejection reason must be at least 10 characters');
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) return;

        setProcessing(true);
        setError('');
        setSuccess('');

        try {
            const response = await fetch(`/api/admin/requests/${requestId}/reject`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ rejectionReason }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to reject request');
            }

            setSuccess('Request rejected successfully!');
            setShowRejectModal(false);
            setRejectionReason('');
            fetchRequestDetails(token, requestId);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setProcessing(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'APPROVED':
                return 'bg-[#DCFCE7] text-[#166534]'; // Green
            case 'REJECTED':
                return 'bg-[#FEE2E2] text-[#991B1B]'; // Red
            case 'PENDING':
                return 'bg-[#FEF3C7] text-[#92400E]'; // Yellow/Orange
            default:
                return 'bg-[#F3F4F6] text-[#374151]'; // Gray
        }
    };

    if (loading && !permissionDenied) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading request details...</p>
                </div>
            </div>
        );
    }

    if (!request && !permissionDenied) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600">{t('notFound')}</p>
                    <Link href="/admin/requests" className="text-info-500 hover:text-primary-700 mt-4 inline-block">
                        {t('backToRequests')}
                    </Link>
                </div>
            </div>
        );
    }

    const sidebarItems = getSidebarItems(
        locale as 'en' | 'ar',
        user?.permissions || [],
        user?.role,
        '/admin/requests' // Active item
    );

    return (
        <div className="min-h-screen bg-gray-50 flex" dir={isRtl ? 'rtl' : 'ltr'}>
            <Sidebar items={sidebarItems} locale={locale as 'en' | 'ar'} />

            <div className="flex-1" style={{ marginLeft: isRtl ? '0' : '16rem', marginRight: isRtl ? '16rem' : '0' }}>
                <Header />

                <main className="px-6 py-8">
                    {permissionDenied ? (
                        <div className="card p-12 text-center">
                            {/* Permission denied content kept same */}
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('permissionDenied')}</h3>
                            <p className="text-gray-500">{t('contactAdmin')}</p>
                            <Link href="/admin/requests" className="text-info-500 hover:text-primary-700 mt-4 inline-block">
                                {t('backToRequests')}
                            </Link>
                        </div>
                    ) : request ? (
                        <div className="animate-fade-in font-['Rubik']">
                            {/* Header Section */}
                            <div className="bg-white rounded-[16px] p-6 shadow-sm mb-6">
                                <div className="flex items-center justify-between mb-8">
                                    <RequestHeader
                                        requestNumber={request.requestNumber}
                                    />
                                    <div className="flex items-center gap-3">
                                        <span className={`px-4 py-2 rounded-[8px] text-sm font-medium ${getStatusColor(request.status)}`}>
                                            {dt(`status.${request.status}`)}
                                        </span>
                                        <button
                                            onClick={toggleEditMode}
                                            className={`px-4 py-1 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                                                isEditMode
                                                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                            }`}
                                            disabled={processing}
                                        >
                                            {isEditMode ? (
                                                <>
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                    Cancel
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                    Edit
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {isEditMode && (
                                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                        <div className="flex justify-between items-center">
                                            <p className="text-blue-800 text-sm font-medium">Edit mode enabled. Make your changes and click Save.</p>
                                            <button
                                                onClick={handleSave}
                                                disabled={processing}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {processing ? 'Saving...' : 'Save Changes'}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {(error || success) && (
                                    <div className={`mb-4 p-4 rounded-lg ${error ? 'bg-red-50 border border-red-200 text-red-800' : 'bg-green-50 border border-green-200 text-green-800'}`}>
                                        {error || success}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* Left Column: Info Sections */}
                                    <div className="border-r border-gray-100 pr-0 lg:pr-8">
                                        <InfoSection
                                            title={t('passPermitInfo') || "Pass Permit Info"}
                                            isEditable={isEditMode}
                                            onChange={(fieldName, value) => {
                                                setEditData(prev => ({ ...prev, [fieldName]: value }));
                                            }}
                                            data={[
                                                { label: t('fields.passType') || "Pass Type", value: isEditMode ? (editData.requestType !== undefined ? editData.requestType : request.requestType) : dt(`types.${request.requestType}`), fieldName: 'requestType' },
                                                { label: t('fields.nationality') || "Nationality", value: isEditMode ? (editData.nationality !== undefined ? editData.nationality : request.nationality) : request.nationality, fieldName: 'nationality' },
                                                { label: t('fields.identification') || "Identification", value: isEditMode ? (editData.identification !== undefined ? editData.identification : request.identification) : request.identification, fieldName: 'identification' },
                                                { label: t('fields.passStartingDate') || "Pass Starting Date", value: isEditMode ? (editData.validFrom ? new Date(editData.validFrom).toLocaleDateString() : new Date(request.validFrom).toLocaleDateString()) : new Date(request.validFrom).toLocaleDateString() },
                                                { label: t('fields.validityPeriod') || "Validity Period", value: isEditMode ? (editData.validTo ? new Date(editData.validTo).toLocaleDateString() : new Date(request.validTo).toLocaleDateString()) : new Date(request.validTo).toLocaleDateString() },
                                                { label: t('fields.passFor') || "Pass For", value: isEditMode ? (editData.passFor !== undefined ? (editData.passFor || 'Self') : (request.passFor || 'Self')) : (request.passFor || 'Self'), fieldName: 'passFor' },
                                                { label: t('fields.purposeOfVisit') || "Purpose of visit", value: isEditMode ? (editData.purposeOfVisit !== undefined ? editData.purposeOfVisit : request.purposeOfVisit) : request.purposeOfVisit, fieldName: 'purposeOfVisit' },
                                                { label: t('fields.organization') || "Organization Host", value: request.organization },
                                            ]}
                                        />

                                        <div className="my-8 border-t border-gray-100"></div>

                                        <InfoSection
                                            title={t('passHolderInfo') || "Pass Holder Info"}
                                            isEditable={isEditMode}
                                            onChange={(fieldName, value) => {
                                                setEditData(prev => ({ ...prev, [fieldName]: value }));
                                            }}
                                            data={[
                                                { label: t('fields.holderNameEn') || "Holder Name(En)", value: isEditMode ? (editData.applicantNameEn !== undefined ? editData.applicantNameEn : request.applicantNameEn) : request.applicantNameEn, fieldName: 'applicantNameEn' },
                                                { label: t('fields.holderNameAr') || "Holder Name(Ar)", value: isEditMode ? (editData.applicantNameAr !== undefined ? editData.applicantNameAr : request.applicantNameAr) : request.applicantNameAr, fieldName: 'applicantNameAr' },
                                                { label: t('fields.telephone') || "Telephone", value: isEditMode ? (editData.applicantPhone !== undefined ? (editData.applicantPhone || '-') : (request.applicantPhone || '-')) : (request.applicantPhone || '-'), fieldName: 'applicantPhone' },
                                                { label: t('fields.email') || "Email", value: isEditMode ? (editData.applicantEmail !== undefined ? editData.applicantEmail : request.applicantEmail) : request.applicantEmail, fieldName: 'applicantEmail' },
                                                { label: t('fields.gender') || "Gender", value: isEditMode ? (editData.gender !== undefined ? editData.gender : request.gender) : request.gender, fieldName: 'gender' },
                                                { label: t('fields.profession') || "Profession", value: isEditMode ? (editData.profession !== undefined ? editData.profession : request.profession) : request.profession, fieldName: 'profession' },
                                                { label: t('fields.idPassportNumber') || "ID Or Passport Number", value: isEditMode ? (editData.passportIdNumber !== undefined ? editData.passportIdNumber : request.passportIdNumber) : request.passportIdNumber, fieldName: 'passportIdNumber' },
                                            ]}
                                        />
                                    </div>

                                    {/* Right Column: Documents */}
                                    <div>
                                        <DocumentCard
                                            title={t('fields.passportIdNumber') || "Passport/ID Number"}
                                            imageUrl={request.passportIdImagePath}
                                        />

                                        {/* Display Other Documents if available */}
                                        {request.uploads
                                            .filter(u => u.fileType.startsWith('OTHER'))
                                            .map((upload, idx) => (
                                                <DocumentCard
                                                    key={upload.id}
                                                    title={`${t('fields.otherDocuments') || "Other Documents"} ${idx + 1}`}
                                                    imageUrl={upload.filePath}
                                                />
                                            ))}
                                    </div>
                                </div>
                            </div>

                            {/* Permit Section (Bottom) */}
                            <div className="bg-white rounded-[16px] p-6 shadow-sm">
                                <PermitSection
                                    status={request.status}
                                    requestType={request.requestType}
                                    title={t('permitsQrCode') || "Permits(QR Code)"}
                                    subtitle={request.status === 'REJECTED' && request.rejectionReason
                                        ? request.rejectionReason
                                        : "The user was informed of the reason for the rejection via his Email."}
                                />
                            </div>

                        </div>
                    ) : null}
                </main>

                {/* Reject Modal */}
                {
                    showRejectModal && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-lg max-w-md w-full p-6">
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{t('rejectModalTitle')}</h3>
                                <p className="text-gray-600 mb-4">{t('rejectModalDesc')}</p>

                                <textarea
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder={t('rejectReasonPlaceholder')}
                                    rows={4}
                                    className="input mb-4"
                                    minLength={10}
                                />

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            setShowRejectModal(false);
                                            setRejectionReason('');
                                            setError('');
                                        }}
                                        className="btn btn-secondary flex-1"
                                        disabled={processing}
                                    >
                                        {t('cancel')}
                                    </button>
                                    <button
                                        onClick={handleReject}
                                        className="btn btn-danger flex-1"
                                        disabled={processing || rejectionReason.length < 10}
                                    >
                                        {processing ? t('rejecting') : t('confirmReject')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }
            </div>
        </div >
    );
}
