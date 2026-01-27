'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname, Link } from '@/i18n/navigation';
import { Sidebar } from '@/components/layout';
import { getSidebarItems } from '@/config/navigation';
import Header from '../components/Header';
import { useLocale, useTranslations } from 'next-intl';
import { TableFilter } from '../components/TableFilter';
import { StatusUpdate } from './components/StatusUpdate';
import RejectSuccessModal from '@/components/ui/RejectSuccessModal';
import { apiFetch } from '@/lib/api-client';

interface Request {
    id: number;
    requestNumber: string;
    applicantNameEn: string;
    applicantNameAr: string;
    applicantEmail: string;
    applicantPhone?: string | null;
    gender: string;
    profession: string;
    passportIdNumber: string;
    passportIdImagePath?: string | null;
    nationality: string;
    identification: string;
    organization: string;
    validFrom: string;
    validTo: string;
    purposeOfVisit: string;
    dateOfVisit: string;
    requestType: string;
    status: string;
    passFor?: string | null;
    createdAt: string;
    updatedAt: string;
    approvedBy?: {
        id: number;
        name: string;
        email: string;
    } | null;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export default function AdminRequestsPage() {
    const router = useRouter();
    const pathname = usePathname();
    const locale = useLocale();
    const isRtl = locale === 'ar';
    const t = useTranslations('Admin.requests');
    const dt = useTranslations('Admin.dashboard'); // For types and statuses if needed

    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState<Request[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [user, setUser] = useState<any>(null);
    const [filters, setFilters] = useState({
        status: '',
        requestType: '',
        search: '',
        date: '',
        page: 1,
    });

    const [permissionDenied, setPermissionDenied] = useState(false);
    const [showRejectSuccessModal, setShowRejectSuccessModal] = useState(false);
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

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

        // Initial load from localStorage for speed
        if (userData) {
            setUser(JSON.parse(userData));
        }

        fetchRequests();
    }, [filters]);

