/**
 * Sohar Port API Integration - Type Definitions
 * 
 * This file contains all TypeScript interfaces and types for the Sohar Port API integration.
 */

// ============================================================================
// API Version
// ============================================================================

export type ApiVersion = 'v1' | 'v2';

// ============================================================================
// Gate Pass Status
// ============================================================================

export type GatePassStatus =
    | 'PENDING'      // Submitted but not yet processed
    | 'APPROVED'     // Approved by admin
    | 'REJECTED'     // Rejected by admin
    | 'ACTIVE'       // Currently active in Sohar Port
    | 'EXPIRED'      // Past validity period
    | 'CANCELLED';   // Cancelled by admin or system

// ============================================================================
// Gate Pass Type
// ============================================================================

export type GatePassType =
    | 'VISITOR'
    | 'CONTRACTOR'
    | 'EMPLOYEE'
    | 'VEHICLE';

// ============================================================================
// Base Response Interface
// ============================================================================

export interface BaseResponse {
    success: boolean;
    statusCode: number;
    message: string;
    timestamp?: string;
}

// ============================================================================
// OUTBOUND (Send to Sohar Port) Types
// ============================================================================

/**
 * Request to create a new gate pass in Sohar Port system
 */
export interface CreateGatePassRequest {
    requestNumber: string;
    applicantName: string;
    applicantEmail: string;
    passportIdNumber: string;
    purposeOfVisit: string;
    dateOfVisit: string; // ISO 8601 format
    requestType: GatePassType;
    extraFields?: Record<string, any>;
}

/**
 * Response from creating a gate pass
 */
export interface CreateGatePassResponse extends BaseResponse {
    externalReference?: string;  // Sohar Port's reference ID
    qrCodePdfUrl?: string;        // URL to download QR code PDF
    error?: string;               // Error message if failed
}

/**
 * Request to update an existing gate pass
 */
export interface UpdateGatePassRequest {
    externalReference: string;
    applicantName?: string;
    applicantEmail?: string;
    passportIdNumber?: string;
    purposeOfVisit?: string;
    dateOfVisit?: string;
    extraFields?: Record<string, any>;
}

/**
 * Response from updating a gate pass
 */
export interface UpdateGatePassResponse extends BaseResponse {
    externalReference: string;
    error?: string;
}

/**
 * Request to cancel a gate pass
 */
export interface CancelGatePassRequest {
    externalReference: string;
    reason: string;
}

/**
 * Response from cancelling a gate pass
 */
export interface CancelGatePassResponse extends BaseResponse {
    externalReference: string;
    error?: string;
}

// ============================================================================
// INBOUND (Receive from Sohar Port) Types
// ============================================================================

/**
 * Request to get a single gate pass
 */
export interface GetGatePassRequest {
    externalReference: string;
}

/**
 * Gate pass data from Sohar Port
 */
export interface GatePassData {
    externalReference: string;
    status: GatePassStatus;
    requestNumber: string;
    applicantName: string;
    applicantEmail: string;
    passportIdNumber: string;
    purposeOfVisit: string;
    dateOfVisit: string;
    requestType: GatePassType;
    qrCodePdfUrl?: string;
    validFrom?: string;
    validUntil?: string;
    createdAt?: string;
    updatedAt?: string;
    metadata?: Record<string, any>;
}

/**
 * Response from getting a single gate pass
 */
export interface GetGatePassResponse extends BaseResponse {
    data?: GatePassData;
    error?: string;
}

/**
 * Request to list gate passes with filters
 */
export interface ListGatePassesRequest {
    status?: GatePassStatus;
    requestType?: GatePassType;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
    searchQuery?: string;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

/**
 * Response from listing gate passes
 */
export interface ListGatePassesResponse extends BaseResponse {
    data?: Array<GatePassData>;
    pagination?: PaginationMeta;
    error?: string;
}

/**
 * Request to get gate pass status only
 */
export interface GetStatusRequest {
    externalReference: string;
}

/**
 * Response from getting gate pass status
 */
export interface GetStatusResponse extends BaseResponse {
    externalReference: string;
    status?: GatePassStatus;
    validFrom?: string;
    validUntil?: string;
    error?: string;
}

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Configuration options for Sohar Port client
 */
export interface SoharPortConfig {
    baseUrl?: string;
    apiKey?: string;
    version?: ApiVersion;
    timeout?: number;
    useMock?: boolean;
    retryAttempts?: number;
    retryDelay?: number;
}

/**
 * HTTP request options
 */
export interface RequestOptions {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    endpoint: string;
    data?: any;
    params?: Record<string, string | number | boolean>;
    headers?: Record<string, string>;
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Base error for Sohar Port API errors
 */
export class SoharPortError extends Error {
    constructor(
        message: string,
        public statusCode: number,
        public errorCode?: string,
        public details?: any
    ) {
        super(message);
        this.name = 'SoharPortError';
        Object.setPrototypeOf(this, SoharPortError.prototype);
    }
}

/**
 * Network-related errors (timeout, connection refused, etc.)
 */
export class SoharPortNetworkError extends SoharPortError {
    constructor(message: string, details?: any) {
        super(message, 0, 'NETWORK_ERROR', details);
        this.name = 'SoharPortNetworkError';
        Object.setPrototypeOf(this, SoharPortNetworkError.prototype);
    }
}

/**
 * Authentication/Authorization errors
 */
export class SoharPortAuthError extends SoharPortError {
    constructor(message: string, statusCode: number = 401, details?: any) {
        super(message, statusCode, 'AUTH_ERROR', details);
        this.name = 'SoharPortAuthError';
        Object.setPrototypeOf(this, SoharPortAuthError.prototype);
    }
}

/**
 * Validation errors (invalid request data)
 */
export class SoharPortValidationError extends SoharPortError {
    constructor(message: string, details?: any) {
        super(message, 400, 'VALIDATION_ERROR', details);
        this.name = 'SoharPortValidationError';
        Object.setPrototypeOf(this, SoharPortValidationError.prototype);
    }
}

/**
 * Resource not found errors
 */
export class SoharPortNotFoundError extends SoharPortError {
    constructor(message: string, details?: any) {
        super(message, 404, 'NOT_FOUND', details);
        this.name = 'SoharPortNotFoundError';
        Object.setPrototypeOf(this, SoharPortNotFoundError.prototype);
    }
}

// ============================================================================
// Activity Log Types
// ============================================================================

/**
 * Activity log entry for Sohar Port operations
 */
export interface SoharPortActivityLog {
    operation: string;
    statusCode: number;
    externalReference?: string;
    duration?: number;
    error?: string;
    requestData?: any;
    responseData?: any;
}
