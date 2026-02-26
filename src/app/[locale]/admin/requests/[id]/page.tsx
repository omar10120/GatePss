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
import { apiFetch, authenticatedFetch } from '@/lib/api-client';

interface RequestDetails {
    id: number;
    requestNumber: string;
    applicantNameEn: string;
    applicantNameAr: string;
    applicantEmail: string;
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
    passEndDate: string;
    requestType: string;
    passTypeId: number | null;
    status: string;
    rejectionReason: string | null;
    passFor: string | null;
    otherProfessions: string | null;

    visitduration: string | null;
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
    entityType: string;
    logs: Array<{
        id: number;
        timestamp: string;
        actionPerformed: string;
        user: { name: string } | null;
    }>;
}

interface PassType {
    id: number;
    name_en: string;
    name_ar: string;
    is_active: boolean;
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
    const gt = useTranslations('GatePassPage');

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
    const [passTypes, setPassTypes] = useState<PassType[]>([]);
    const [files, setFiles] = useState<{ [key: string]: File | null }>({});
    const [imageModal, setImageModal] = useState<{ isOpen: boolean; imageUrl: string | null; title: string }>({
        isOpen: false,
        imageUrl: null,
        title: ''
    });

    // Helper function to check if user has a specific permission
    const hasPermission = (permissionKey: string) => {
        if (!user) return false;
        if (user.role === 'SUPER_ADMIN') return true;
        return user.permissions?.includes(permissionKey) || false;
    };

