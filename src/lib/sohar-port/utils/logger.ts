/**
 * Sohar Port API Integration - Logger Utility
 * 
 * This file contains logging utilities for Sohar Port API operations.
 */

import prisma from '@/lib/prisma';
import { ActionType } from '@prisma/client';
import { SoharPortActivityLog } from '../types';

/**
 * Log Sohar Port API call to activity log
 */
export async function logApiCall(log: SoharPortActivityLog): Promise<void> {
    try {
        await prisma.activityLog.create({
            data: {
                actionType: ActionType.SYSTEM_INTEGRATION,
                actionPerformed: `Sohar Port API: ${log.operation}`,
                affectedEntityType: 'REQUEST',
                affectedEntityId: log.externalReference ? parseInt(log.externalReference.split('-')[1] || '0') : undefined,
                details: JSON.stringify({
                    operation: log.operation,
                    statusCode: log.statusCode,
                    externalReference: log.externalReference,
                    duration: log.duration,
                    error: log.error,
                    timestamp: new Date().toISOString(),
                }),
            },
        });
    } catch (error) {
        console.error('Failed to log Sohar Port API call:', error);
    }
}

/**
 * Log successful operation
 */
export function logSuccess(operation: string, details?: any): void {
    console.log(`✅ Sohar Port: ${operation}`, details || '');
}

/**
 * Log error
 */
export function logError(operation: string, error: any): void {
    console.error(`❌ Sohar Port: ${operation}`, error);
}

/**
 * Log warning
 */
export function logWarning(operation: string, message: string): void {
    console.warn(`⚠️  Sohar Port: ${operation} - ${message}`);
}

/**
 * Log info
 */
export function logInfo(operation: string, message: string): void {
    console.log(`ℹ️  Sohar Port: ${operation} - ${message}`);
}
