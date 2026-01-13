'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useRouter, Link } from '@/i18n/navigation';
import { useLocale, useTranslations } from 'next-intl';
import Header from '../../components/Header';
import { Sidebar } from '@/components/layout';
import { getSidebarItems } from '@/config/navigation';

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

        fetch('/api/auth/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setUser(data.data.user);
                    localStorage.setItem('user', JSON.stringify(data.data.user));
                } else {
                    if (data.error === 'Unauthorized' || data.error === 'Forbidden') {
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        router.push('/admin/login');
                    }
                }
            })
            .catch(err => console.error('Error refreshing user data:', err));

        if (requestId) {
            fetchRequestDetails(token, requestId);
        }
    }, [requestId]);

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
        } catch (error) {
            console.error('Error fetching request details:', error);
            setError('Failed to load request details');
        } finally {
            setLoading(false);
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
                return 'bg-success-100 text-success-700';
            case 'REJECTED':
                return 'bg-danger-100 text-danger-700';
            case 'PENDING':
                return 'bg-warning-100 text-warning-700';
            default:
                return 'bg-gray-100 text-gray-700';
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
                        <>
                            <div className="mb-6">
                                <Link href="/admin/requests" className="text-info-500 hover:text-primary-700 flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isRtl ? "M14 5l7 7m0 0l-7 7m7-7H3" : "M10 19l-7-7m0 0l7-7m-7 7h18"} />
                                    </svg>
                                    {t('backToRequests')}
                                </Link>
                            </div>

                            {error && (
                                <div className="mb-6 p-4 bg-danger-50 border border-danger-200 rounded-lg text-danger-700">
                                    {error}
                                </div>
                            )}

                            {success && (
                                <div className="mb-6 p-4 bg-success-50 border border-success-200 rounded-lg text-success-700">
                                    {success}
                                </div>
                            )}

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Main Details */}
                                <div className="lg:col-span-2 space-y-6">
                                    {/* Request Number & Status */}
                                    <div className="bg-white rounded-[12px] border border-gray-100 p-6 shadow-sm">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-gray-600 mb-1">{t('requestNumber')}</p>
                                                <p className="text-2xl font-bold text-gray-900">{request.requestNumber}</p>
                                            </div>
                                            <span className={`px-4 py-2 text-sm font-medium rounded-full ${getStatusColor(request.status)}`}>
                                                {dt(`status.${request.status}`)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Applicant Information */}
                                    <div className="bg-white rounded-[12px] border border-gray-100 p-6 shadow-sm">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('applicantInfo')}</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm text-gray-600 mb-1">{t('name')} (EN)</p>
                                                <p className="text-gray-900 font-medium">{request.applicantNameEn}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600 mb-1">{t('name')} (AR)</p>
                                                <p className="text-gray-900 font-medium">{request.applicantNameAr}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600 mb-1">{t('email')}</p>
                                                <p className="text-gray-900 font-medium">{request.applicantEmail}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600 mb-1">{t('passportId')}</p>
                                                <p className="text-gray-900 font-medium">{request.passportIdNumber}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600 mb-1">{t('document')}</p>
                                                {request.passportIdImagePath ? (
                                                    <a
                                                        href={request.passportIdImagePath}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-info-500 hover:text-primary-700 font-medium"
                                                    >
                                                        {t('viewDocument')} →
                                                    </a>
                                                ) : (
                                                    <p className="text-gray-500 text-sm">{t('noDocument') || 'No document uploaded'}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Request Details */}
                                    <div className="bg-white rounded-[12px] border border-gray-100 p-6 shadow-sm">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('detailsTitle')}</h3>
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-sm text-gray-600 mb-1">{t('type')}</p>
                                                <p className="text-gray-900 font-medium">
                                                    {dt(`types.${request.requestType}`)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600 mb-1">{t('visitDate')}</p>
                                                <p className="text-gray-900 font-medium">
                                                    {new Date(request.dateOfVisit).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600 mb-1">{t('purpose')}</p>
                                                <p className="text-gray-900">{request.purposeOfVisit}</p>
                                            </div>
                                            {request.externalReference && (
                                                <div>
                                                    <p className="text-sm text-gray-600 mb-1">{t('externalRef')}</p>
                                                    <p className="text-gray-900 font-mono text-sm">{request.externalReference}</p>
                                                </div>
                                            )}
                                            {request.rejectionReason && (
                                                <div>
                                                    <p className="text-sm text-gray-600 mb-1">{t('rejectionReason')}</p>
                                                    <p className="text-danger-700">{request.rejectionReason}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Activity Log */}
                                    <div className="bg-white rounded-[12px] border border-gray-100 p-6 shadow-sm">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('activityLog')}</h3>
                                        <div className="space-y-3">
                                            {request.logs.map((log) => (
                                                <div key={log.id} className="flex gap-3 pb-3 border-b border-gray-200 last:border-0">
                                                    <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
                                                    <div className="flex-1">
                                                        <p className="text-gray-900">{log.actionPerformed}</p>
                                                        <p className="text-sm text-gray-500">
                                                            {log.user?.name || 'System'} • {new Date(log.timestamp).toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Sidebar */}
                                <div className="space-y-6">
                                    {/* Actions */}
                                    {request.status === 'PENDING' && (
                                        <div className="bg-white rounded-[12px] border border-gray-100 p-6 shadow-sm">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('actions')}</h3>
                                            <div className="space-y-3">
                                                <button
                                                    onClick={handleApprove}
                                                    disabled={processing}
                                                    className="btn btn-success w-full"
                                                >
                                                    {processing ? t('approving') : t('approve')}
                                                </button>
                                                <button
                                                    onClick={() => setShowRejectModal(true)}
                                                    disabled={processing}
                                                    className="btn btn-danger w-full"
                                                >
                                                    {t('reject')}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Metadata */}
                                    <div className="bg-white rounded-[12px] border border-gray-100 p-6 shadow-sm">
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-sm text-gray-600 mb-1">{t('submittedOn')}</p>
                                                <p className="text-gray-900 text-sm">{new Date(request.createdAt).toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600 mb-1">{t('lastUpdated')}</p>
                                                <p className="text-gray-900 text-sm">{new Date(request.updatedAt).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </>
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