    const fetchRequests = async (): Promise<void> => {
        setLoading(true);
        setPermissionDenied(false);
        try {
            const params = new URLSearchParams();
            if (filters.status) params.append('status', filters.status);
            if (filters.requestType) params.append('requestType', filters.requestType);
            if (filters.search) params.append('search', filters.search);
            if (filters.date) params.append('date', filters.date);
            params.append('page', filters.page.toString());
            params.append('limit', '20');

            const result = await apiFetch<{ requests: any[]; pagination: any }>(`/api/admin/requests?${params}`);

            // Handle successful response with empty data
            setRequests(result.requests || []);
            setPagination(result.pagination || null);
        } catch (error: any) {
            console.error('Error fetching requests:', error);
            // Check if it's a permission error (403)
            if (error.message?.includes('Forbidden') || error.message?.includes('permission')) {
                setPermissionDenied(true);
            }
            // Set empty state on error so UI can still render
            setRequests([]);
            setPagination(null);
            // apiFetch handles 401 (token expiration) automatically with redirect
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id: number, status: 'APPROVED' | 'REJECTED' | 'PENDING', rejectionReason?: string) => {
        try {
            let endpoint = '';
            let body = {};

            if (status === 'APPROVED') {
                endpoint = `/api/admin/requests/${id}/approve`;
            } else if (status === 'REJECTED') {
                endpoint = `/api/admin/requests/${id}/reject`;
                body = { rejectionReason };
            } else {
                // If we want to support setting back to pending, we might need an endpoint or just return
                console.warn('Setting to PENDING not fully supported yet via simplified API');
                throw new Error('Setting to PENDING is not supported');
            }

            await apiFetch(endpoint, {
                method: 'POST',
                body: JSON.stringify(body),
            });

            // Refresh the list to reflect changes
            await fetchRequests();

        } catch (error: any) {
            console.error('Error updating status:', error);
            // apiFetch handles 401 (token expiration) automatically with redirect
            throw error; // Re-throw so StatusUpdate component can handle it
        }
    };

    const handleLogout = async () => {
        try {
            await apiFetch('/api/auth/logout', {
                method: 'POST',
            });
        } catch (error) {
            console.error('Logout error:', error);
            // Continue with logout even if API call fails
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

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const year = date.getFullYear();
        return `${month}\\${day}\\${year}`;
    };

    const getPassTypeLabel = (passFor: string | null | undefined) => {
        if (!passFor) return '-';
        return passFor === 'TEMPORARY' ? 'Temporary' : passFor === 'PERMANENT' ? 'Permanent' : passFor;
    };

    const getPassForLabel = (requestType: string) => {
        return dt(`types.${requestType}`) || requestType;
    };

    const getImageUrl = (imagePath: string | null | undefined) => {
        if (!imagePath) return null;
        if (imagePath.startsWith('data:')) {
            return imagePath;
        }
        if (imagePath.startsWith('http')) {
            return imagePath;
        }
        return `/api/uploads/${imagePath}`;
    };

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
    };

    const handlePageChange = (newPage: number) => {
        setFilters(prev => ({ ...prev, page: newPage }));
    };

    const handleResetFilters = () => {
        setFilters({
            status: '',
            requestType: '',
            search: '',
            date: '',
            page: 1,
        });
    };

    const toggleRowExpansion = (requestId: number) => {
        setExpandedRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(requestId)) {
                newSet.delete(requestId);
            } else {
                newSet.add(requestId);
            }
            return newSet;
        });
    };

    if (loading && requests.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading requests...</p>
                </div>
            </div>
        );
    }

    const sidebarItems = getSidebarItems(
        locale as 'en' | 'ar',
        user?.permissions || [],
        user?.role,
        pathname
    );

    return (
        <div className="min-h-screen bg-gray-50 flex" dir={isRtl ? 'rtl' : 'ltr'}>
            <Sidebar items={sidebarItems} locale={locale as 'en' | 'ar'} />

            <div className="flex-1" style={{ marginLeft: isRtl ? '0' : '16rem', marginRight: isRtl ? '16rem' : '0' }}>
                <Header />

                <main className="px-6 py-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('title')}</h2>

                    {permissionDenied ? (
                        <div className="card p-12 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">{dt('permissionDenied')}</h3>
                            <p className="text-gray-500">{dt('contactAdmin')}</p>
                        </div>
                    ) : (
                        <>
                            <TableFilter
                                currentFilters={{
                                    search: filters.search,
                                    status: filters.status,
                                    date: filters.date,
                                }}
                                onSearch={(val) => handleFilterChange('search', val)}
                                onStatusChange={(val) => handleFilterChange('status', val)}
                                onDateChange={(val) => handleFilterChange('date', val)}
                                onReset={handleResetFilters}
                            />

                            <div className="bg-white rounded-[12px] border border-gray-100 shadow-sm" style={{ overflow: 'visible' }}>
                                {requests.length > 0 ? (
                                    <>
                                        <div className="overflow-x-auto" style={{ overflowY: 'visible' }}>
                                            <table className="w-full min-w-[400px]">
                                                <thead className="bg-[#F9F9F9] border-b border-gray-100">
                                                    <tr>
                                                        <th className="px-2 sm:px-3 md:px-4 lg:px-6 py-3 md:py-4 text-center text-xs font-bold text-[#A1A1A1] uppercase tracking-wider whitespace-nowrap w-12"></th>
                                                        <th className="px-2 sm:px-3 md:px-4 lg:px-6 py-3 md:py-4 text-center text-xs font-bold text-[#A1A1A1] uppercase tracking-wider whitespace-nowrap">ID</th>
                                                        <th className="px-2 sm:px-3 md:px-4 lg:px-6 py-3 md:py-4 text-center text-xs font-bold text-[#A1A1A1] uppercase tracking-wider whitespace-nowrap">{t('columns.holderName')}</th>
                                                        <th className="px-2 sm:px-3 md:px-4 lg:px-6 py-3 md:py-4 text-center text-xs font-bold text-[#A1A1A1] uppercase tracking-wider whitespace-nowrap">{t('columns.status')}</th>
                                                        <th className="px-2 sm:px-3 md:px-4 lg:px-6 py-3 md:py-4 text-center text-xs font-bold text-[#A1A1A1] uppercase tracking-wider whitespace-nowrap">{t('columns.actions')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {requests.map((request) => {
                                                        const imageUrl = getImageUrl(request.passportIdImagePath);
                                                        const isExpanded = expandedRows.has(request.id);
                                                        return (
                                                            <React.Fragment key={request.id}>
                                                                <tr className="hover:bg-gray-50/50 transition-colors relative">
                                                                    <td className="px-2 sm:px-3 md:px-4 lg:px-6 py-3 md:py-4 text-center">
                                                                        <button
                                                                            onClick={() => toggleRowExpansion(request.id)}
                                                                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                                                                            aria-label={isExpanded ? 'Collapse row' : 'Expand row'}
                                                                        >
                                                                            <svg
                                                                                className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                                                                fill="none"
                                                                                stroke="currentColor"
                                                                                viewBox="0 0 24 24"
                                                                            >
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                                            </svg>
                                                                        </button>
                                                                    </td>
                                                                    <td className="px-2 sm:px-3 md:px-4 lg:px-6 py-3 md:py-4 text-[#747474] text-[12px] sm:text-[14px] text-center">{request.id}</td>
                                                                    <td className="px-2 sm:px-3 md:px-4 lg:px-6 py-3 md:py-4 text-[#222222] font-bold text-[12px] sm:text-[14px]">{request.applicantNameEn}</td>
                                                                    <td className="px-2 sm:px-3 md:px-4 lg:px-6 py-3 md:py-4 relative overflow-visible">
                                                                        <div className="flex justify-center">
                                                                            <StatusUpdate
                                                                                currentStatus={request.status}
                                                                                getStatusColor={getStatusColor}
                                                                                onUpdate={async (newStatus, rejectionReason) => {
                                                                                    try {
                                                                                        await handleStatusUpdate(request.id, newStatus, rejectionReason);
                                                                                    } catch (error: any) {
                                                                                        console.error('Status update error:', error);
                                                                                        throw error; // Re-throw to let StatusUpdate handle it
                                                                                    }
                                                                                }}
                                                                                onRejectSuccess={() => setShowRejectSuccessModal(true)}
                                                                                onEdit={() => router.push(`/admin/requests/${request.id}?edit=true`)}
                                                                            />
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-2 sm:px-3 md:px-4 lg:px-6 py-3 md:py-4">
                                                                        <Link
                                                                            href={`/admin/requests/${request.id}`}
                                                                            className="text-[#00B09C] hover:text-[#008f7e] text-[12px] sm:text-[14px] font-bold whitespace-nowrap"
                                                                        >
                                                                            {t('viewDetails')}
                                                                        </Link>
                                                                    </td>
                                                                </tr>
                                                                {isExpanded && (
                                                                    <tr className="bg-gray-50/30">
                                                                        <td colSpan={5} className="px-4 sm:px-6 md:px-8 py-4">
                                                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                                                                                <div>
                                                                                    <span className="font-semibold text-gray-700">{t('columns.date')}: </span>
                                                                                    <span className="text-gray-600">{formatDate(request.createdAt)}</span>
                                                                                </div>
                                                                                <div>
                                                                                    <span className="font-semibold text-gray-700">{t('columns.idNumber')}: </span>
                                                                                    <span className="text-gray-600">{request.passportIdNumber}</span>
                                                                                </div>
                                                                                <div>
                                                                                    <span className="font-semibold text-gray-700">{t('columns.telephone')}: </span>
                                                                                    <span className="text-gray-600">{request.applicantPhone || '-'}</span>
                                                                                </div>
                                                                                <div>
                                                                                    <span className="font-semibold text-gray-700">{t('columns.email')}: </span>
                                                                                    <span className="text-gray-600 break-all">{request.applicantEmail}</span>
                                                                                </div>
                                                                                <div>
                                                                                    <span className="font-semibold text-gray-700">{t('columns.passType')}: </span>
                                                                                    <span className="text-gray-600">{getPassTypeLabel(request.passFor)}</span>
                                                                                </div>
                                                                                <div>
                                                                                    <span className="font-semibold text-gray-700">{t('columns.passFor')}: </span>
                                                                                    <span className="text-gray-600">{getPassForLabel(request.requestType)}</span>
                                                                                </div>
                                                                                <div>
                                                                                    <span className="font-semibold text-gray-700">{t('columns.visitDate')}: </span>
                                                                                    <span className="text-gray-600">{formatDate(request.dateOfVisit)}</span>
                                                                                </div>
                                                                                {imageUrl && (
                                                                                    <div className="sm:col-span-2 lg:col-span-3">
                                                                                        <span className="font-semibold text-gray-700 block mb-2">{t('columns.uploaded')}: </span>
                                                                                        <img
                                                                                            src={imageUrl}
                                                                                            alt="Uploaded document"
                                                                                            className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded border border-gray-200"
                                                                                            onError={(e) => {
                                                                                                (e.target as HTMLImageElement).style.display = 'none';
                                                                                            }}
                                                                                        />
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                )}
                                                            </React.Fragment>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>

                                        {pagination && pagination.totalPages > 1 && (
                                            <div className="px-6 py-4 flex items-center justify-between border-t border-gray-100">
                                                <div className="text-[14px] text-[#A1A1A1] font-medium">
                                                    {t('pagination.showing')} {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} {t('pagination.of')} {pagination.total} {t('pagination.results')}
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handlePageChange(pagination.page - 1)}
                                                        disabled={pagination.page === 1}
                                                        className="px-4 py-2 border border-gray-100 rounded-[8px] text-[14px] font-bold text-gray-900 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                                    >
                                                        {t('pagination.previous')}
                                                    </button>
                                                    <button
                                                        onClick={() => handlePageChange(pagination.page + 1)}
                                                        disabled={pagination.page === pagination.totalPages}
                                                        className="px-4 py-2 border border-gray-100 rounded-[8px] text-[14px] font-bold text-gray-900 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                                    >
                                                        {t('pagination.next')}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-20">
                                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <p className="text-[#A1A1A1] text-[16px] font-medium">{t('noResults')}</p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </main>
            </div>

            <RejectSuccessModal
                isOpen={showRejectSuccessModal}
                onClose={() => setShowRejectSuccessModal(false)}
                message="The Request Was Successfully Rejected"
            />
        </div>
    );
}
