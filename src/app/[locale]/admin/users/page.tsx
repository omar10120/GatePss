'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from '@/i18n/navigation';
import { Sidebar } from '@/components/layout';
import { getSidebarItems } from '@/config/navigation';

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    createdAt: string;
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

export default function AdminUsersPage() {
    const router = useRouter();
    const pathname = usePathname();
    const [locale, setLocale] = useState<'en' | 'ar'>('en');
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<User[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [user, setUser] = useState<any>(null);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'SUB_ADMIN',
        isActive: true,
        permissionIds: [] as number[],
    });
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
            title: 'User Management',
            dashboard: 'Dashboard',
            requests: 'Requests',
            users: 'Users',
            logs: 'Activity Logs',
            logout: 'Logout',
            addUser: 'Add New User',
            editUser: 'Edit User',
            name: 'Name',
            email: 'Email',
            password: 'Password',
            role: 'Role',
            status: 'Status',
            permissions: 'Permissions',
            actions: 'Actions',
            active: 'Active',
            inactive: 'Inactive',
            edit: 'Edit',
            deactivate: 'Deactivate',
            activate: 'Activate',
            save: 'Save',
            cancel: 'Cancel',
            saving: 'Saving...',
            noUsers: 'No users found',
            permissionDenied: 'You do not have permission to view users.',
            contactAdmin: 'Please contact your administrator if you believe this is a mistake.',
            roles: {
                SUPER_ADMIN: 'Super Admin',
                SUB_ADMIN: 'Sub Admin',
            },
            passwordHint: 'Leave blank to keep current password',
            selectPermissions: 'Select Permissions',
        },
        ar: {
            title: 'إدارة المستخدمين',
            dashboard: 'لوحة التحكم',
            requests: 'الطلبات',
            users: 'المستخدمون',
            logs: 'سجل النشاط',
            logout: 'تسجيل الخروج',
            addUser: 'إضافة مستخدم جديد',
            editUser: 'تعديل المستخدم',
            name: 'الاسم',
            email: 'البريد الإلكتروني',
            password: 'كلمة المرور',
            role: 'الدور',
            status: 'الحالة',
            permissions: 'الصلاحيات',
            actions: 'الإجراءات',
            active: 'نشط',
            inactive: 'غير نشط',
            edit: 'تعديل',
            deactivate: 'إلغاء التفعيل',
            activate: 'تفعيل',
            save: 'حفظ',
            cancel: 'إلغاء',
            saving: 'جاري الحفظ...',
            noUsers: 'لم يتم العثور على مستخدمين',
            permissionDenied: 'ليس لديك صلاحية لعرض المستخدمين.',
            contactAdmin: 'يرجى الاتصال بالمسؤول إذا كنت تعتقد أن هذا خطأ.',
            roles: {
                SUPER_ADMIN: 'مدير رئيسي',
                SUB_ADMIN: 'مدير فرعي',
            },
            passwordHint: 'اتركه فارغاً للاحتفاظ بكلمة المرور الحالية',
            selectPermissions: 'اختر الصلاحيات',
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

        fetchUsers(token);
        fetchPermissions(token);
    }, []);

    const fetchUsers = async (token: string) => {
        setLoading(true);
        setPermissionDenied(false);
        try {
            const response = await fetch('/api/admin/users', {
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
            setUsers(result.data);
        } catch (error) {
            console.error('Error fetching users:', error);
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

    const handleOpenModal = (userToEdit?: User) => {
        if (userToEdit) {
            setEditingUser(userToEdit);
            setFormData({
                name: userToEdit.name,
                email: userToEdit.email,
                password: '',
                role: userToEdit.role,
                isActive: userToEdit.isActive,
                permissionIds: userToEdit.permissions.map(p => p.id),
            });
        } else {
            setEditingUser(null);
            setFormData({
                name: '',
                email: '',
                password: '',
                role: 'SUB_ADMIN',
                isActive: true,
                permissionIds: [],
            });
        }
        setShowModal(true);
        setError('');
        setSuccess('');
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingUser(null);
        setError('');
    };

    const handleSave = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const url = editingUser
                ? `/api/admin/users/${editingUser.id}`
                : '/api/admin/users';

            const method = editingUser ? 'PUT' : 'POST';

            const body: any = {
                name: formData.name,
                email: formData.email,
                role: formData.role,
                isActive: formData.isActive,
                permissionIds: formData.permissionIds,
            };

            if (formData.password || !editingUser) {
                body.password = formData.password;
            }

            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to save user');
            }

            setSuccess(editingUser ? 'User updated successfully!' : 'User created successfully!');
            handleCloseModal();
            fetchUsers(token);
        } catch (err: any) {
            setError(err.message);
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

            fetchUsers(token);
        } catch (error) {
            console.error('Error toggling user status:', error);
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

    const handlePermissionToggle = (permissionId: number) => {
        setFormData(prev => ({
            ...prev,
            permissionIds: prev.permissionIds.includes(permissionId)
                ? prev.permissionIds.filter(id => id !== permissionId)
                : [...prev.permissionIds, permissionId],
        }));
    };

    if (loading && users.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading users...</p>
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
                <header className="bg-white shadow-sm sticky top-0 z-30">
                    <div className="px-6 py-4">
                        <div className="flex items-center justify-between">

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

                {/* Main Content */}
                <main className="px-6 py-8">
                    <div className="flex items-center justify-between mb-6">
                        {!permissionDenied && (
                            <button
                                onClick={() => handleOpenModal()}
                                className="btn btn-primary"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                {content.addUser}
                            </button>
                        )}
                    </div>

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
                            {success && (
                                <div className="mb-6 p-4 bg-success-50 border border-success-200 rounded-lg text-success-700">
                                    {success}
                                </div>
                            )}

                            {/* Users Table */}
                            <div className="card">
                                {users.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 border-b border-gray-200">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{content.name}</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{content.email}</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{content.role}</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{content.status}</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{content.permissions}</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{content.actions}</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {users.map((u) => (
                                                    <tr key={u.id} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3 text-gray-900 font-medium">{u.name}</td>
                                                        <td className="px-4 py-3 text-gray-600">{u.email}</td>
                                                        <td className="px-4 py-3 text-gray-600">
                                                            {content.roles[u.role as keyof typeof content.roles]}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${u.isActive ? 'bg-success-100 text-success-700' : 'bg-gray-100 text-gray-700'
                                                                }`}>
                                                                {u.isActive ? content.active : content.inactive}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-600 text-sm">
                                                            {u.permissions.length} permissions
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => handleOpenModal(u)}
                                                                    className="text-info-500 hover:text-primary-700 text-sm font-medium"
                                                                    disabled={u.id === user?.id}
                                                                >
                                                                    {content.edit}
                                                                </button>
                                                                {u.id !== user?.id && (
                                                                    <button
                                                                        onClick={() => handleToggleActive(u.id, u.isActive)}
                                                                        className={`text-sm font-medium ${u.isActive ? 'text-danger-600 hover:text-danger-700' : 'text-success-600 hover:text-success-700'
                                                                            }`}
                                                                    >
                                                                        {u.isActive ? content.deactivate : content.activate}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-center py-12">{content.noUsers}</p>
                                )}
                            </div>
                        </>
                    )}
                </main>
            </div>

            {/* User Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">
                            {editingUser ? content.editUser : content.addUser}
                        </h3>

                        {error && (
                            <div className="mb-4 p-4 bg-danger-50 border border-danger-200 rounded-lg text-danger-700">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {content.name}
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="input"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {content.email}
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="input"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {content.password}
                                </label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="input"
                                    placeholder={editingUser ? content.passwordHint : ''}
                                    required={!editingUser}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {content.role}
                                </label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="input"
                                >
                                    <option value="SUB_ADMIN">{content.roles.SUB_ADMIN}</option>
                                    <option value="SUPER_ADMIN">{content.roles.SUPER_ADMIN}</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {content.selectPermissions}
                                </label>
                                <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                                    {permissions.map((permission) => (
                                        <label key={permission.id} className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.permissionIds.includes(permission.id)}
                                                onChange={() => handlePermissionToggle(permission.id)}
                                                className="rounded border-gray-300"
                                            />
                                            <span className="text-sm text-gray-700">{permission.description}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {editingUser && (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.isActive}
                                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                        className="rounded border-gray-300"
                                    />
                                    <label className="text-sm text-gray-700">{content.active}</label>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={handleCloseModal}
                                className="btn btn-secondary flex-1"
                                disabled={loading}
                            >
                                {content.cancel}
                            </button>
                            <button
                                onClick={handleSave}
                                className="btn btn-primary flex-1"
                                disabled={loading}
                            >
                                {loading ? content.saving : content.save}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
