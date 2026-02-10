/**
 * Application-level enums
 * These replace database-level enums for easier maintenance and flexibility
 */

// User Role Enum
export const UserRole = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  SUB_ADMIN: 'SUB_ADMIN',
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

// Identification Card Enum
export const RequestType = {
  'Resident': 'Resident',
  'Not Resident': 'Not Resident',
} as const;

export type RequestType = typeof RequestType[keyof typeof RequestType];

// Request Status Enum
export const RequestStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;

export type RequestStatus = typeof RequestStatus[keyof typeof RequestStatus];

// Action Type Enum
export const ActionType = {
  REQUEST_MANAGEMENT: 'REQUEST_MANAGEMENT',
  USER_MANAGEMENT: 'USER_MANAGEMENT',
  SYSTEM_INTEGRATION: 'SYSTEM_INTEGRATION',
  AUTH: 'AUTH',
} as const;

export type ActionType = typeof ActionType[keyof typeof ActionType];

// Gender Enum
export const Gender = {
  MALE: 'MALE',
  FEMALE: 'FEMALE',
} as const;

export type Gender = typeof Gender[keyof typeof Gender];

// Notification Action Type Enum
export const NotificationActionType = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
} as const;

export type NotificationActionType = typeof NotificationActionType[keyof typeof NotificationActionType];

// Helper functions for validation
export const isValidUserRole = (value: string): value is UserRole => {
  return Object.values(UserRole).includes(value as UserRole);
};

export const isValidRequestType = (value: string): value is RequestType => {
  return Object.values(RequestType).includes(value as RequestType);
};

export const isValidRequestStatus = (value: string): value is RequestStatus => {
  return Object.values(RequestStatus).includes(value as RequestStatus);
};

export const isValidActionType = (value: string): value is ActionType => {
  return Object.values(ActionType).includes(value as ActionType);
};

export const isValidGender = (value: string): value is Gender => {
  return Object.values(Gender).includes(value as Gender);
};

export const isValidNotificationActionType = (value: string): value is NotificationActionType => {
  return Object.values(NotificationActionType).includes(value as NotificationActionType);
};
