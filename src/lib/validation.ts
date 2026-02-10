/**
 * Validation utilities for backend API routes
 * Based on BRD requirements
 */

// Email validation
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Passport/ID validation (6-20 alphanumeric characters)
export function validatePassportId(passportId: string): boolean {
  const passportRegex = /^[A-Z0-9]{6,20}$/i;
  return passportRegex.test(passportId);
}

// Date validation - ensure date is not in the past
export function validateDateNotPast(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  return checkDate >= today;
}

// Minimum length validation
export function validateMinLength(value: string, minLength: number): boolean {
  if (!value) return false;
  return value.trim().length >= minLength;
}

// File size validation (in bytes)
export function validateFileSize(sizeInBytes: number, maxMB: number): boolean {
  const maxBytes = maxMB * 1024 * 1024;
  return sizeInBytes <= maxBytes;
}

export function validateFileType(filename: string, allowedTypes: string[]): boolean {
  const extension = filename.split('.').pop()?.toLowerCase();
  if (!extension) return false;
  return allowedTypes.includes(extension);
}

// Identification Card validation
export function validateRequestType(type: string): boolean {
  const validTypes = ['Resident', 'Not Resident'];
  return validTypes.includes(type);
}

// User role validation
export function validateUserRole(role: string): boolean {
  const validRoles = ['SUPER_ADMIN', 'SUB_ADMIN'];
  return validRoles.includes(role);
}

// Request status validation
export function validateRequestStatus(status: string): boolean {
  const validStatuses = ['PENDING', 'APPROVED', 'REJECTED'];
  return validStatuses.includes(status);
}

// Validation result type
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Visitor request validation
export interface VisitorRequestData {
  applicantName?: string;
  applicantEmail?: string;
  passportIdNumber?: string;
  purposeOfVisit?: string;
  dateOfVisit?: string;
  requestType?: string;
  passportIdImage?: File | null;
}

export function validateVisitorRequest(data: VisitorRequestData): ValidationResult {
  const errors: string[] = [];

  // Name validation
  if (!data.applicantName || !validateMinLength(data.applicantName, 2)) {
    errors.push('Applicant name is required (minimum 2 characters)');
  }

  // Email validation
  if (!data.applicantEmail || !validateEmail(data.applicantEmail)) {
    errors.push('Valid email address is required');
  }

  // Passport/ID validation
  if (!data.passportIdNumber || !validatePassportId(data.passportIdNumber)) {
    errors.push('Valid passport/ID number is required (6-20 alphanumeric characters)');
  }

  // Purpose of visit validation
  if (!data.purposeOfVisit || !validateMinLength(data.purposeOfVisit, 10)) {
    errors.push('Purpose of visit is required (minimum 10 characters)');
  }

  // Date of visit validation
  if (!data.dateOfVisit) {
    errors.push('Date of visit is required');
  } else {
    const visitDate = new Date(data.dateOfVisit);
    if (!validateDateNotPast(visitDate)) {
      errors.push('Date of visit cannot be in the past');
    }
  }

  // Identification Card validation
  if (!data.requestType || !validateRequestType(data.requestType)) {
    errors.push('Valid Identification Card is required (Resident, Not Resident)');
  }

  // Image validation
  if (!data.passportIdImage) {
    errors.push('Passport/ID image is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Login validation
export interface LoginData {
  email?: string;
  password?: string;
}

export function validateLogin(data: LoginData): ValidationResult {
  const errors: string[] = [];

  if (!data.email || !data.password) {
    errors.push('Cannot login without filling all fields');
    return { isValid: false, errors };
  }

  if (!validateEmail(data.email)) {
    errors.push('Valid email address is required');
  }

  if (!validateMinLength(data.password, 1)) {
    errors.push('Password is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Rejection validation
export function validateRejection(rejectionReason?: string): ValidationResult {
  const errors: string[] = [];

  if (!rejectionReason || !validateMinLength(rejectionReason, 10)) {
    errors.push('Rejection reason is required (minimum 10 characters)');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// User creation/update validation
export interface UserData {
  name?: string;
  email?: string;
  password?: string;
  role?: string;
}

export function validateUserData(data: UserData, isUpdate: boolean = false): ValidationResult {
  const errors: string[] = [];

  if (!isUpdate || data.name !== undefined) {
    if (!data.name || !validateMinLength(data.name, 2)) {
      errors.push('Name is required (minimum 2 characters)');
    }
  }

  if (!isUpdate || data.email !== undefined) {
    if (!data.email || !validateEmail(data.email)) {
      errors.push('Valid email address is required');
    }
  }

  if (!isUpdate) {
    // Password required for creation
    if (!data.password || !validateMinLength(data.password, 6)) {
      errors.push('Password is required (minimum 6 characters)');
    }
  } else if (data.password !== undefined) {
    // Password optional for update, but if provided must meet requirements
    if (!validateMinLength(data.password, 6)) {
      errors.push('Password must be at least 6 characters');
    }
  }

  if (!isUpdate || data.role !== undefined) {
    if (!data.role || !validateUserRole(data.role)) {
      errors.push('Valid role is required (SUPER_ADMIN or SUB_ADMIN)');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Generate request number
export function generateRequestNumber(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `REQ-${timestamp}-${random}`;
}
