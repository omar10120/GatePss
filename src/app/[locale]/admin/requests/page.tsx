'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname, Link } from '@/i18n/navigation';
import { Sidebar } from '@/components/layout';
import { getSidebarItems } from '@/config/navigation';
import Header from '../components/Header';
import { useLocale, useTranslations } from 'next-intl';
import { TableFilter } from '../components/TableFilter';
import { StatusUpdate } from './components/StatusUpdate';
import RejectSuccessModal from '@/components/ui/RejectSuccessModal';

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

        fetchRequests(token);
    }, [filters]);

    const fetchRequests = async (token: string) => {
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

            const response = await fetch(`/api/admin/requests?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.status === 403) {
                setPermissionDenied(true);
                return;
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Failed to fetch requests' }));
                throw new Error(errorData.message || errorData.error || 'Failed to fetch requests');
            }

            const result = await response.json();

            // Handle successful response with empty data
            if (result.success && result.data) {
                setRequests(result.data.requests || []);
                setPagination(result.data.pagination || null);
            } else {
                // If response is not in expected format, set empty state
                setRequests([]);
                setPagination(null);
            }
        } catch (error: any) {
            console.error('Error fetching requests:', error);
            // Set empty state on error so UI can still render
            setRequests([]);
            setPagination(null);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id: number, status: 'APPROVED' | 'REJECTED' | 'PENDING', rejectionReason?: string) => {
        const token = localStorage.getItem('token');
        if (!token) return;

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
                return;
            }

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to update status');
            }

            // Refresh the list to reflect changes (or optimistically update)
            fetchRequests(token);

        } catch (error: any) {
            console.error('Error updating status:', error);
            alert(error.message || 'Failed to update status');
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
                                            <table className="w-full min-w-[1200px]">
                                                <thead className="bg-[#F9F9F9] border-b border-gray-100">
                                                    <tr>
                                                        <th className="px-3 md:px-6 py-4 text-center text-xs font-bold text-[#A1A1A1] uppercase tracking-wider whitespace-nowrap">ID</th>
                                                        <th className="px-3 md:px-6 py-4 text-center text-xs font-bold text-[#A1A1A1] uppercase tracking-wider whitespace-nowrap">{t('columns.date')}</th>
                                                        <th className="px-3 md:px-6 py-4 text-center text-xs font-bold text-[#A1A1A1] uppercase tracking-wider whitespace-nowrap hidden md:table-cell">{t('columns.idNumber')}</th>
                                                        <th className="px-3 md:px-6 py-4 text-center text-xs font-bold text-[#A1A1A1] uppercase tracking-wider whitespace-nowrap">{t('columns.holderName')}</th>
                                                        <th className="px-3 md:px-6 py-4 text-center text-xs font-bold text-[#A1A1A1] uppercase tracking-wider whitespace-nowrap hidden lg:table-cell">{t('columns.telephone')}</th>
                                                        <th className="px-3 md:px-6 py-4 text-center text-xs font-bold text-[#A1A1A1] uppercase tracking-wider whitespace-nowrap hidden lg:table-cell">{t('columns.email')}</th>
                                                        <th className="px-3 md:px-6 py-4 text-center text-xs font-bold text-[#A1A1A1] uppercase tracking-wider whitespace-nowrap hidden md:table-cell">{t('columns.passType')}</th>
                                                        <th className="px-3 md:px-6 py-4 text-center text-xs font-bold text-[#A1A1A1] uppercase tracking-wider whitespace-nowrap hidden lg:table-cell">{t('columns.passFor')}</th>
                                                        <th className="px-3 md:px-6 py-4 text-center text-xs font-bold text-[#A1A1A1] uppercase tracking-wider whitespace-nowrap hidden md:table-cell">{t('columns.visitDate')}</th>
                                                        <th className="px-3 md:px-6 py-4 text-center text-xs font-bold text-[#A1A1A1] uppercase tracking-wider whitespace-nowrap hidden lg:table-cell">{t('columns.uploaded')}</th>
                                                        <th className="px-3 md:px-6 py-4 text-center text-xs font-bold text-[#A1A1A1] uppercase tracking-wider whitespace-nowrap">{t('columns.status')}</th>
                                                        <th className="px-3 md:px-6 py-4 text-center text-xs font-bold text-[#A1A1A1] uppercase tracking-wider whitespace-nowrap">{t('columns.actions')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {requests.map((request) => {
                                                        const imageUrl = getImageUrl(request.passportIdImagePath);
                                                        return (
                                                            <tr key={request.id} className="hover:bg-gray-50/50 transition-colors relative">
                                                                <td className="px-3 md:px-6 py-4 text-[#747474] text-[14px] text-center">{request.id}</td>
                                                                <td className="px-3 md:px-6 py-4 text-[#747474] text-[14px] text-center whitespace-nowrap">{formatDate(request.createdAt)}</td>
                                                                <td className="px-3 md:px-6 py-4 text-[#747474] text-[14px] text-center hidden md:table-cell">{request.passportIdNumber}</td>
                                                                <td className="px-3 md:px-6 py-4 text-[#222222] font-bold text-[14px]">{request.applicantNameEn}</td>
                                                                <td className="px-3 md:px-6 py-4 text-[#747474] text-[14px] text-center hidden lg:table-cell">{request.applicantPhone || '-'}</td>
                                                                <td className="px-3 md:px-6 py-4 text-[#747474] text-[14px] text-center hidden lg:table-cell truncate max-w-[150px]">{request.applicantEmail}</td>
                                                                <td className="px-3 md:px-6 py-4 text-[#747474] text-[14px] text-center hidden md:table-cell">{getPassTypeLabel(request.passFor)}</td>
                                                                <td className="px-3 md:px-6 py-4 text-[#747474] text-[14px] text-center hidden lg:table-cell">{getPassForLabel(request.requestType)}</td>
                                                                <td className="px-3 md:px-6 py-4 text-[#747474] text-[14px] text-center hidden md:table-cell whitespace-nowrap">{formatDate(request.dateOfVisit)}</td>
                                                                <td className="px-3 md:px-6 py-4 text-center hidden lg:table-cell">
                                                                    {imageUrl ? (
                                                                        <div className="flex justify-center">
                                                                            <img
                                                                                src={imageUrl}
                                                                                alt="Uploaded document"
                                                                                className="w-10 h-10 md:w-12 md:h-12 object-cover rounded border border-gray-200"
                                                                                onError={(e) => {
                                                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                                                }}
                                                                            />
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-gray-400">-</span>
                                                                    )}
                                                                </td>
                                                                <td className="px-3 md:px-6 py-4 relative overflow-visible">
                                                                    <StatusUpdate
                                                                        currentStatus={request.status}
                                                                        getStatusColor={getStatusColor}
                                                                        onUpdate={(newStatus, rejectionReason) => handleStatusUpdate(request.id, newStatus, rejectionReason)}
                                                                        onRejectSuccess={() => setShowRejectSuccessModal(true)}
                                                                    />
                                                                </td>
                                                                <td className="px-3 md:px-6 py-4">
                                                                    <Link
                                                                        href={`/admin/requests/${request.id}`}
                                                                        className="text-[#00B09C] hover:text-[#008f7e] text-[14px] font-bold whitespace-nowrap"
                                                                    >
                                                                        {t('viewDetails')}
                                                                    </Link>
                                                                </td>
                                                            </tr>
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
