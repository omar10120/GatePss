import { useEffect, useState } from 'react';
import { useRouter, usePathname } from '@/i18n/navigation';
import { PERMISSIONS } from '@/config/navigation';

// Route to permission mapping
const ROUTE_PERMISSIONS: Record<string, string> = {
    '/admin/dashboard': PERMISSIONS.VIEW_DASHBOARD,
    '/admin/requests': PERMISSIONS.MANAGE_REQUESTS,
    '/admin/users': PERMISSIONS.MANAGE_USERS,
    '/admin/activity': PERMISSIONS.VIEW_LOGS,
    '/admin/permits': PERMISSIONS.MANAGE_REQUESTS,
};

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
                    const response = await fetch('/api/auth/me', {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    });

                    if (!response.ok) {
                        router.push('/admin/login');
                        return;
                    }

                    const data = await response.json();
                    if (data.success) {
                        currentUser = data.data.user;
                        localStorage.setItem('user', JSON.stringify(currentUser));
                        setUser(currentUser);
                    } else {
                        router.push('/admin/login');
                        return;
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error);
                    router.push('/admin/login');
                    return;
                }
            }

            // Check if current route requires a specific permission
            const requiredPermission = ROUTE_PERMISSIONS[pathname];
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

