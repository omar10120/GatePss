/**
 * Centralized API Client
 * Handles authentication, token expiration, and redirects
 */

export interface ApiError {
    error: string;
    message: string;
    code?: string;
}

/**
 * Get current locale from pathname or default to 'en'
 */
function getLocale(): string {
    if (typeof window === 'undefined') return 'en';
    const pathname = window.location.pathname;
    const localeMatch = pathname.match(/^\/([a-z]{2})\//);
    return localeMatch ? localeMatch[1] : 'en';
}

/**
 * Handle 401 responses and redirect to login if token is expired
 * Use this after any fetch call to handle authentication errors
 */
export async function handleAuthResponse(response: Response): Promise<void> {
    if (response.status === 401) {
        const data = await response.json().catch(() => ({}));
        
        // Clear token and redirect to login
        if (typeof window !== 'undefined') {
            const locale = getLocale();
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = `/${locale}/admin/login`;
        }
        
        throw new Error(data.message || 'Session expired. Please login again.');
    }
}

/**
 * Wrapper around native fetch that automatically handles authentication
 * Use this instead of native fetch for API calls that require authentication
 */
export async function authenticatedFetch(
    url: string,
    options: RequestInit = {}
): Promise<Response> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    const headers: Record<string, string> = {
        ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
        ...options,
        headers,
    });

    // Handle 401 - token expired
    if (response.status === 401) {
        const data = await response.json().catch(() => ({}));
        
        // Clear token and redirect to login
        if (typeof window !== 'undefined') {
            const locale = getLocale();
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = `/${locale}/admin/login`;
        }
        
        // Return response anyway so caller can handle if needed
        return response;
    }

    return response;
}

export async function apiFetch<T = any>(
    url: string,
    options: RequestInit = {}
): Promise<T> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
        ...options,
        headers,
    });

    // Handle redirect responses (for server-side redirects)
    if (response.status === 307 || response.status === 308) {
        const redirectUrl = response.headers.get('Location') || '/admin/login';
        if (typeof window !== 'undefined') {
            window.location.href = redirectUrl;
        }
        throw new Error('Session expired. Redirecting to login...');
    }

    // Handle 401 Unauthorized - token expired or invalid
    if (response.status === 401) {
        const data = await response.json().catch(() => ({}));
        
        // Clear token and redirect to login
        if (typeof window !== 'undefined') {
            const locale = getLocale();
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = `/${locale}/admin/login`;
        }
        
        throw new Error(data.message || 'Session expired. Please login again.');
    }

    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.data || result;
}

