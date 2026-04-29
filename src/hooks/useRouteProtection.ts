import { useEffect, useState } from 'react';
import { useRouter, usePathname } from '@/i18n/navigation';
import { PERMISSIONS } from '@/config/navigation';
import { apiFetch } from '@/lib/api-client';

// Route to permission mapping
const ROUTE_PERMISSIONS: Record<string, string> = {
    '/admin/dashboard': PERMISSIONS.VIEW_DASHBOARD,
    '/admin/requests': PERMISSIONS.MANAGE_REQUESTS,
    '/admin/permits': PERMISSIONS.MANAGE_PERMITS,
    '/admin/users': PERMISSIONS.MANAGE_USERS,
    '/admin/activity': PERMISSIONS.VIEW_LOGS,
    '/admin/settings': PERMISSIONS.MANAGE_SETTINGS,
};

const PERMISSION_ROUTE_PREFIXES: Array<{ prefix: string; permission: string }> = [
    { prefix: '/admin/requests', permission: PERMISSIONS.MANAGE_REQUESTS },
    { prefix: '/admin/permits', permission: PERMISSIONS.MANAGE_PERMITS },
];

export function useRouteProtection() {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);

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
                    // Only redirect here if it's not a 401 (which would have already redirected)
                    if (error instanceof Error && !error.message.includes('Session expired')) {
                        router.push('/admin/login');
                    }
                    return;
                }
            }

            // Check if current route requires a specific permission
            const exactPermission = ROUTE_PERMISSIONS[pathname];
            const prefixPermission = PERMISSION_ROUTE_PREFIXES.find(({ prefix }) =>
                pathname.startsWith(prefix)
            )?.permission;
            const requiredPermission = exactPermission || prefixPermission;
            if (requiredPermission) {
                const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';
                const userPermissions = currentUser.permissions || [];
                const hasRequiredPermission = isSuperAdmin || userPermissions.includes(requiredPermission);

                if (!hasRequiredPermission) {
                    // User doesn't have required permission - redirect to unauthorized page
                    router.push('/admin/unauthorized');
                    return;
                }
            }

            setIsAuthorized(true);
            setLoading(false);
        };

        checkAuthAndPermissions();
    }, [pathname, router]);

    return { user, loading, isAuthorized };
}

