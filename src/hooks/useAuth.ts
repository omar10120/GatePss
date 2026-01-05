import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    permissions: string[];
}

export interface AuthState {
    user: User | null;
    token: string | null;
    loading: boolean;
    isAuthenticated: boolean;
}

export const useAuth = () => {
    const router = useRouter();
    const [authState, setAuthState] = useState<AuthState>({
        user: null,
        token: null,
        loading: true,
        isAuthenticated: false,
    });

    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('token');
            const userData = localStorage.getItem('user');

            if (!token) {
                setAuthState({
                    user: null,
                    token: null,
                    loading: false,
                    isAuthenticated: false,
                });
                return;
            }

            // Initial load from localStorage for speed
            if (userData) {
                const user = JSON.parse(userData);
                setAuthState({
                    user,
                    token,
                    loading: true,
                    isAuthenticated: true,
                });
            }

            // Fetch fresh user data
            try {
                const response = await fetch('/api/auth/me', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                const data = await response.json();

                if (data.success) {
                    const user = data.data.user;
                    localStorage.setItem('user', JSON.stringify(user));
                    setAuthState({
                        user,
                        token,
                        loading: false,
                        isAuthenticated: true,
                    });
                } else {
                    // Token is invalid or expired
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    setAuthState({
                        user: null,
                        token: null,
                        loading: false,
                        isAuthenticated: false,
                    });
                }
            } catch (error) {
                console.error('Error refreshing user data:', error);
                setAuthState((prev) => ({ ...prev, loading: false }));
            }
        };

        initAuth();
    }, []);

    const logout = async () => {
        const token = authState.token;

        try {
            if (token) {
                await fetch('/api/auth/logout', {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        }

        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setAuthState({
            user: null,
            token: null,
            loading: false,
            isAuthenticated: false,
        });
        router.push('/admin/login');
    };

    const requireAuth = () => {
        if (!authState.loading && !authState.isAuthenticated) {
            router.push('/admin/login');
        }
    };

    return {
        ...authState,
        logout,
        requireAuth,
    };
};
