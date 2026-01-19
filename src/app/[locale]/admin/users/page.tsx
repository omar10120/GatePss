'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname, Link } from '@/i18n/navigation';
import { Sidebar } from '@/components/layout';
import { getSidebarItems } from '@/config/navigation';
import Header from '../components/Header';
import { useTranslations, useLocale } from 'next-intl';
import Image from 'next/image';

interface User {
    id: number;
    name: string;
    email: string;
    phoneNumber?: string;
    role: string;
    isActive: boolean;
    createdAt: string;
    permissions: Array<{
        id: number;
        key: string;
        description: string;
    }>;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export default function AdminUsersPage() {
    const router = useRouter();
    const pathname = usePathname();
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<User[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [user, setUser] = useState<any>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [permissionDenied, setPermissionDenied] = useState(false);
    const t = useTranslations('Admin.users');
    const locale = useLocale();

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

        fetchUsers(token, currentPage);
    }, [currentPage]);

    const fetchUsers = async (token: string, page: number = 1) => {
        setLoading(true);
        setPermissionDenied(false);
        try {
            const response = await fetch(`/api/admin/users?page=${page}&limit=10`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.status === 403) {
                setPermissionDenied(true);
                return;
            }

            if (!response.ok) {
                throw new Error('Failed to fetch users');
            }

            const result = await response.json();
            setUsers(result.data.users);
            setPagination(result.data.pagination);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleActive = async (userId: number, currentStatus: boolean) => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            if (!currentStatus) {
                // Reactivate user
                const userToUpdate = users.find(u => u.id === userId);
                if (!userToUpdate) return;

                await fetch(`/api/admin/users/${userId}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ ...userToUpdate, isActive: true }),
                });
            } else {
                // Deactivate user
                await fetch(`/api/admin/users/${userId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });
            }

            fetchUsers(token, currentPage);
        } catch (error) {
            console.error('Error toggling user status:', error);
        }
    };

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
    };

    if (loading && users.length === 0) {
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

    return (
        <div className="min-h-screen bg-gray-50 flex" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
            {/* Sidebar */}
            <Sidebar items={sidebarItems} locale={locale as 'en' | 'ar'} />

            {/* Main Content Area */}
            <div className="flex-1" style={{ marginLeft: locale === 'ar' ? '0' : '16rem', marginRight: locale === 'ar' ? '16rem' : '0' }}>
                {/* Header */}
                <Header />

                {/* Main Content */}
                <main className="px-6 py-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">{t('title')}</h2>
                        {!permissionDenied && (
                            <Link
                                href="/admin/users/add"
                                className="btn btn-primary"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                {t('addUser')}
                            </Link>
                        )}
                    </div>

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
                            {/* Users Table */}
                            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                                {users.length > 0 ? (
                                    <>
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead className="bg-[#F3F4F6] border-b border-gray-200">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">ID</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">{t('name')}</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">{t('email')}</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">{t('phoneNumber')}</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">{t('password')}</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">{t('added')}</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">{t('active')}</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">{t('access')}</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">{t('actions')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200">
                                                    {users.map((u) => {
                                                        const formattedDate = new Date(u.createdAt).toLocaleDateString('en-US', {
                                                            month: 'numeric',
                                                            day: 'numeric',
                                                            year: 'numeric'
                                                        });
                                                        return (
                                                            <tr key={u.id} className="hover:bg-gray-50 text-gray-700">
                                                                <td className="px-4 py-3 text-sm">{u.id}</td>
                                                                <td className="px-4 py-3 text-sm font-medium">{u.name}</td>
                                                                <td className="px-4 py-3 text-sm">{u.email}</td>
                                                                <td className="px-4 py-3 text-sm">{u.phoneNumber || '-'}</td>
                                                                <td className="px-4 py-3 text-sm">••••••••</td>
                                                                <td className="px-4 py-3 text-sm">{formattedDate}</td>
                                                                <td className="px-4 py-3">
                                                                    <button
                                                                        onClick={() => u.id !== user?.id && handleToggleActive(u.id, u.isActive)}
                                                                        disabled={u.id === user?.id}
                                                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                                                            u.isActive ? 'bg-[#10B981]' : 'bg-gray-300'
                                                                        } ${u.id === user?.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                                                    >
                                                                        <span
                                                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                                                u.isActive ? 'translate-x-6' : 'translate-x-1'
                                                                            }`}
                                                                        />
                                                                    </button>
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <Link
                                                                        href={`/admin/users/${u.id}`}
                                                                        className="bg-white rounded-lg p-2 hover:bg-gray-100 transition-colors inline-block"
                                                                        title={t('edit')}
                                                                    >
                                                                        <Image 
                                                                            src="/images/svg/Edit 2.svg" 
                                                                            alt="Edit" 
                                                                            width={16}
                                                                            height={16}
                                                                        />
                                                                    </Link>
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <Link
                                                                        href={`/admin/users/${u.id}`}
                                                                        className="text-[#3B82F6] hover:text-[#2563EB] text-sm font-medium"
                                                                    >
                                                                        {t('viewMore')}
                                                                    </Link>
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
                                                    {t('pagination.showing')} {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} {t('pagination.of')} {pagination.total} {t('pagination.results')}
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
                                    <p className="text-gray-500 text-center py-12">{t('noUsers')}</p>
                                )}
                            </div>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
}
