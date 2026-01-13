'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname, Link } from '@/i18n/navigation';
import { Sidebar } from '@/components/layout';
import { getSidebarItems } from '@/config/navigation';
import Header from '../components/Header';

interface Request {
    id: number;
    requestNumber: string;
    applicantName: string;
    applicantEmail: string;
    passportIdNumber: string;
    purposeOfVisit: string;
    dateOfVisit: string;
    requestType: string;
    status: string;
    createdAt: string;
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
    const [locale, setLocale] = useState<'en' | 'ar'>('en');
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState<Request[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [user, setUser] = useState<any>(null);
    const [filters, setFilters] = useState({
        status: '',
        requestType: '',
        search: '',
        page: 1,
    });

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
            title: 'Gate Pass Requests',
            dashboard: 'Dashboard',
            requests: 'Requests',
            users: 'Users',
            logs: 'Activity Logs',
            logout: 'Logout',
            search: 'Search by name, email, or request number...',
            filterStatus: 'Filter by Status',
            filterType: 'Filter by Type',
            allStatuses: 'All Statuses',
            allTypes: 'All Types',
            showing: 'Showing',
            of: 'of',
            results: 'results',
            previous: 'Previous',
            next: 'Next',
            noRequests: 'No requests found',
            viewDetails: 'View Details',
            permissionDenied: 'You do not have permission to view requests.',
            contactAdmin: 'Please contact your administrator if you believe this is a mistake.',
            types: {
                VISITOR: 'Visitor',
                CONTRACTOR: 'Contractor',
                EMPLOYEE: 'Employee',
                VEHICLE: 'Vehicle',
            },
            status: {
                PENDING: 'Pending',
                APPROVED: 'Approved',
                REJECTED: 'Rejected',
            },
        },
        ar: {
            title: 'طلبات تصاريح البوابة',
            dashboard: 'لوحة التحكم',
            requests: 'الطلبات',
            users: 'المستخدمون',
            logs: 'سجل النشاط',
            logout: 'تسجيل الخروج',
            search: 'البحث بالاسم أو البريد الإلكتروني أو رقم الطلب...',
            filterStatus: 'تصفية حسب الحالة',
            filterType: 'تصفية حسب النوع',
            allStatuses: 'جميع الحالات',
            allTypes: 'جميع الأنواع',
            showing: 'عرض',
            of: 'من',
            results: 'نتيجة',
            previous: 'السابق',
            next: 'التالي',
            noRequests: 'لم يتم العثور على طلبات',
            viewDetails: 'عرض التفاصيل',
            permissionDenied: 'ليس لديك صلاحية لعرض الطلبات.',
            contactAdmin: 'يرجى الاتصال بالمسؤول إذا كنت تعتقد أن هذا خطأ.',
            types: {
                VISITOR: 'زائر',
                CONTRACTOR: 'مقاول',
                EMPLOYEE: 'موظف',
                VEHICLE: 'مركبة',
            },
            status: {
                PENDING: 'قيد الانتظار',
                APPROVED: 'موافق عليه',
                REJECTED: 'مرفوض',
            },
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
                throw new Error('Failed to fetch requests');
            }

            const result = await response.json();
            setRequests(result.data.requests);
            setPagination(result.data.pagination);
        } catch (error) {
            console.error('Error fetching requests:', error);
        } finally {
            setLoading(false);
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

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
    };

    const handlePageChange = (newPage: number) => {
        setFilters(prev => ({ ...prev, page: newPage }));
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
        locale,
        user?.permissions || [],
        user?.role,
        pathname
    );

    return (
        <div className="min-h-screen bg-gray-50 flex" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
            {/* Sidebar */}
            <Sidebar items={sidebarItems} locale={locale} />

            {/* Main Content Area */}
            <div className="flex-1" style={{ marginLeft: locale === 'ar' ? '0' : '16rem', marginRight: locale === 'ar' ? '16rem' : '0' }}>
                {/* Header */}
                <Header />

                {/* Main Content */}
                <main className="px-6 py-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">{content.title}</h2>

                    {permissionDenied ? (
                        <div className="card p-12 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">{content.permissionDenied}</h3>
                            <p className="text-gray-500">{content.contactAdmin}</p>
                        </div>
                    ) : (
                        <>
                            {/* Filters */}
                            <div className="card mb-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <input
                                            type="text"
                                            placeholder={content.search}
                                            value={filters.search}
                                            onChange={(e) => handleFilterChange('search', e.target.value)}
                                            className="input"
                                        />
                                    </div>
                                    <div>
                                        <select
                                            value={filters.status}
                                            onChange={(e) => handleFilterChange('status', e.target.value)}
                                            className="input"
                                        >
                                            <option value="">{content.allStatuses}</option>
                                            <option value="PENDING">{content.status.PENDING}</option>
                                            <option value="APPROVED">{content.status.APPROVED}</option>
                                            <option value="REJECTED">{content.status.REJECTED}</option>
                                        </select>
                                    </div>
                                    <div>
                                        <select
                                            value={filters.requestType}
                                            onChange={(e) => handleFilterChange('requestType', e.target.value)}
                                            className="input"
                                        >
                                            <option value="">{content.allTypes}</option>
                                            <option value="VISITOR">{content.types.VISITOR}</option>
                                            <option value="CONTRACTOR">{content.types.CONTRACTOR}</option>
                                            <option value="EMPLOYEE">{content.types.EMPLOYEE}</option>
                                            <option value="VEHICLE">{content.types.VEHICLE}</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Requests Table */}
                            <div className="card">
                                {requests.length > 0 ? (
                                    <>
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead className="bg-gray-50 border-b border-gray-200">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Request #</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applicant</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Visit Date</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200">
                                                    {requests.map((request) => (
                                                        <tr key={request.id} className="hover:bg-gray-50">
                                                            <td className="px-4 py-3">
                                                                <Link href={`/admin/requests/${request.id}`} className="text-info-500 hover:text-primary-700 font-medium">
                                                                    {request.requestNumber}
                                                                </Link>
                                                            </td>
                                                            <td className="px-4 py-3 text-gray-900">{request.applicantName}</td>
                                                            <td className="px-4 py-3 text-gray-600">{request.applicantEmail}</td>
                                                            <td className="px-4 py-3 text-gray-600">
                                                                {content.types[request.requestType as keyof typeof content.types]}
                                                            </td>
                                                            <td className="px-4 py-3 text-gray-600 text-sm">
                                                                {new Date(request.dateOfVisit).toLocaleDateString()}
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(request.status)}`}>
                                                                    {content.status[request.status as keyof typeof content.status]}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <Link
                                                                    href={`/admin/requests/${request.id}`}
                                                                    className="text-info-500 hover:text-primary-700 text-sm font-medium"
                                                                >
                                                                    {content.viewDetails}
                                                                </Link>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Pagination */}
                                        {pagination && pagination.totalPages > 1 && (
                                            <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
                                                <div className="text-sm text-gray-600">
                                                    {content.showing} {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} {content.of} {pagination.total} {content.results}
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handlePageChange(pagination.page - 1)}
                                                        disabled={pagination.page === 1}
                                                        className="btn btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {content.previous}
                                                    </button>
                                                    <button
                                                        onClick={() => handlePageChange(pagination.page + 1)}
                                                        disabled={pagination.page === pagination.totalPages}
                                                        className="btn btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {content.next}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <p className="text-gray-500 text-center py-12">{content.noRequests}</p>
                                )}
                            </div>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
}
