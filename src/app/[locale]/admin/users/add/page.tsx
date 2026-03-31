'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from '@/i18n/navigation';
import { Sidebar } from '@/components/layout';
import { getSidebarItems, PERMISSIONS } from '@/config/navigation';
import Header from '../../components/Header';
import { useTranslations, useLocale } from 'next-intl';
import SuccessModal from '@/components/ui/SuccessModal';
import { apiFetch } from '@/lib/api-client';

interface Permission {
    id: number;
    key: string;
    description: string;
}

export default function AddUserPage() {
    const router = useRouter();
    const pathname = usePathname();
    const [loading, setLoading] = useState(false);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [user, setUser] = useState<any>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phoneNumber: '',
        password: '',
        permissionIds: [] as number[],
    });
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const t = useTranslations('Admin.users');
    const locale = useLocale();

    useEffect(() => {
        const checkAuthAndPermissions = async () => {
            const token = localStorage.getItem('token');
            const userData = localStorage.getItem('user');

            if (!token) {
                router.push('/admin/login');
                return;
            }

            let currentUser: any = null;

            if (userData) {
                try {
                    currentUser = JSON.parse(userData);
                    setUser(currentUser);
                } catch (error) {
                    console.error('Error parsing user data:', error);
                    router.push('/admin/login');
                    return;
                }
            } else {
                // Fetch user data from API
                try {
                    const data = await apiFetch<{ user: any }>('/api/auth/me');

                    if (data.user) {
                        currentUser = data.user;
                        localStorage.setItem('user', JSON.stringify(currentUser));
                        setUser(currentUser);
                    } else {
                        router.push('/admin/login');
                        return;
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error);
                    // apiFetch handles 401 (token expiration) automatically with redirect
                    router.push('/admin/login');
                    return;
                }
            }

            // Check if user has MANAGE_USERS permission
            const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';
            const userPermissions = currentUser.permissions || [];
            const hasManageUsersPermission = isSuperAdmin || userPermissions.includes(PERMISSIONS.MANAGE_USERS);

            if (!hasManageUsersPermission) {
                // User doesn't have required permission - redirect to unauthorized page
                router.push('/admin/unauthorized');
                return;
            }

            setCheckingAuth(false);
            fetchPermissions();
        };

        checkAuthAndPermissions();
    }, [router]);

    const fetchPermissions = async () => {
        try {
            // Get permissions from localStorage (full Permission objects with id, key, description)
            const user = localStorage.getItem('user');
            const storedPermissions = JSON.parse(user || '{}')['permissionsDetails'];
            if (storedPermissions) {
                try {
                    if (Array.isArray(storedPermissions) && storedPermissions.length > 0) {
                        setPermissions(storedPermissions);
                        return;
                    }
                } catch (parseError) {
                    console.error('Error parsing stored permissions:', parseError);
                }
            }

            // If not found in localStorage, fetch from API
            const result = await apiFetch<Permission[]>(`/api/admin/permissions`);

            // Store permissions in localStorage for future use
            localStorage.setItem('permissions', JSON.stringify(result));
            setPermissions(result);
        } catch (error) {
            console.error('Error fetching permissions:', error);
            // apiFetch handles 401 (token expiration) automatically with redirect
        }
    };

    const handleSave = async () => {
        setLoading(true);
        setError('');

        try {
            const body = {
                name: formData.name,
                email: formData.email,
                phoneNumber: formData.phoneNumber || undefined,
                password: formData.password,
                role: 'SUB_ADMIN',
                permissionIds: formData.permissionIds,
            };

            await apiFetch('/api/admin/users', {
                method: 'POST',
                body: JSON.stringify(body),
            });

            setShowSuccessModal(true);
        } catch (err: any) {
            setError(err.message || 'Failed to create user');
            // apiFetch handles 401 (token expiration) automatically with redirect
        } finally {
            setLoading(false);
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

    const handleSuccessClose = () => {
        setShowSuccessModal(false);
        router.push('/admin/users');
    };

    const sidebarItems = getSidebarItems(
        locale as 'en' | 'ar',
        user?.permissions || [],
        user?.role,
        pathname
    );

    if (checkingAuth) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">{t('loading')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
            <Sidebar items={sidebarItems} locale={locale as 'en' | 'ar'} />

            <div className="flex-1" style={{ marginLeft: locale === 'ar' ? '0' : '16rem', marginRight: locale === 'ar' ? '16rem' : '0' }}>
                <Header />

                <main className="px-6 py-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('addUser')}</h2>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                            {error}
                        </div>
                    )}

                    <div className="bg-white rounded-2xl shadow-sm p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            {/* Full Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('fullName')}
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-300 bg-white focus:border-[#00B09C] focus:ring-2 focus:ring-[#00B09C]/20 text-gray-900"
                                        placeholder={t('enterFullName')}
                                        required
                                    />
                                    <svg className="w-5 h-5 text-gray-400 absolute right-4 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-300 bg-white focus:border-[#00B09C] focus:ring-2 focus:ring-[#00B09C]/20 text-gray-900"
                                        placeholder={t('enterEmail')}
                                        required
                                    />
                                    <svg className="w-5 h-5 text-gray-400 absolute right-4 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                        value={formData.phoneNumber}
                                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                        className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-300 bg-white focus:border-[#00B09C] focus:ring-2 focus:ring-[#00B09C]/20 text-gray-900"
                                        placeholder={t('enterPhoneNumber')}
                                    />
                                    <svg className="w-5 h-5 text-gray-400 absolute right-4 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-300 bg-white focus:border-[#00B09C] focus:ring-2 focus:ring-[#00B09C]/20 text-gray-900"
                                        placeholder={t('enterPassword')}
                                        required
                                    />
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
                                </div>
                            </div>
                        </div>

                        {/* Allowed Access Section */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                {t('allowedAccess')}
                            </label>
                            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 max-h-64 overflow-y-auto">
                                {permissions.map((permission) => (
                                    <label key={permission.id} className="flex items-center gap-3 cursor-pointer py-2">
                                        <input
                                            type="checkbox"
                                            checked={formData.permissionIds.includes(permission.id)}
                                            onChange={() => handlePermissionToggle(permission.id)}
                                            className="w-5 h-5 rounded border-gray-300 text-[#00B09C] focus:ring-[#00B09C] focus:ring-2"
                                        />
                                        <span className="text-sm text-gray-700">

                                            {t(`permissions_list.${permission.key}`) || permission.description}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Save Button */}
                        <div className="mt-8 flex justify-center">
                            <button
                                onClick={handleSave}
                                className="px-12 py-4 bg-[#00B09C] text-white rounded-xl font-bold hover:bg-[#008f7e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={loading}
                            >
                                {loading ? t('saving') : t('save')}
                            </button>
                        </div>
                    </div>
                </main>
            </div>

            {showSuccessModal && (
                <SuccessModal
                    message={t('userCreatedSuccessfully')}
                    onClose={handleSuccessClose}
                />
            )}
        </div>
    );
}

