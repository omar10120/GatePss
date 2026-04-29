'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname, Link } from '@/i18n/navigation';
import { Sidebar } from '@/components/layout';
import { getSidebarItems } from '@/config/navigation';
import Header from '../components/Header';
import { useLocale, useTranslations } from 'next-intl';
import { TableFilter } from '../components/TableFilter';
import { apiFetch } from '@/lib/api-client';

interface Permit {
    id: number;
    requestNumber: string;
    applicantNameEn: string;
    applicantNameAr: string;
    applicantEmail: string;
    profession: string;
    requestType: string;
    passFor?: string | null;
    identification: string;
    validFrom: string;
    validTo: string;
    qrCodePdfUrl?: string | null;
    externalReference?: string | null;
    status: string;
    createdAt: string;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export default function PermitsPage() {
    const router = useRouter();
    const pathname = usePathname();
    const locale = useLocale();
    const t = useTranslations('Admin.permits');
    const [loading, setLoading] = useState(true);
    const [permits, setPermits] = useState<Permit[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [user, setUser] = useState<any>(null);
    const [selectedPermit, setSelectedPermit] = useState<Permit | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [filters, setFilters] = useState({
        search: '',
        status: '',
        date: '',
        page: 1,
    });
    const [permissionDenied, setPermissionDenied] = useState(false);

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

        fetchPermits();
    }, [filters]);

    const fetchPermits = async () => {
        setLoading(true);
        setPermissionDenied(false);
        try {
            const params = new URLSearchParams();
            params.append('status', 'APPROVED'); // Only show approved requests
            if (filters.search) params.append('search', filters.search);
            if (filters.status) params.append('passFor', filters.status); // Using passFor as status type filter
            if (filters.date) params.append('date', filters.date);
            params.append('page', filters.page.toString());
            params.append('limit', '10');

            const result = await apiFetch<{ requests: any[]; pagination: any }>(`/api/admin/permits?${params}`);
            setPermits(result.requests || []);
            setPagination(result.pagination || null);
        } catch (error: any) {
            console.error('Error fetching permits:', error);
            // Check if it's a permission error (403)
            if (error.message?.includes('Forbidden') || error.message?.includes('permission')) {
                setPermissionDenied(true);
            }
            // apiFetch handles 401 (token expiration) automatically with redirect
        } finally {
            setLoading(false);
        }
    };

    const handleViewPermitQR = (permit: Permit) => {
        setSelectedPermit(permit);
        setShowModal(true);
    };