    // Helper function to check if pass type is permanent
    const isPermanent = (passTypeId: number | null) => {
        if (!passTypeId) return false;
        const passType = passTypes.find(pt => pt.id === passTypeId);
        if (!passType) return false;
        const nameEn = passType.name_en.toLowerCase();
        const nameAr = passType.name_ar;
        return nameEn.includes('permanent') || nameAr.includes('دائم');
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


        // Check if edit mode is enabled from URL
        const editParam = searchParams.get('edit');
        const editMode = editParam === 'true';
        setIsEditMode(editMode);

        if (requestId) {
            fetchRequestDetails(requestId, editMode);
        }
    }, [requestId, searchParams]);

    // Fetch pass types from database
    useEffect(() => {
        const fetchPassTypes = async () => {
            try {
                const result = await apiFetch<any[]>('/api/pass-types');
                setPassTypes(result || []);
            } catch (error) {
                console.error('Error fetching pass types:', error);
            }
        };

        fetchPassTypes();
    }, []);

    // Initialize editData when request is loaded and entering edit mode
    useEffect(() => {
        if (request && isEditMode) {
            // Only initialize if editData is empty or doesn't have the same id
            if (Object.keys(editData).length === 0 || editData.id !== request.id) {
                setEditData({ ...request, status: request.status, rejectionReason: request.rejectionReason });
            }
        }
    }, [request, isEditMode]); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchRequestDetails = async (id: string, editMode?: boolean) => {
        setLoading(true);
        setPermissionDenied(false);
        try {
            console.log('fetching request details: ' + id);
            // Include edit=true query parameter if in edit mode
            const currentEditMode = editMode !== undefined ? editMode : isEditMode;
            const url = currentEditMode ? `/api/admin/requests/${id}?edit=true` : `/api/admin/requests/${id}`;
            const result = await apiFetch<RequestDetails>(url);

            setRequest(result);
            // Only initialize editData if not in edit mode (to preserve user changes)
            if (!currentEditMode) {
                setEditData({ ...result });
            } else {
                // If in edit mode, merge with existing editData to preserve user changes
                setEditData(prev => ({ ...result, ...prev }));
            }
        } catch (error: any) {
            console.error('Error fetching request details:', error);
            // Check if it's a permission error (403)
            if (error.message?.includes('Forbidden') || error.message?.includes('permission')) {
                setPermissionDenied(true);
            } else {
                setError('Failed to load request details');
            }
            // apiFetch handles 401 (token expiration) automatically with redirect
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!request) return;

        setProcessing(true);
        setError('');
        setSuccess('');

        try {
            // Prepare update data - only include fields that have changed
            const updatePayload: any = {};

            if (editData.applicantNameEn !== undefined && editData.applicantNameEn !== request.applicantNameEn) {
                updatePayload.applicantNameEn = editData.applicantNameEn;
            }
            if (editData.applicantNameAr !== undefined && editData.applicantNameAr !== request.applicantNameAr) {
                updatePayload.applicantNameAr = editData.applicantNameAr;
            }
            if (editData.applicantEmail !== undefined && editData.applicantEmail !== request.applicantEmail) {
                updatePayload.applicantEmail = editData.applicantEmail;
            }
            if (editData.passportIdNumber !== undefined && editData.passportIdNumber !== request.passportIdNumber) {
                updatePayload.passportIdNumber = editData.passportIdNumber;
            }
            if (editData.purposeOfVisit !== undefined && editData.purposeOfVisit !== request.purposeOfVisit) {
                updatePayload.purposeOfVisit = editData.purposeOfVisit;
            }
            if (editData.requestType !== undefined && editData.requestType !== request.requestType) {
                updatePayload.requestType = editData.requestType;
            }
            if (editData.passFor !== undefined && editData.passFor !== request.passFor) {
                updatePayload.passFor = editData.passFor;
            }
            if (editData.nationality !== undefined && editData.nationality !== request.nationality) {
                updatePayload.nationality = editData.nationality;
            }
            if (editData.identification !== undefined && editData.identification !== request.identification) {
                updatePayload.identification = editData.identification;
            }
            if (editData.gender !== undefined && editData.gender !== request.gender) {
                updatePayload.gender = editData.gender;
            }
            if (editData.profession !== undefined && editData.profession !== request.profession) {
                updatePayload.profession = editData.profession;
            }
            if (editData.passEndDate !== undefined && editData.passEndDate !== request.passEndDate) {
                updatePayload.passEndDate = editData.passEndDate;
            }
            if (editData.validFrom !== undefined && editData.validFrom !== request.validFrom) {
                updatePayload.validFrom = editData.validFrom;
            }
            if (editData.validTo !== undefined && editData.validTo !== request.validTo) {
                updatePayload.validTo = editData.validTo;
            }
            if (editData.passTypeId !== undefined && editData.passTypeId !== request.passTypeId) {
                updatePayload.passTypeId = editData.passTypeId ? Number(editData.passTypeId) : null;
            }
            if (editData.dateOfVisit !== undefined && editData.dateOfVisit !== request.dateOfVisit) {
                updatePayload.dateOfVisit = editData.dateOfVisit;
            }
            if (editData.visitduration !== undefined && editData.visitduration !== request.visitduration) {
                updatePayload.visitduration = editData.visitduration;
            }
            if (editData.otherProfessions !== undefined && editData.otherProfessions !== request.otherProfessions) {
                updatePayload.otherProfessions = editData.otherProfessions;
            }
            if (editData.entityType !== undefined && editData.entityType !== request.entityType) {
                updatePayload.entityType = editData.entityType;
            }
            if (editData.dateOfVisit !== undefined && editData.dateOfVisit !== request.dateOfVisit) {
                updatePayload.dateOfVisit = editData.dateOfVisit;
            }

            // Check if status is being changed
            const statusChanged = isEditMode && editData.status !== undefined && editData.status !== request.status;
            const newStatus = statusChanged ? editData.status : null;

            // Validate rejection reason if status is being changed to REJECTED
            if (newStatus === 'REJECTED') {
                const rejectionReason = editData.rejectionReason !== undefined ? editData.rejectionReason : request.rejectionReason;
                if (!rejectionReason || rejectionReason.trim().length < 10) {
                    setError('Rejection reason must be at least 10 characters when status is REJECTED');
                    setProcessing(false);
                    return;
                }
            }

            // Separate status updates from other updates
            // We'll handle status via approve/reject endpoints, other fields via PUT
            const otherUpdates = { ...updatePayload };
            // Remove status and rejectionReason from otherUpdates since we handle them separately
            delete otherUpdates.status;
            delete otherUpdates.rejectionReason;

            // Check if there are files to upload
            const hasFiles = Object.values(files).some(file => file !== null);

            // Check if there are other changes besides status
            const hasOtherChanges = Object.keys(otherUpdates).length > 0 || hasFiles;

            // If no changes at all, return early
            if (!statusChanged && !hasOtherChanges) {
                setError('No changes to save');
                setProcessing(false);
                return;
            }

            // Handle status changes using approve/reject endpoints (matching list page logic)
            if (statusChanged) {
                if (newStatus === 'APPROVED') {
                    // Use approve endpoint with updates
                    const approvePayload: any = {};
                    if (hasOtherChanges) {
                        approvePayload.updates = otherUpdates;
                    }

                    // If there are files, we need to save them first via PUT, then approve
                    if (hasFiles) {
                        // First save files and other updates via PUT
                        const formData = new FormData();
                        Object.keys(otherUpdates).forEach(key => {
                            const value = otherUpdates[key];
                            if (value !== null && value !== undefined) {
                                if (value instanceof Date) {
                                    formData.append(key, value.toISOString());
                                } else {
                                    formData.append(key, String(value));
                                }
                            }
                        });
                        Object.keys(files).forEach(key => {
                            const file = files[key];
                            if (file) {
                                formData.append(key, file);
                            }
                        });

                        const url = `/api/admin/requests/${requestId}?edit=true`;
                        const response = await authenticatedFetch(url, {
                            method: 'PUT',
                            body: formData,
                        });

                        if (!response.ok) {
                            const result = await response.json().catch(() => ({}));
                            throw new Error(result.message || 'Failed to update request');
                        }
                    }

                    // Then approve with any remaining updates
                    if (Object.keys(approvePayload.updates || {}).length > 0) {
                        await apiFetch(`/api/admin/requests/${requestId}/approve`, {
                            method: 'POST',
                            body: JSON.stringify(approvePayload),
                        });
                    } else {
                        await apiFetch(`/api/admin/requests/${requestId}/approve`, {
                            method: 'POST',
                        });
                    }

                    setSuccess(t('requestApprovedAndUpdatedSuccessfully'));
                } else if (newStatus === 'REJECTED') {
                    // First save other updates via PUT (if any)
                    if (hasOtherChanges) {
                        if (hasFiles) {
                            const formData = new FormData();
                            Object.keys(otherUpdates).forEach(key => {
                                const value = otherUpdates[key];
                                if (value !== null && value !== undefined) {
                                    if (value instanceof Date) {
                                        formData.append(key, value.toISOString());
                                    } else {
                                        formData.append(key, String(value));
                                    }
                                }
                            });
                            Object.keys(files).forEach(key => {
                                const file = files[key];
                                if (file) {
                                    formData.append(key, file);
                                }
                            });

                            const url = `/api/admin/requests/${requestId}?edit=true`;
                            const response = await authenticatedFetch(url, {
                                method: 'PUT',
                                body: formData,
                            });

                            if (!response.ok) {
                                const result = await response.json().catch(() => ({}));
                                throw new Error(result.message || 'Failed to update request');
                            }
                        } else {
                            const url = `/api/admin/requests/${requestId}?edit=true`;
                            await apiFetch(url, {
                                method: 'PUT',
                                body: JSON.stringify(otherUpdates),
                            });
                        }
                    }

                    // Then reject with rejection reason
                    const rejectionReason = editData.rejectionReason !== undefined ? editData.rejectionReason : request.rejectionReason;
                    await apiFetch(`/api/admin/requests/${requestId}/reject`, {
                        method: 'POST',
                        body: JSON.stringify({ rejectionReason }),
                    });

                    setSuccess(t('requestRejectedAndUpdatedSuccessfully'));
                } else if (newStatus === 'PENDING') {
                    // For PENDING, include status in PUT request
                    const pendingPayload = { ...otherUpdates, status: 'PENDING' };

                    if (hasFiles) {
                        const formData = new FormData();
                        Object.keys(pendingPayload).forEach(key => {
                            const value = pendingPayload[key];
                            if (value !== null && value !== undefined) {
                                if (value instanceof Date) {
                                    formData.append(key, value.toISOString());
                                } else {
                                    formData.append(key, String(value));
                                }
                            }
                        });
                        Object.keys(files).forEach(key => {
                            const file = files[key];
                            if (file) {
                                formData.append(key, file);
                            }
                        });

                        const url = `/api/admin/requests/${requestId}?edit=true`;
                        const response = await authenticatedFetch(url, {
                            method: 'PUT',
                            body: formData,
                        });

                        if (!response.ok) {
                            const result = await response.json().catch(() => ({}));
                            throw new Error(result.message || 'Failed to update request');
                        }
                    } else {
                        const url = `/api/admin/requests/${requestId}?edit=true`;
                        await apiFetch(url, {
                            method: 'PUT',
                            body: JSON.stringify(pendingPayload),
                        });
                    }

                    setSuccess(t('requestUpdatedSuccessfully'));
                }
            } else {
                // No status change, just save other updates via PUT
                if (hasFiles) {
                    const formData = new FormData();
                    Object.keys(otherUpdates).forEach(key => {
                        const value = otherUpdates[key];
                        if (value !== null && value !== undefined) {
                            if (value instanceof Date) {
                                formData.append(key, value.toISOString());
                            } else {
                                formData.append(key, String(value));
                            }
                        }
                    });
                    Object.keys(files).forEach(key => {
                        const file = files[key];
                        if (file) {
                            formData.append(key, file);
                        }
                    });

                    const url = isEditMode ? `/api/admin/requests/${requestId}?edit=true` : `/api/admin/requests/${requestId}`;
                    const response = await authenticatedFetch(url, {
                        method: 'PUT',
                        body: formData,
                    });

                    if (!response.ok) {
                        const result = await response.json().catch(() => ({}));
                        throw new Error(result.message || 'Failed to update request');
                    }
                } else {
                    const url = isEditMode ? `/api/admin/requests/${requestId}?edit=true` : `/api/admin/requests/${requestId}`;
                    await apiFetch(url, {
                        method: 'PUT',
                        body: JSON.stringify(otherUpdates),
                    });
                }

                setSuccess(t('requestUpdatedSuccessfully'));
            }

            setIsEditMode(false);
            // Remove edit query parameter from URL
            router.replace(`/admin/requests/${requestId}`);
            fetchRequestDetails(requestId, false);
        } catch (err: any) {
            setError(err.message || 'An error occurred');
            // apiFetch/authenticatedFetch handles 401 (token expiration) automatically with redirect
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
        // Only allow editing if status is PENDING
        if (!request || request.status !== 'PENDING') {
            setError('Only pending requests can be edited');
            return;
        }

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

    const handleStatusUpdate = async (status: 'APPROVED' | 'REJECTED' | 'PENDING', rejectionReason?: string) => {
        setProcessing(true);
        setError('');
        setSuccess('');

        try {
            let endpoint = '';
            let body = {};

            if (status === 'APPROVED') {
                endpoint = `/api/admin/requests/${requestId}/approve`;
            } else if (status === 'REJECTED') {
                if (!rejectionReason || rejectionReason.trim().length < 10) {
                    setError('Rejection reason must be at least 10 characters');
                    setProcessing(false);
                    return;
                }
                endpoint = `/api/admin/requests/${requestId}/reject`;
                body = { rejectionReason };
            } else {
                // For PENDING status, use PUT endpoint with edit=true
                endpoint = `/api/admin/requests/${requestId}?edit=true`;
                body = { status: 'PENDING' };
                await apiFetch(endpoint, {
                    method: 'PUT',
                    body: JSON.stringify(body),
                });
                setSuccess(t('requestStatusUpdatedToPendingSuccessfully'));
                fetchRequestDetails(requestId, isEditMode);
                setProcessing(false);
                return;
            }

            await apiFetch(endpoint, {
                method: 'POST',
                body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
            });

            if (status === 'APPROVED') {
                setSuccess(t('requestapproved'));
            } else if (status === 'REJECTED') {
                setSuccess(t('requestrejected'));
                setShowRejectModal(false);
                setRejectionReason('');
            }

            fetchRequestDetails(requestId, isEditMode);
        } catch (err: any) {
            setError(err.message || 'An error occurred');
            // apiFetch handles 401 (token expiration) automatically with redirect
        } finally {
            setProcessing(false);
        }
    };

    const handleApprove = async () => {
        await handleStatusUpdate('APPROVED');
    };

    const handleReject = async () => {
        if (rejectionReason.length < 10) {
            setError('Rejection reason must be at least 10 characters');
            return;
        }
        await handleStatusUpdate('REJECTED', rejectionReason);
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
                                        {isEditMode && request.status === 'PENDING' ? (
                                            <div className="flex flex-col gap-2">
                                                <select
                                                    value={editData.status !== undefined ? editData.status : request.status}
                                                    onChange={(e) => {
                                                        const newStatus = e.target.value as 'APPROVED' | 'REJECTED' | 'PENDING';
                                                        setEditData(prev => ({
                                                            ...prev,
                                                            status: newStatus,
                                                            // Clear rejectionReason if status is not REJECTED
                                                            rejectionReason: newStatus === 'REJECTED' ? (prev.rejectionReason || request.rejectionReason || '') : null
                                                        }));
                                                    }}
                                                    className={`px-4 py-2 rounded-[8px] text-sm font-medium border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 ${getStatusColor(editData.status !== undefined ? editData.status : request.status)}`}
                                                >
                                                    <option value="PENDING">{dt('status.PENDING')}</option>
                                                    <option value="APPROVED">{dt('status.APPROVED')}</option>
                                                    <option value="REJECTED">{dt('status.REJECTED')}</option>
                                                </select>
                                                {(editData.status !== undefined ? editData.status : request.status) === 'REJECTED' && (
                                                    <div className="mt-2">
                                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                                            Rejection Reason
                                                        </label>
                                                        <textarea
                                                            value={editData.rejectionReason !== undefined ? (editData.rejectionReason || '') : (request.rejectionReason || '')}
                                                            onChange={(e) => setEditData(prev => ({ ...prev, rejectionReason: e.target.value }))}
                                                            placeholder="Enter rejection reason (minimum 10 characters)"
                                                            rows={3}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            minLength={10}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <span className={`px-4 py-2 rounded-[8px] text-sm font-medium ${getStatusColor(request.status)}`}>
                                                {dt(`status.${request.status}`)}
                                            </span>
                                        )}
                                        <button
                                            onClick={toggleEditMode}
                                            className={`px-4 py-1 rounded-lg font-medium transition-colors flex items-center gap-2 ${isEditMode
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
                                                    {t('cancel')}
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                    {t('edit')}
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {isEditMode && request.status === 'PENDING' && (
                                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                        <div className="flex justify-between items-center">
                                            <p className="text-blue-800 text-sm font-medium">{t('editModeEnabled')}</p>
                                            <button
                                                onClick={handleSave}
                                                disabled={processing}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {processing ? t('saving') : t('saveChanges')}
                                            </button>
                                            {t('saveChanges')}
                                        </div>
                                    </div>
                                )}

                                {request.status !== 'PENDING' && (
                                    <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                        <p className="text-yellow-800 text-sm font-medium">
                                            {t('editModeDisabled', { status: t(`editModeDisabledStatus.${request.status}`) })}
                                        </p>
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
                                            isEditable={isEditMode && request.status === 'PENDING'}
                                            onChange={(fieldName, value) => {
                                                // Convert passTypeId to number if it's a select field
                                                if (fieldName === 'passTypeId') {
                                                    setEditData(prev => ({ ...prev, [fieldName]: value ? Number(value) : null }));
                                                } else {
                                                    setEditData(prev => ({ ...prev, [fieldName]: value }));
                                                }
                                            }}
                                            data={[
                                                    {
                                                        label: t('fields.entityType') || "Entity Type",
                                                        value: isEditMode && request.status === 'PENDING'
                                                            ? (editData.entityType || request.entityType)
                                                            : (dt(`entityTypes.${request.entityType}`) || request.entityType),
                                                        fieldName: 'entityType',
                                                        fieldType: 'select',
                                                        options: [
                                                            { value: 'port', label: 'Port' },
                                                            { value: 'freezone', label: 'Freezone' }
                                                        ]
                                                    },
                                                    {
                                                        label: gt('fields.passType') || "Identification Card",
                                                    value: isEditMode
                                                        ? (editData.passTypeId !== undefined ? editData.passTypeId?.toString() : request.passTypeId?.toString() || '')
                                                        : (request.passTypeId && passTypes.find(pt => pt.id === request.passTypeId)
                                                            ? (locale === 'ar' ? passTypes.find(pt => pt.id === request.passTypeId)!.name_ar : passTypes.find(pt => pt.id === request.passTypeId)!.name_en)
                                                            : 'N/A'),
                                                    fieldName: 'passTypeId',
                                                    fieldType: 'select',
                                                    options: [
                                                        { value: '', label: gt('placeholders.selectPassType') || 'Select Identification Card' },
                                                        ...passTypes.filter(pt => pt.is_active).map(pt => ({
                                                            value: pt.id.toString(),
                                                            label: locale === 'ar' ? pt.name_ar : `${pt.name_en}${pt.name_ar ? ` / ${pt.name_ar}` : ''}`
                                                        }))
                                                    ]
                                                },
                                                {
                                                    label: gt('fields.requestType') || "Identification Card",
                                                    value: isEditMode ? (editData.requestType !== undefined ? editData.requestType : request.requestType) : request.requestType,
                                                    fieldName: 'requestType',
                                                    fieldType: 'select',
                                                    options: [
                                                        { value: '', label: gt('placeholders.select') || 'Select' },
                                                        { value: 'Resident', label: dt('types.Resident') },
                                                        { value: 'Not Resident', label: dt('types.Not Resident') },
                                                    ]
                                                },
                                                {
                                                    label: gt('fields.nationality') || "Nationality",
                                                    value: isEditMode ? (editData.nationality !== undefined ? editData.nationality : request.nationality) : request.nationality,
                                                    fieldName: 'nationality',
                                                    fieldType: 'select',
                                                    options: [
                                                        { value: 'Afghan', label: gt('options.afghan') || 'Afghan' },
                                                        { value: 'Albanian', label: gt('options.albanian') || 'Albanian' },
                                                        { value: 'Algerian', label: gt('options.algerian') || 'Algerian' },
                                                        { value: 'American', label: gt('options.american') || 'American' },
                                                        { value: 'Andorran', label: gt('options.andorran') || 'Andorran' },
                                                        { value: 'Angolan', label: gt('options.angolan') || 'Angolan' },
                                                        { value: 'Argentinian', label: gt('options.argentinian') || 'Argentinian' },
                                                        { value: 'Armenian', label: gt('options.armenian') || 'Armenian' },
                                                        { value: 'Australian', label: gt('options.australian') || 'Australian' },
                                                        { value: 'Austrian', label: gt('options.austrian') || 'Austrian' },

                                                        { value: 'Azerbaijani', label: gt('options.azerbaijani') || 'Azerbaijani' },
                                                        { value: 'Bahraini', label: gt('options.bahraini') || 'Bahraini' },
                                                        { value: 'Bangladeshi', label: gt('options.bangladeshi') || 'Bangladeshi' },
                                                        { value: 'Belgian', label: gt('options.belgian') || 'Belgian' },
                                                        { value: 'Bolivian', label: gt('options.bolivian') || 'Bolivian' },
                                                        { value: 'Brazilian', label: gt('options.brazilian') || 'Brazilian' },
                                                        { value: 'British', label: gt('options.british') || 'British' },
                                                        { value: 'Bulgarian', label: gt('options.bulgarian') || 'Bulgarian' },

                                                        { value: 'Canadian', label: gt('options.canadian') || 'Canadian' },
                                                        { value: 'Chilean', label: gt('options.chilean') || 'Chilean' },
                                                        { value: 'Chinese', label: gt('options.chinese') || 'Chinese' },
                                                        { value: 'Colombian', label: gt('options.colombian') || 'Colombian' },
                                                        { value: 'Croatian', label: gt('options.croatian') || 'Croatian' },
                                                        { value: 'Cuban', label: gt('options.cuban') || 'Cuban' },
                                                        { value: 'Cypriot', label: gt('options.cypriot') || 'Cypriot' },
                                                        { value: 'Czech', label: gt('options.czech') || 'Czech' },

                                                        { value: 'Danish', label: gt('options.danish') || 'Danish' },
                                                        { value: 'Dominican', label: gt('options.dominican') || 'Dominican' },
                                                        { value: 'Dutch', label: gt('options.dutch') || 'Dutch' },

                                                        { value: 'Egyptian', label: gt('options.egyptian') || 'Egyptian' },
                                                        { value: 'Emirati', label: gt('options.emirati') || 'Emirati' },
                                                        { value: 'Estonian', label: gt('options.estonian') || 'Estonian' },
                                                        { value: 'Ethiopian', label: gt('options.ethiopian') || 'Ethiopian' },

                                                        { value: 'Filipino', label: gt('options.filipino') || 'Filipino' },
                                                        { value: 'Finnish', label: gt('options.finnish') || 'Finnish' },
                                                        { value: 'French', label: gt('options.french') || 'French' },

                                                        { value: 'Georgian', label: gt('options.georgian') || 'Georgian' },
                                                        { value: 'German', label: gt('options.german') || 'German' },
                                                        { value: 'Ghanaian', label: gt('options.ghanaian') || 'Ghanaian' },
                                                        { value: 'Greek', label: gt('options.greek') || 'Greek' },

                                                        { value: 'Hungarian', label: gt('options.hungarian') || 'Hungarian' },

                                                        { value: 'Indian', label: gt('options.indian') || 'Indian' },
                                                        { value: 'Indonesian', label: gt('options.indonesian') || 'Indonesian' },
                                                        { value: 'Iranian', label: gt('options.iranian') || 'Iranian' },
                                                        { value: 'Iraqi', label: gt('options.iraqi') || 'Iraqi' },
                                                        { value: 'Irish', label: gt('options.irish') || 'Irish' },
                                                        { value: 'Italian', label: gt('options.italian') || 'Italian' },

                                                        { value: 'Japanese', label: gt('options.japanese') || 'Japanese' },
                                                        { value: 'Jordanian', label: gt('options.jordanian') || 'Jordanian' },

                                                        { value: 'Kenyan', label: gt('options.kenyan') || 'Kenyan' },
                                                        { value: 'Kuwaiti', label: gt('options.kuwaiti') || 'Kuwaiti' },

                                                        { value: 'Lebanese', label: gt('options.lebanese') || 'Lebanese' },
                                                        { value: 'Libyan', label: gt('options.libyan') || 'Libyan' },
                                                        { value: 'Lithuanian', label: gt('options.lithuanian') || 'Lithuanian' },

                                                        { value: 'Malaysian', label: gt('options.malaysian') || 'Malaysian' },
                                                        { value: 'Mexican', label: gt('options.mexican') || 'Mexican' },
                                                        { value: 'Moroccan', label: gt('options.moroccan') || 'Moroccan' },

                                                        { value: 'Nepalese', label: gt('options.nepalese') || 'Nepalese' },
                                                        { value: 'Nigerian', label: gt('options.nigerian') || 'Nigerian' },
                                                        { value: 'Norwegian', label: gt('options.norwegian') || 'Norwegian' },

                                                        { value: 'Omani', label: gt('options.omani') || 'Omani' },

                                                        { value: 'Pakistani', label: gt('options.pakistani') || 'Pakistani' },
                                                        { value: 'Palestinian', label: gt('options.palestinian') || 'Palestinian' },
                                                        { value: 'Peruvian', label: gt('options.peruvian') || 'Peruvian' },
                                                        { value: 'Polish', label: gt('options.polish') || 'Polish' },
                                                        { value: 'Portuguese', label: gt('options.portuguese') || 'Portuguese' },

                                                        { value: 'Qatari', label: gt('options.qatari') || 'Qatari' },

                                                        { value: 'Romanian', label: gt('options.romanian') || 'Romanian' },
                                                        { value: 'Russian', label: gt('options.russian') || 'Russian' },

                                                        { value: 'Saudi', label: gt('options.saudi') || 'Saudi' },
                                                        { value: 'Senegalese', label: gt('options.senegalese') || 'Senegalese' },
                                                        { value: 'Serbian', label: gt('options.serbian') || 'Serbian' },
                                                        { value: 'Singaporean', label: gt('options.singaporean') || 'Singaporean' },
                                                        { value: 'South African', label: gt('options.south_african') || 'South African' },
                                                        { value: 'Spanish', label: gt('options.spanish') || 'Spanish' },
                                                        { value: 'Sudanese', label: gt('options.sudanese') || 'Sudanese' },
                                                        { value: 'Swedish', label: gt('options.swedish') || 'Swedish' },
                                                        { value: 'Swiss', label: gt('options.swiss') || 'Swiss' },
                                                        { value: 'Syrian', label: gt('options.syrian') || 'Syrian' },

                                                        { value: 'Tunisian', label: gt('options.tunisian') || 'Tunisian' },
                                                        { value: 'Turkish', label: gt('options.turkish') || 'Turkish' },

                                                        { value: 'Ukrainian', label: gt('options.ukrainian') || 'Ukrainian' },

                                                        { value: 'Venezuelan', label: gt('options.venezuelan') || 'Venezuelan' },
                                                        { value: 'Vietnamese', label: gt('options.vietnamese') || 'Vietnamese' },

                                                        { value: 'Yemeni', label: gt('options.yemeni') || 'Yemeni' },

                                                    ]
                                                },
                                                {
                                                    label: gt('fields.identification') || "Identification",
                                                    value: isEditMode ? (editData.identification !== undefined ? editData.identification : request.identification) : request.identification,
                                                    fieldName: 'identification',
                                                    fieldType: 'select',
                                                    options: [
                                                        { value: '', label: gt('placeholders.select') || 'Select' },
                                                        { value: 'ID', label: gt('options.idCard') || 'ID Card' },
                                                        { value: 'PASSPORT', label: gt('options.passport') || 'Passport' }
                                                    ]
                                                },
                                                {
                                                    label: gt('fields.organization') || "Organization Host",
                                                    value: request.organization
                                                },
                                                {
                                                    label: gt('fields.passStartingDate') || "Pass Starting Date",
                                                    value: isEditMode ? (editData.dateOfVisit !== undefined ? editData.dateOfVisit : request.dateOfVisit) : new Date(request.dateOfVisit).toLocaleDateString(),
                                                    fieldName: 'dateOfVisit',
                                                    fieldType: 'date'
                                                },
                                                // Show Pass End Date only for Permanent passes
                                                ...(isPermanent(isEditMode ? (editData.passTypeId !== undefined ? editData.passTypeId : request.passTypeId) : request.passTypeId) ? [{
                                                    label: gt('fields.passEndDate') || "Pass Ending Date",
                                                    value: isEditMode ? (editData.passEndDate !== undefined ? editData.passEndDate : request.passEndDate) : new Date(request.passEndDate).toLocaleDateString(),
                                                    fieldName: 'passEndDate',
                                                    fieldType: 'date' as const
                                                }] : []),
                                                // Show Visit Duration only for Temporary passes
                                                ...(!isPermanent(isEditMode ? (editData.passTypeId !== undefined ? editData.passTypeId : request.passTypeId) : request.passTypeId) ? [{
                                                    label: gt('fields.visitduration') || "Visit Duration",
                                                    value: isEditMode
                                                        ? (editData.visitduration !== undefined ? editData.visitduration : request.visitduration || '')
                                                        : (request.visitduration === '1_DAY' ? gt('options.oneDay') || '1 Day' :
                                                            request.visitduration === '1_WEEK' ? gt('options.oneWeek') || '1 Week' :
                                                                request.visitduration === '1_MONTH' ? gt('options.oneMonth') || '1 Month' : request.visitduration || '-'),
                                                    fieldName: 'visitduration',
                                                    fieldType: 'select' as const,
                                                    options: [
                                                        { value: '', label: gt('placeholders.selectDate') || 'Select Date' },

                                                        { value: '1_DAY', label: gt('options.oneDay') || '1 Day' },
                                                        { value: '2_DAY', label: gt('options.twoDay') || '2 Days' },
                                                        { value: '3_DAY', label: gt('options.threeDay') || '3 Days' },
                                                        { value: '4_DAY', label: gt('options.fourDay') || '4 Days' },
                                                        { value: '5_DAY', label: gt('options.fiveDay') || '5 Days' },
                                                        { value: '10_DAY', label: gt('options.tenDay') || '10 Days' },

                                                        { value: '1_MONTH', label: gt('options.oneMonth') || '1 Month' },
                                                        { value: '2_MONTH', label: gt('options.twoMonth') || '2 Months' },
                                                        { value: '3_MONTH', label: gt('options.threeMonth') || '3 Months' },


                                                    ]
                                                }] : []),
                                                {
                                                    label: gt('fields.passFor') || "Beneficiary of the permit",
                                                    value: isEditMode ? (editData.passFor !== undefined ? (editData.passFor || 'VISITOR') : (request.passFor || 'VISITOR')) : (request.passFor === 'VISITOR' ? gt('options.VISITOR') || 'Visitor' : request.passFor === 'SUB_CONTRACTOR' ? gt('options.SUB_CONTRACTOR') || 'Sub contractor' : request.passFor === 'SERVICE_PROVIDER' ? gt('options.SERVICE_PROVIDER') || 'Service provider' : request.passFor || 'Visitor'),
                                                    fieldName: 'passFor',
                                                    fieldType: 'select',
                                                    options: [
                                                        { value: '', label: gt('placeholders.selectBeneficiary') || 'Select Beneficiary' },
                                                        { value: 'VISITOR', label: gt('options.VISITOR') || 'Visitor' },
                                                        { value: 'SUB_CONTRACTOR', label: gt('options.SUB_CONTRACTOR') || 'Sub contractor' },
                                                        { value: 'SERVICE_PROVIDER', label: gt('options.SERVICE_PROVIDER') || 'Service provider' },
                                                    ]
                                                },
                                                {
                                                    label: gt('fields.purposeOfVisit') || "Purpose of visit",
                                                    value: isEditMode ? (editData.purposeOfVisit !== undefined ? editData.purposeOfVisit : request.purposeOfVisit) : request.purposeOfVisit,
                                                    fieldName: 'purposeOfVisit',
                                                    fieldType: 'textarea'
                                                },
                                            ]}
                                        />

                                        <div className="my-8 border-t border-gray-100"></div>

                                        <InfoSection
                                            title={t('passHolderInfo') || "Pass Holder Info"}
                                            isEditable={isEditMode && request.status === 'PENDING'}
                                            onChange={(fieldName, value) => {
                                                // Convert passTypeId to number if it's a select field
                                                if (fieldName === 'passTypeId') {
                                                    setEditData(prev => ({ ...prev, [fieldName]: value ? Number(value) : null }));
                                                } else {
                                                    setEditData(prev => ({ ...prev, [fieldName]: value }));
                                                }
                                            }}

                                            data={[
                                                {
                                                    label: gt('fields.fullNameAr') || "Holder Name(Ar)",
                                                    value: isEditMode ? (editData.applicantNameAr !== undefined ? editData.applicantNameAr : request.applicantNameAr) : request.applicantNameAr,
                                                    fieldName: 'applicantNameAr'
                                                },
                                                // Show Full Name (AR) only for Temporary passes
                                                ...(!isPermanent(isEditMode ? (editData.passTypeId !== undefined ? editData.passTypeId : request.passTypeId) : request.passTypeId) ? [{
                                                    

                                                    label: gt('fields.fullNameEn') || "Holder Name(En)",
                                                    value: isEditMode ? (editData.applicantNameEn !== undefined ? editData.applicantNameEn : request.applicantNameEn) : request.applicantNameEn,
                                                    fieldName: 'applicantNameEn'
                                                }] : []),

                                                {
                                                    label: gt('fields.email') || "Email",
                                                    value: isEditMode ? (editData.applicantEmail !== undefined ? editData.applicantEmail : request.applicantEmail) : request.applicantEmail,
                                                    fieldName: 'applicantEmail'
                                                },
                                                {
                                                    label: gt('fields.gender') || "Gender",
                                                    value: isEditMode ? (editData.gender !== undefined ? editData.gender : request.gender) : (request.gender === 'MALE' ? gt('options.male') || 'Male' : request.gender === 'FEMALE' ? gt('options.female') || 'Female' : request.gender),
                                                    fieldName: 'gender',
                                                    fieldType: 'select',
                                                    options: [
                                                        { value: '', label: gt('placeholders.select') || 'Select' },
                                                        { value: 'MALE', label: gt('options.male') || 'Male' },
                                                        { value: 'FEMALE', label: gt('options.female') || 'Female' }
                                                    ]
                                                },
                                                {
                                                    label: gt('fields.profession') || "Profession",
                                                    value: isEditMode ? (editData.profession !== undefined ? editData.profession : request.profession) : request.profession,
                                                    fieldName: 'profession',
                                                    fieldType: 'select',
                                                    options: [
                                                        { value: '', label: gt('placeholders.select') || 'Select' },
                                                        { value: 'Engineer', label: gt('options.engineer') || 'Engineer' },
                                                        { value: 'Technician', label: gt('options.technician') || 'Technician' },
                                                        { value: 'Visitor', label: gt('options.visitor') || 'Visitor' },
                                                        { value: 'Technical', label: gt('options.technical') || 'Technical' },
                                                        { value: 'Manager', label: gt('options.manager') || 'Manager' },
                                                        { value: 'Administrator', label: gt('options.administrator') || 'Administrator' },
                                                        { value: 'Driver', label: gt('options.driver') || 'Driver' },
                                                        { value: 'Pro', label: gt('options.pro') || 'Pro' },
                                                        { value: 'Financial', label: gt('options.financial') || 'Financial' },
                                                        { value: 'Hr', label: gt('options.hr') || 'HR' },
                                                        { value: 'Marine', label: gt('options.marine') || 'Marine' },
                                                        { value: 'Security', label: gt('options.security') || 'Security' },
                                                        { value: 'Marketing', label: gt('options.marketing') || 'Marketing' },
                                                        { value: 'Procurement', label: gt('options.procurement') || 'Procurement' },
                                                        { value: 'Other', label: gt('options.other') || 'Other' }

                                                    ]
                                                },
                                                {
                                                    label: gt('fields.otherProfessions') || "Other Professions",
                                                    value: isEditMode ? (editData.otherProfessions !== undefined ? editData.otherProfessions : request.otherProfessions || '') : (request.otherProfessions || '-'),
                                                    fieldName: 'otherProfessions'
                                                },

                                                {
                                                    label: gt('fields.idPassportNumber') || "ID Or Passport Number",
                                                    value: isEditMode ? (editData.passportIdNumber !== undefined ? editData.passportIdNumber : request.passportIdNumber) : request.passportIdNumber,
                                                    fieldName: 'passportIdNumber'
                                                },
                                            ]}
                                        />
                                    </div>

                                    {/* Right Column: Documents */}
                                    <div>
                                        <DocumentCard
                                            title={gt('fields.copyOfCivilId') || "Copy of Civil ID"}
                                            imageUrl={request.passportIdImagePath}
                                            isEditable={isEditMode && request.status === 'PENDING'}
                                            fieldName="passportIdImage"
                                            onChange={(fieldName, file) => {
                                                setFiles(prev => ({ ...prev, [fieldName]: file }));
                                            }}
                                            onView={() => {
                                                if (request.passportIdImagePath) {
                                                    setImageModal({
                                                        isOpen: true,
                                                        imageUrl: request.passportIdImagePath,
                                                        title: gt('fields.copyOfCivilId') || "Copy of Civil ID"
                                                    });
                                                }
                                            }}
                                        />


                                        {/* Photo */}
                                        <DocumentCard
                                            title={gt('fields.photo') || "Photo"}
                                            imageUrl={request.uploads.find(u => u.fileType === 'PHOTO')?.filePath || null}
                                            isEditable={isEditMode && request.status === 'PENDING'}
                                            fieldName="photo"
                                            onChange={(fieldName, file) => {
                                                setFiles(prev => ({ ...prev, [fieldName]: file }));
                                            }}
                                            onView={() => {
                                                const photoUrl = request.uploads.find(u => u.fileType === 'PHOTO')?.filePath;
                                                if (photoUrl) {
                                                    setImageModal({
                                                        isOpen: true,
                                                        imageUrl: photoUrl,
                                                        title: gt('fields.photo') || "Photo"
                                                    });
                                                }
                                            }}
                                        />

                                        {/* Other Documents */}
                                        {request.uploads
                                            .filter(u => u.fileType.startsWith('OTHER'))
                                            .map((upload, idx) => (
                                                <DocumentCard
                                                    key={upload.id}
                                                    title={`${gt('fields.otherDocuments1') || "Other Documents"} ${idx + 1}`}
                                                    imageUrl={upload.filePath}
                                                    isEditable={isEditMode && request.status === 'PENDING'}
                                                    fieldName={idx === 0 ? 'otherDocuments1' : 'otherDocuments2'}
                                                    onChange={(fieldName, file) => {
                                                        setFiles(prev => ({ ...prev, [fieldName]: file }));
                                                    }}
                                                    onView={() => {
                                                        if (upload.filePath) {
                                                            setImageModal({
                                                                isOpen: true,
                                                                imageUrl: upload.filePath,
                                                                title: `${gt('fields.otherDocuments1') || "Other Documents"} ${idx + 1}`
                                                            });
                                                        }
                                                    }}
                                                />
                                            ))}

                                        {/* Add empty slots for other documents if they don't exist */}
                                        {isEditMode && request.uploads.filter(u => u.fileType.startsWith('OTHER')).length === 0 && (
                                            <>
                                                <DocumentCard
                                                    title={`${gt('fields.otherDocuments1') || "Other Documents"} 1`}
                                                    imageUrl={null}
                                                    isEditable={isEditMode && request.status === 'PENDING'}
                                                    fieldName="otherDocuments1"
                                                    onChange={(fieldName, file) => {
                                                        setFiles(prev => ({ ...prev, [fieldName]: file }));
                                                    }}
                                                />
                                                <DocumentCard
                                                    title={`${gt('fields.otherDocuments2') || "Other Documents"} 2`}
                                                    imageUrl={null}
                                                    isEditable={isEditMode && request.status === 'PENDING'}
                                                    fieldName="otherDocuments2"
                                                    onChange={(fieldName, file) => {
                                                        setFiles(prev => ({ ...prev, [fieldName]: file }));
                                                    }}
                                                />
                                            </>
                                        )}
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
                                        onClick={() => {
                                            // Update editData with rejection reason and close modal
                                            // Status will be saved when user clicks "Save Changes"
                                            setEditData(prev => ({
                                                ...prev,
                                                status: 'REJECTED',
                                                rejectionReason: rejectionReason.trim()
                                            }));
                                            setShowRejectModal(false);
                                            setRejectionReason('');
                                        }}
                                        className="btn btn-danger flex-1"
                                        disabled={rejectionReason.length < 10}
                                    >
                                        {t('confirmReject')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Image Modal */}
                {imageModal.isOpen && imageModal.imageUrl && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
                        onClick={() => setImageModal({ isOpen: false, imageUrl: null, title: '' })}
                    >
                        <div
                            className="relative w-[80vw] h-[80vh] max-w-[90vw] max-h-[90vh] bg-white rounded-lg overflow-hidden shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Close Button */}
                            <button
                                onClick={() => setImageModal({ isOpen: false, imageUrl: null, title: '' })}
                                className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
                                aria-label="Close"
                            >
                                <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>

                            {/* Title */}
                            {imageModal.title && (
                                <div className="absolute top-4 left-4 z-10 bg-white px-4 py-2 rounded-lg shadow-lg">
                                    <h3 className="text-lg font-semibold text-gray-900">{imageModal.title}</h3>
                                </div>
                            )}

                            {/* Image */}
                            <div className="w-full h-full flex items-center justify-center p-4">
                                <img
                                    src={imageModal.imageUrl}
                                    alt={imageModal.title}
                                    className="max-w-full max-h-full object-contain"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
}
