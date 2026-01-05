'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';

interface RequestDetails {
    id: number;
    requestNumber: string;
    applicantName: string;
    applicantEmail: string;
    passportIdNumber: string;
    passportIdImagePath: string;
    purposeOfVisit: string;
    dateOfVisit: string;
    requestType: string;
    status: string;
    rejectionReason: string | null;
    externalReference: string | null;
    createdAt: string;
    updatedAt: string;
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

    const [locale, setLocale] = useState<'en' | 'ar'>('en');
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

    const toggleLocale = () => {
        setLocale(prev => prev === 'en' ? 'ar' : 'en');
    };

    const t = {
        en: {
            title: 'Request Details',
            dashboard: 'Dashboard',
            requests: 'Requests',
            users: 'Users',
            logs: 'Activity Logs',
            logout: 'Logout',
            backToRequests: 'Back to Requests',
            requestNumber: 'Request Number',
            applicantInfo: 'Applicant Information',
            name: 'Name',
            email: 'Email',
            passportId: 'Passport/ID Number',
            requestDetails: 'Request Details',
            type: 'Type',
            visitDate: 'Visit Date',
            purpose: 'Purpose of Visit',
            status: 'Status',
            submittedOn: 'Submitted On',
            lastUpdated: 'Last Updated',
            externalRef: 'External Reference',
            rejectionReason: 'Rejection Reason',
            document: 'Uploaded Document',
            viewDocument: 'View Document',
            activityLog: 'Activity Log',
            actions: 'Actions',
            approve: 'Approve Request',
            reject: 'Reject Request',
            approving: 'Approving...',
            rejecting: 'Rejecting...',
            rejectModalTitle: 'Reject Request',
            rejectModalDesc: 'Please provide a reason for rejecting this request:',
            rejectReasonPlaceholder: 'Enter rejection reason (minimum 10 characters)',
            cancel: 'Cancel',
            confirmReject: 'Confirm Rejection',
            types: {
                VISITOR: 'Visitor',
                CONTRACTOR: 'Contractor',
                EMPLOYEE: 'Employee',
                VEHICLE: 'Vehicle',
            },
            statuses: {
                PENDING: 'Pending',
                APPROVED: 'Approved',
                REJECTED: 'Rejected',
            },
            permissionDenied: 'You do not have permission to view this request.',
            contactAdmin: 'Please contact your administrator if you believe this is a mistake.',
        },
        ar: {
            title: 'تفاصيل الطلب',
            dashboard: 'لوحة التحكم',
            requests: 'الطلبات',
            users: 'المستخدمون',
            logs: 'سجل النشاط',
            logout: 'تسجيل الخروج',
            backToRequests: 'العودة للطلبات',
            requestNumber: 'رقم الطلب',
            applicantInfo: 'معلومات مقدم الطلب',
            name: 'الاسم',
            email: 'البريد الإلكتروني',
            passportId: 'رقم جواز السفر/الهوية',
            requestDetails: 'تفاصيل الطلب',
            type: 'النوع',
            visitDate: 'تاريخ الزيارة',
            purpose: 'الغرض من الزيارة',
            status: 'الحالة',
            submittedOn: 'تم التقديم في',
            lastUpdated: 'آخر تحديث',
            externalRef: 'المرجع الخارجي',
            rejectionReason: 'سبب الرفض',
            document: 'المستند المرفوع',
            viewDocument: 'عرض المستند',
            activityLog: 'سجل النشاط',
            actions: 'الإجراءات',
            approve: 'الموافقة على الطلب',
            reject: 'رفض الطلب',
            approving: 'جاري الموافقة...',
            rejecting: 'جاري الرفض...',
            rejectModalTitle: 'رفض الطلب',
            rejectModalDesc: 'يرجى تقديم سبب لرفض هذا الطلب:',
            rejectReasonPlaceholder: 'أدخل سبب الرفض (10 أحرف على الأقل)',
            cancel: 'إلغاء',
            confirmReject: 'تأكيد الرفض',
            types: {
                VISITOR: 'زائر',
                CONTRACTOR: 'مقاول',
                EMPLOYEE: 'موظف',
                VEHICLE: 'مركبة',
            },
            statuses: {
                PENDING: 'قيد الانتظار',
                APPROVED: 'موافق عليه',
                REJECTED: 'مرفوض',
            },
            permissionDenied: 'ليس لديك صلاحية لعرض هذا الطلب.',
            contactAdmin: 'يرجى الاتصال بالمسؤول إذا كنت تعتقد أن هذا خطأ.',
        },
    };

