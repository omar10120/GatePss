'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname, useParams, useSearchParams } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { Sidebar } from '@/components/layout';
import { getSidebarItems } from '@/config/navigation';
import Header from '../../components/Header';
import { useTranslations, useLocale } from 'next-intl';
import SuccessModal from '@/components/ui/SuccessModal';
import Image from 'next/image';

interface User {
    id: number;
    name: string;
    email: string;
    phoneNumber?: string;
    role: string;
    isActive: boolean;
    permissions: Array<{
        id: number;
        key: string;
        description: string;
    }>;
}

interface Permission {
    id: number;
    key: string;
    description: string;
}

export default function ViewUserPage() {
    const router = useRouter();
    const pathname = usePathname();
    const params = useParams();
    const searchParams = useSearchParams();
    const userId = params?.id as string;
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditMode, setIsEditMode] = useState(searchParams.get('edit') === 'true');
    const [userData, setUserData] = useState<User | null>(null);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phoneNumber: '',
        password: '',
        permissionIds: [] as number[],
    });
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
            setCurrentUser(JSON.parse(userData));
        }

        fetchUser(token);
        fetchPermissions(token);
    }, [userId]);

    const fetchUser = async (token: string) => {
        try {
            const response = await fetch(`/api/admin/users/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch user');
            }

            const result = await response.json();
            setUserData(result.data);
            setFormData({
                name: result.data.name,
                email: result.data.email,
                phoneNumber: result.data.phoneNumber || '',
                password: '',
                permissionIds: (result.data.permissions || []).map((p: any) => p.id),
            });
        } catch (error) {
            console.error('Error fetching user:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPermissions = async (token: string) => {
        try {
            const response = await fetch('/api/admin/permissions', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch permissions');
            }

            const result = await response.json();
            setPermissions(result.data);
        } catch (error) {
            console.error('Error fetching permissions:', error);
        }
    };

    const handleSave = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        setSaving(true);
        setError('');

        try {
            const body: any = {
                name: formData.name,
                email: formData.email,
                phoneNumber: formData.phoneNumber || undefined,
                permissionIds: formData.permissionIds,
            };

            if (formData.password) {
                body.password = formData.password;
            }

            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to update user');
            }

            setUserData(result.data);
            setIsEditMode(false);
            setShowSuccessModal(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handlePermissionToggle = (permissionId: number) => {
        setFormData(prev => ({
            ...prev,
            permissionIds: prev.permissionIds.includes(permissionId)
                ? prev.permissionIds.filter(id => id !== permissionId)
                : [...prev.permissionIds, permissionId],
        }));
    };

    const handleCancel = () => {
        if (userData) {
            setFormData({
                name: userData.name,
                email: userData.email,
                phoneNumber: userData.phoneNumber || '',
                password: '',
                permissionIds: (userData.permissions || []).map(p => p.id),
            });
        }
        setIsEditMode(false);
        setError('');
    };

    const handleSuccessClose = () => {
        setShowSuccessModal(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">{t('loading')}</p>
                </div>
            </div>
        );
    }

    if (!userData) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600">{t('userNotFound')}</p>
                </div>
            </div>
        );
    }

    const sidebarItems = getSidebarItems(
        locale as 'en' | 'ar',
        currentUser?.permissions || [],
        currentUser?.role,
        pathname
    );

    return (
        <div className="min-h-screen bg-gray-50 flex" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
            <Sidebar items={sidebarItems} locale={locale as 'en' | 'ar'} />

            <div className="flex-1" style={{ marginLeft: locale === 'ar' ? '0' : '16rem', marginRight: locale === 'ar' ? '16rem' : '0' }}>
                <Header />

                <main className="px-6 py-8">
                    {/* Header Section with User Info and Edit Button */}
                    <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center gap-4">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">{userData?.name || ''}</h2>
                                <p className="text-sm text-gray-500 mt-1">{userData?.email || ''}</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                {userData?.name ? (
                                    <span className="text-lg font-semibold text-gray-600">
                                        {userData.name.charAt(0).toUpperCase()}
                                    </span>
                                ) : (
                                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                )}
                            </div>
                        </div>
                        {!isEditMode ? (
                            <button
                                onClick={() => setIsEditMode(true)}
                                className="px-6 py-2 bg-[#00B09C] text-white rounded-lg font-medium hover:bg-[#008f7e] transition-colors"
                            >
                                {t('edit')}
                            </button>
                        ) : (
                            <div className="flex gap-3">
                                <button
                                    onClick={handleCancel}
                                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                                >
                                    {t('cancel')}
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="px-6 py-2 bg-[#00B09C] text-white rounded-lg font-medium hover:bg-[#008f7e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {saving ? t('saving') : t('save')}
                                </button>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                            {error}
                        </div>
                    )}

                    <div className="bg-white rounded-2xl shadow-sm p-8">
                        <h3 className="text-2xl font-bold text-gray-900 mb-6">{t('viewAllDetails')}</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            {/* Full Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('fullName')}
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={isEditMode ? formData.name : userData?.name || ''}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        readOnly={!isEditMode}
                                        className={`w-full px-4 py-3 pl-12 rounded-xl border ${isEditMode ? 'bg-white border-gray-300 focus:border-[#00B09C] focus:ring-2 focus:ring-[#00B09C]/20' : 'bg-gray-50 border-gray-200'} text-gray-900`}
                                    />
                                    <svg className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('email')}
                                </label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        value={isEditMode ? formData.email : userData?.email || ''}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        readOnly={!isEditMode}
                                        className={`w-full px-4 py-3 pl-12 rounded-xl border ${isEditMode ? 'bg-white border-gray-300 focus:border-[#00B09C] focus:ring-2 focus:ring-[#00B09C]/20' : 'bg-gray-50 border-gray-200'} text-gray-900`}
                                    />
                                    <svg className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                            </div>

                            {/* Phone Number */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('phoneNumber')}
                                </label>
                                <div className="relative">
                                    <input
                                        type="tel"
                                        value={isEditMode ? formData.phoneNumber : userData?.phoneNumber || ''}
                                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                        readOnly={!isEditMode}
                                        className={`w-full px-4 py-3 pl-12 rounded-xl border ${isEditMode ? 'bg-white border-gray-300 focus:border-[#00B09C] focus:ring-2 focus:ring-[#00B09C]/20' : 'bg-gray-50 border-gray-200'} text-gray-900`}
                                    />
                                    <svg className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('password')}
                                </label>
                                <div className="relative">
                                    <input
                                        type={isEditMode && showPassword ? 'text' : 'password'}
                                        value={isEditMode ? formData.password : '••••••••'}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        readOnly={!isEditMode}
                                        placeholder={isEditMode ? t('leaveEmptyToKeepCurrent') : ''}
                                        className={`w-full px-4 py-3 pl-12 pr-12 rounded-xl border ${isEditMode ? 'bg-white border-gray-300 focus:border-[#00B09C] focus:ring-2 focus:ring-[#00B09C]/20' : 'bg-gray-50 border-gray-200'} text-gray-900`}
                                    />
                                    <svg className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    {isEditMode && (
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showPassword ? (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0L3 3m3.29 3.29L12 12m-5.71-5.71L12 12" />
                                                </svg>
                                            ) : (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Allowed Access Section */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                {t('allowedAccess')}
                            </label>
                            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                                {isEditMode ? (
                                    (permissions || []).map((permission) => (
                                        <label key={permission.id} className="flex items-center gap-3 cursor-pointer py-2">
                                            <input
                                                type="checkbox"
                                                checked={formData.permissionIds.includes(permission.id)}
                                                onChange={() => handlePermissionToggle(permission.id)}
                                                className="w-5 h-5 rounded border-gray-300 text-[#00B09C] focus:ring-[#00B09C] focus:ring-2"
                                            />
                                            <span className="text-sm text-gray-700">{permission.description}</span>
                                        </label>
                                    ))
                                ) : (
                                    (userData?.permissions || []).length > 0 ? (
                                        (userData.permissions || []).map((permission) => (
                                            <div key={permission.id} className="flex items-center gap-3 py-2">
                                                <div className="w-5 h-5 rounded bg-[#00B09C] flex items-center justify-center">
                                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                                <span className="text-sm text-gray-700">{permission.description}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-500">{t('noPermissions')}</p>
                                    )
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {showSuccessModal && (
                <SuccessModal
                    message={t('userUpdatedSuccessfully')}
                    onClose={handleSuccessClose}
                />
            )}
        </div>
    );
}

