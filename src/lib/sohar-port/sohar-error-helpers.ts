/**
 * Sohar Port often returns HTTP 400 with ErrorDetails when the configured API user
 * is not allowed to read a specific pass (ACL / org / entity on their side).
 * This is expected for some passes and should not be logged like a hard system error.
 */
export function isSoharPassDetailsNotAuthorizedText(text: string): boolean {
    const t = String(text || '').toLowerCase();
    if (!t.includes('not authorized')) return false;
    return t.includes('pass') || t.includes('gate');
}

export const SOHAR_PASS_NOT_AUTHORIZED_CODE = 'SOHAR_PASS_NOT_AUTHORIZED' as const;