    const content = t[locale];

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token) {
            router.push('/admin/login');
            return;
        }

        // Initial load from localStorage for speed
        if (userData) {
            setUser(JSON.parse(userData));
        }

        // Fetch fresh user data
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

    const handleLogout = async () => {
        const token = localStorage.getItem('token');

        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
        } catch (error) {
            console.error('Logout error:', error);
        }

        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/admin/login');
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
                    <p className="text-gray-600">Request not found</p>
                    <Link href="/admin/requests" className="text-primary-600 hover:text-primary-700 mt-4 inline-block">
                        Back to Requests
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
            {/* Header */}
            <header className="bg-white shadow-sm">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                                <span className="text-white text-xl font-bold">M</span>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">Majis Industrial Services</h1>
                                <p className="text-sm text-gray-600">{content.title}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={toggleLocale}
                                className="btn btn-secondary text-sm"
                            >
                                {locale === 'en' ? 'العربية' : 'English'}
                            </button>
                            <div className="text-right">
                                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                                <p className="text-xs text-gray-500">{user?.role}</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="btn btn-danger text-sm"
                            >
                                {content.logout}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Navigation */}
            <nav className="bg-white border-b border-gray-200">
                <div className="container mx-auto px-4">
                    <div className="flex gap-6">
                        <Link href="/admin/dashboard" className="px-4 py-3 border-b-2 border-transparent text-gray-600 hover:text-gray-900">
                            {content.dashboard}
                        </Link>
                        {hasPermission('MANAGE_REQUESTS') && (
                            <Link href="/admin/requests" className="px-4 py-3 border-b-2 border-primary-600 text-primary-600 font-medium">
                                {content.requests}
                            </Link>
                        )}
                        {hasPermission('MANAGE_USERS') && (
                            <Link href="/admin/users" className="px-4 py-3 border-b-2 border-transparent text-gray-600 hover:text-gray-900">
                                {content.users}
                            </Link>
                        )}
                        {hasPermission('VIEW_LOGS') && (
                            <Link href="/admin/activity" className="px-4 py-3 border-b-2 border-transparent text-gray-600 hover:text-gray-900">
                                {content.logs}
                            </Link>
                        )}
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                {permissionDenied ? (
                    <div className="card p-12 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">{content.permissionDenied}</h3>
                        <p className="text-gray-500">{content.contactAdmin}</p>
                        <Link href="/admin/requests" className="text-primary-600 hover:text-primary-700 mt-4 inline-block">
                            {content.backToRequests}
                        </Link>
                    </div>
                ) : request ? (
                    <>
                        <div className="mb-6">
                            <Link href="/admin/requests" className="text-primary-600 hover:text-primary-700 flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                {content.backToRequests}
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
                                <div className="card">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <p className="text-sm text-gray-600 mb-1">{content.requestNumber}</p>
                                            <p className="text-2xl font-bold text-gray-900">{request.requestNumber}</p>
                                        </div>
                                        <span className={`px-4 py-2 text-sm font-medium rounded-full ${getStatusColor(request.status)}`}>
                                            {content.statuses[request.status as keyof typeof content.statuses]}
                                        </span>
                                    </div>
                                </div>

                                {/* Applicant Information */}
                                <div className="card">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">{content.applicantInfo}</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-600 mb-1">{content.name}</p>
                                            <p className="text-gray-900 font-medium">{request.applicantName}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600 mb-1">{content.email}</p>
                                            <p className="text-gray-900 font-medium">{request.applicantEmail}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600 mb-1">{content.passportId}</p>
                                            <p className="text-gray-900 font-medium">{request.passportIdNumber}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600 mb-1">{content.document}</p>
                                            <a
                                                href={request.passportIdImagePath}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-primary-600 hover:text-primary-700 font-medium"
                                            >
                                                {content.viewDocument} →
                                            </a>
                                        </div>
                                    </div>
                                </div>

                                {/* Request Details */}
                                <div className="card">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">{content.requestDetails}</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-sm text-gray-600 mb-1">{content.type}</p>
                                            <p className="text-gray-900 font-medium">
                                                {content.types[request.requestType as keyof typeof content.types]}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600 mb-1">{content.visitDate}</p>
                                            <p className="text-gray-900 font-medium">
                                                {new Date(request.dateOfVisit).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600 mb-1">{content.purpose}</p>
                                            <p className="text-gray-900">{request.purposeOfVisit}</p>
                                        </div>
                                        {request.externalReference && (
                                            <div>
                                                <p className="text-sm text-gray-600 mb-1">{content.externalRef}</p>
                                                <p className="text-gray-900 font-mono text-sm">{request.externalReference}</p>
                                            </div>
                                        )}
                                        {request.rejectionReason && (
                                            <div>
                                                <p className="text-sm text-gray-600 mb-1">{content.rejectionReason}</p>
                                                <p className="text-danger-700">{request.rejectionReason}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Activity Log */}
                                <div className="card">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">{content.activityLog}</h3>
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
                                    <div className="card">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">{content.actions}</h3>
                                        <div className="space-y-3">
                                            <button
                                                onClick={handleApprove}
                                                disabled={processing}
                                                className="btn btn-success w-full"
                                            >
                                                {processing ? content.approving : content.approve}
                                            </button>
                                            <button
                                                onClick={() => setShowRejectModal(true)}
                                                disabled={processing}
                                                className="btn btn-danger w-full"
                                            >
                                                {content.reject}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Metadata */}
                                <div className="card">
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-sm text-gray-600 mb-1">{content.submittedOn}</p>
                                            <p className="text-gray-900 text-sm">{new Date(request.createdAt).toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600 mb-1">{content.lastUpdated}</p>
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
                            <h3 className="text-xl font-bold text-gray-900 mb-2">{content.rejectModalTitle}</h3>
                            <p className="text-gray-600 mb-4">{content.rejectModalDesc}</p>

                            <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder={content.rejectReasonPlaceholder}
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
                                    {content.cancel}
                                </button>
                                <button
                                    onClick={handleReject}
                                    className="btn btn-danger flex-1"
                                    disabled={processing || rejectionReason.length < 10}
                                >
                                    {processing ? content.rejecting : content.confirmReject}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
