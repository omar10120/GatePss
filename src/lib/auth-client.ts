export interface JWTPayload {
    userId: number;
    email: string;
    role: string;
    permissions: string[];
    exp?: number;
    iat?: number;
}

/**
 * Client-safe JWT token decoder
 * Only decodes the token without verification (for client-side use)
 * Full verification should be done on the server
 */
export function decodeToken(token: string): JWTPayload | null {
    try {
        const base64Url = token.split('.')[1];
        if (!base64Url) {
            return null;
        }
        
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        
        const payload = JSON.parse(jsonPayload) as JWTPayload & { exp?: number };
        
        // Check if token is expired
        if (payload.exp) {
            const currentTime = Math.floor(Date.now() / 1000);
            if (payload.exp < currentTime) {
                return null; // Token expired
            }
        }
        
        return payload;
    } catch (error) {
        console.error('Token decode failed:', error);
        return null;
    }
}

/**
 * Check if a token is valid (not expired) on the client side
 * Note: This only checks expiration, not signature verification
 */
export function isTokenValid(token: string | null): boolean {
    if (!token) {
        return false;
    }
    
    const decoded = decodeToken(token);
    return decoded !== null;
}

