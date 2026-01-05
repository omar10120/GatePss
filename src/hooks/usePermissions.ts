import { User } from './useAuth';

export const usePermissions = (user: User | null) => {
    const hasPermission = (permissionKey: string): boolean => {
        if (!user) return false;
        if (user.role === 'SUPER_ADMIN') return true;
        return user.permissions?.includes(permissionKey) || false;
    };

    const hasAnyPermission = (permissionKeys: string[]): boolean => {
        if (!user) return false;
        if (user.role === 'SUPER_ADMIN') return true;
        return permissionKeys.some((key) => user.permissions?.includes(key));
    };

    const hasAllPermissions = (permissionKeys: string[]): boolean => {
        if (!user) return false;
        if (user.role === 'SUPER_ADMIN') return true;
        return permissionKeys.every((key) => user.permissions?.includes(key));
    };

    const isSuperAdmin = (): boolean => {
        return user?.role === 'SUPER_ADMIN';
    };

    return {
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        isSuperAdmin,
    };
};
