'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname, Link } from '@/i18n/navigation';
import { Sidebar } from '@/components/layout';
import { getSidebarItems } from '@/config/navigation';
import Header from '../components/Header';
import { useLocale, useTranslations } from 'next-intl';
import { TableFilter } from '../components/TableFilter';

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
    const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

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

        fetchPermits(token);
    }, [filters]);

    const fetchPermits = async (token: string) => {
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
                throw new Error('Failed to fetch permits');
            }

            const result = await response.json();
            setPermits(result.data.requests || []);
            setPagination(result.data.pagination || null);
        } catch (error) {
            console.error('Error fetching permits:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewPermitQR = async (permit: Permit) => {
        setSelectedPermit(permit);
        setShowModal(true);
        setQrDataUrl(null);

        try {
            // Dynamically import QRCode for browser compatibility
            const QRCode = (await import('qrcode')).default;
            
            const qrPayload = JSON.stringify({
                id: permit.id,
                externalReference: permit.externalReference || permit.requestNumber,
                applicantName: permit.applicantNameEn,
                validFrom: permit.validFrom,
                validTo: permit.validTo,
            });

            const dataUrl = await QRCode.toDataURL(qrPayload, {
                margin: 1,
                width: 256,
            });

            setQrDataUrl(dataUrl);
        } catch (error) {
            console.error('Error generating QR code:', error);
        }
    };

    const handleDownloadInfo = () => {
        if (!qrDataUrl || !selectedPermit) return;

        const link = document.createElement('a');
        link.href = qrDataUrl;
        const fileName = `permit-${selectedPermit.externalReference || selectedPermit.requestNumber || selectedPermit.id}-qr.png`;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/admin/login');
            return;
        }

        // Check Sohar status and update before navigating (if externalReference exists)
        if (permit.externalReference) {
            try {
                const response = await fetch(`/api/admin/requests/${permit.id}/check-sohar-status`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (response.ok) {
                    const result = await response.json();
                    // Refresh permits list to show updated status (async, don't wait)
                    fetchPermits(token).catch(err => console.error('Error refreshing permits:', err));
                }
            } catch (error) {
                console.error('Error checking Sohar status:', error);
                // Continue to navigate even if status check fails
            }
        }

        // Navigate to request details page
        router.push(`/admin/requests/${permit.id}`);
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
        return identification === 'RESIDENT' ? 'Resident' : identification === 'NON_RESIDENT' ? 'Non Resident' : identification;
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
                                                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{permit.applicantNameEn}</td>
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

                                        {/* Pagination */}
                                        {pagination && pagination.totalPages > 1 && (
                                            <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4 px-4">
                                                <div className="text-sm text-gray-600">
                                                    {t('pagination.showing')} {((pagination.page - 1) * pagination.limit) + 1}-{String(Math.min(pagination.page * pagination.limit, pagination.total)).padStart(2, '0')} {t('pagination.of')} {pagination.total}
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handlePageChange(pagination.page - 1)}
                                                        disabled={pagination.page === 1}
                                                        className="btn btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {t('pagination.previous')}
                                                    </button>
                                                    <button
                                                        onClick={() => handlePageChange(pagination.page + 1)}
                                                        disabled={pagination.page === pagination.totalPages}
                                                        className="btn btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {t('pagination.next')}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <p className="text-gray-500 text-center py-12">{t('noPermits')}</p>
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

                            {selectedPermit && (
                                <div className="flex justify-center my-6">
                                    <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center p-4">
                                        <div className="w-full h-full bg-white rounded flex items-center justify-center border-2 border-dashed border-gray-300">
                                            {qrDataUrl ? (
                                                <img
                                                    src={qrDataUrl}
                                                    alt="Permit QR Code"
                                                    className="w-full h-full object-contain"
                                                />
                                            ) : (
                                            <div className="text-center">
                                                    <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-2"></div>
                                                    <p className="text-xs text-gray-500 mt-2">{t('loading')}</p>
                                            </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={handleDownloadInfo}
                                className="w-full btn btn-primary mt-6"
                                disabled={!qrDataUrl}
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

