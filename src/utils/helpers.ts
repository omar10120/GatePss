export function generateRequestNumber(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const counter = timestamp.toString().slice(-6);
    return `GP-${counter}${random}`;
}

export function formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

export function formatDateTime(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

export function validatePassportId(passportId: string): boolean {
    // Basic validation - alphanumeric, 6-20 characters
    const passportRegex = /^[A-Z0-9]{6,20}$/i;
    return passportRegex.test(passportId);
}

export function sanitizeFilename(filename: string): string {
    return filename
        .replace(/[^a-z0-9.-]/gi, '_')
        .toLowerCase();
}

export function getFileExtension(filename: string): string {
    return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
}

export function isValidFileType(filename: string, allowedTypes: string[]): boolean {
    const ext = getFileExtension(filename).toLowerCase();
    return allowedTypes.includes(ext);
}

export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

export function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

export function capitalizeFirstLetter(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function parseQueryParams(url: string): Record<string, string> {
    const params: Record<string, string> = {};
    const urlObj = new URL(url);
    urlObj.searchParams.forEach((value, key) => {
        params[key] = value;
    });
    return params;
}

export function buildQueryString(params: Record<string, any>): string {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            searchParams.append(key, String(value));
        }
    });
    return searchParams.toString();
}

export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function isDateInPast(date: Date | string): boolean {
    const d = new Date(date);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    d.setHours(0, 0, 0, 0);
    return d < now;
}

export function isDateInFuture(date: Date | string): boolean {
    const d = new Date(date);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    d.setHours(0, 0, 0, 0);
    return d > now;
}

export function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

export function getStatusColor(status: string): string {
    switch (status.toUpperCase()) {
        case 'APPROVED':
            return 'success';
        case 'REJECTED':
            return 'danger';
        case 'PENDING':
            return 'warning';
        default:
            return 'primary';
    }
}

export function getRequestTypeLabel(type: string): string {
    const labels: Record<string, string> = {
        VISITOR: 'Visitor',
        CONTRACTOR: 'Contractor',
        EMPLOYEE: 'Employee',
        VEHICLE: 'Vehicle',
    };
    return labels[type] || type;
}