    const handleDownloadInfo = () => {
        if (!selectedPermit?.qrCodePdfUrl) return;

        // Open PDF URL from Sohar in a new tab
        window.open(selectedPermit.qrCodePdfUrl, '_blank');
    };

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
    };

    const handlePageChange = (newPage: number) => {
        setFilters(prev => ({ ...prev, page: newPage }));
    };

    const handleResetFilters = () => {
        setFilters({
            search: '',
            status: '',
            date: '',
            page: 1,
        });
    };

    const handleViewMore = async (permit: Permit) => {
        // Check Sohar status and update before navigating (if externalReference exists)
        if (permit.externalReference) {
            try {
                await apiFetch(`/api/admin/permits/${permit.id}/check-sohar-status`, {
                    method: 'POST',
                });
                // Refresh permits list to show updated status (async, don't wait)
                fetchPermits().catch(err => console.error('Error refreshing permits:', err));
            } catch (error: any) {
                // Handle 404 errors gracefully - pass might not exist in Sohar Port yet
                if (error?.statusCode === 404) {
                    console.warn('Gate pass not found in Sohar Port system:', error.message);
                } else {
                    console.error('Error checking Sohar status:', error);
                }
                // Continue to navigate even if status check fails
                // apiFetch handles 401 (token expiration) automatically with redirect
            }
        }

        // Navigate to permit details page (permits permission scope)
        router.push(`/admin/permits/${permit.id}`);
    };

    if (loading && permits.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">{t('loading')}</p>
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

    const getPassTypeLabel = (passFor: string | null | undefined) => {
        if (!passFor) return 'N/A';
        return passFor === 'TEMPORARY' ? 'Temporary' : passFor === 'PERMANENT' ? 'Permanent' : passFor;
    };

    const getIdentificationLabel = (identification: string) => {
        return identification === 'Resident' ? 'Resident' : identification === 'NON_Resident' ? 'Non Resident' : identification;
    };

    return (
        <div className="min-h-screen bg-gray-50 flex" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
            <Sidebar items={sidebarItems} locale={locale as 'en' | 'ar'} />

            <div className="flex-1" style={{ marginLeft: locale === 'ar' ? '0' : '16rem', marginRight: locale === 'ar' ? '16rem' : '0' }}>
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
                            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('permissionDenied')}</h3>
                            <p className="text-gray-500">{t('contactAdmin')}</p>
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
                                searchPlaceholder={t('searchPlaceholder')}
                                statusOptions={[
                                    { value: 'TEMPORARY', label: t('temporary') },
                                    { value: 'PERMANENT', label: t('permanent') },
                                ]}
                                statusLabel={t('status')}
                            />

                            {/* Permits Table */}
                            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                                {permits.length > 0 ? (
                                    <>
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead className="bg-[#F3F4F6] border-b border-gray-200">
                                                    <tr>
                                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">ID</th>
                                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">{t('permitNumber')}</th>
                                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">{t('date')}</th>
                                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">{t('holderName')}</th>
                                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">{t('email')}</th>
                                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">{t('role')}</th>
                                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">{t('requestType')}</th>
                                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">{t('passType')}</th>
                                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">{t('identification')}</th>
                                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">{t('permit')}</th>
                                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">{t('action')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200">
                                                    {permits.map((permit) => {
                                                        const date = new Date(permit.validFrom);
                                                        const formattedDate = `${date.getMonth() + 1}\\${date.getDate()}\\${date.getFullYear()}`;
                                                        return (
                                                            <tr key={permit.id} className="hover:bg-gray-50">
                                                                <td className="px-4 py-3 text-sm text-gray-700">{permit.id}</td>
                                                                <td className="px-4 py-3 text-sm text-gray-700">{permit.externalReference || permit.requestNumber}</td>
                                                                <td className="px-4 py-3 text-sm text-gray-700">{formattedDate}</td>
                                                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{permit.applicantNameEn ? permit.applicantNameEn : permit.applicantNameAr}</td>
                                                                <td className="px-4 py-3 text-sm text-gray-700">{permit.applicantEmail}</td>
                                                                <td className="px-4 py-3 text-sm text-gray-700">{permit.profession}</td>
                                                                <td className="px-4 py-3 text-sm text-gray-700">{permit.requestType}</td>
                                                                <td className="px-4 py-3 text-sm text-gray-700">{getPassTypeLabel(permit.passFor)}</td>
                                                                <td className="px-4 py-3 text-sm text-gray-700">{getIdentificationLabel(permit.identification)}</td>
                                                                <td className="px-4 py-3">
                                                                    {permit.qrCodePdfUrl ? (
                                                                        <button
                                                                            onClick={() => handleViewPermitQR(permit)}
                                                                            className="hover:opacity-70 transition-opacity cursor-pointer"
                                                                            title={t('viewQRCode')}
                                                                        >
                                                                            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                            </svg>
                                                                        </button>
                                                                    ) : (
                                                                        <span className="text-gray-400">-</span>
                                                                    )}
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <button
                                                                        onClick={() => handleViewMore(permit)}
                                                                        className="text-[#3B82F6] hover:text-[#2563EB] text-sm font-medium"
                                                                    >
                                                                        {t('viewMore')}
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                ) : (
                                        <p className="text-gray-500 text-center py-12">{t('noPermits')}</p>
                                    )}

                                    {/* Pagination */}
                                    {pagination && Number(pagination.total) > 0 && (
                                        <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4 px-4 pb-4">
                                            <div className="text-[14px] text-[#A1A1A1] font-medium">
                                                {t('pagination.showing')} {Math.min(((Number(pagination.page) - 1) * Number(pagination.limit)) + 1, Number(pagination.total))}-{String(Math.min(Number(pagination.page) * Number(pagination.limit), Number(pagination.total))).padStart(2, '0')} {t('pagination.of')} {Number(pagination.total)}
                                            </div>
                                            {(Number(pagination.totalPages) > 1 || Number(pagination.page) > 1) && (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handlePageChange(Number(pagination.page) - 1)}
                                                        disabled={Number(pagination.page) <= 1 || loading}
                                                        className="flex items-center gap-2 px-4 py-2 border border-gray-100 rounded-[8px] text-[14px] font-bold text-gray-900 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                                    >
                                                        <svg className={`w-4 h-4 ${locale === 'ar' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                        </svg>
                                                        {t('pagination.previous')}
                                                    </button>
                                                    <button
                                                        onClick={() => handlePageChange(Number(pagination.page) + 1)}
                                                        disabled={Number(pagination.page) >= Number(pagination.totalPages) || loading}
                                                        className="flex items-center gap-2 px-4 py-2 border border-gray-100 rounded-[8px] text-[14px] font-bold text-gray-900 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                                    >
                                                        {t('pagination.next')}
                                                        <svg className={`w-4 h-4 ${locale === 'ar' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                </main>
            </div>

            {/* Permit Info Modal */}
            {showModal && selectedPermit && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-[#3B82F6]">{t('permitsInfo')}</h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                {(() => {
                                    const date = new Date(selectedPermit.validFrom);
                                    const formattedDate = `${date.getMonth() + 1}\\${date.getDate()}\\${date.getFullYear()}`;
                                    return (
                                        <p className="text-sm text-gray-600">{t('passStartingDate')}: {formattedDate}</p>
                                    );
                                })()}
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">{t('permitNumber')}: {selectedPermit.externalReference || selectedPermit.requestNumber}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">{t('holderName')}: {selectedPermit.applicantNameEn}</p>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                                    {t('soApproved')}
                                </span>
                            </div>

                            <button
                                onClick={handleDownloadInfo}
                                className="w-full btn btn-primary mt-6"
                                disabled={!selectedPermit?.qrCodePdfUrl}
                            >
                                {t('downloadInfo')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

