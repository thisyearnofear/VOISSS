/**
 * Unified API Response Types
 * 
 * Provides consistent response format across all API endpoints
 * following the DRY principle and clean architecture patterns.
 */

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: ApiError;
    meta?: ResponseMeta;
    pagination?: PaginationMeta;
}

export interface ApiError {
    code: string;
    message: string;
    details?: Record<string, any>;
    field?: string; // For validation errors
    retryable?: boolean;
    userActionRequired?: boolean;
}

export interface ResponseMeta {
    timestamp: string;
    requestId: string;
    version: string;
    processingTime?: number;
}

export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

// Error codes for consistent error handling
export const API_ERROR_CODES = {
    // Validation errors
    VALIDATION_FAILED: 'VALIDATION_FAILED',
    MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
    INVALID_FORMAT: 'INVALID_FORMAT',

    // Authentication/Authorization errors
    UNAUTHORIZED: 'UNAUTHORIZED',
    INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
    INVALID_TOKEN: 'INVALID_TOKEN',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',

    // Resource errors
    RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
    RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',
    RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',

    // Business logic errors
    INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
    MISSION_EXPIRED: 'MISSION_EXPIRED',
    MISSION_FULL: 'MISSION_FULL',
    ALREADY_ACCEPTED: 'ALREADY_ACCEPTED',

    // System errors
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    NETWORK_ERROR: 'NETWORK_ERROR',
} as const;

export type ApiErrorCode = typeof API_ERROR_CODES[keyof typeof API_ERROR_CODES];

// Success response builders
export function createSuccessResponse<T>(
    data: T,
    meta?: Partial<ResponseMeta>,
    pagination?: PaginationMeta
): ApiResponse<T> {
    return {
        success: true,
        data,
        meta: {
            timestamp: new Date().toISOString(),
            requestId: generateRequestId(),
            version: '1.0',
            ...meta,
        },
        ...(pagination && { pagination }),
    };
}

// Error response builders
export function createErrorResponse(
    code: ApiErrorCode,
    message: string,
    details?: Record<string, any>,
    field?: string
): ApiResponse<never> {
    return {
        success: false,
        error: {
            code,
            message,
            details,
            field,
            retryable: isRetryableError(code),
            userActionRequired: requiresUserAction(code),
        },
        meta: {
            timestamp: new Date().toISOString(),
            requestId: generateRequestId(),
            version: '1.0',
        },
    };
}

// Validation error response builder
export function createValidationErrorResponse(
    field: string,
    message: string,
    details?: Record<string, any>
): ApiResponse<never> {
    return createErrorResponse(
        API_ERROR_CODES.VALIDATION_FAILED,
        message,
        details,
        field
    );
}

// Helper functions
function generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function isRetryableError(code: string): boolean {
    const retryableCodes = [
        API_ERROR_CODES.INTERNAL_ERROR,
        API_ERROR_CODES.SERVICE_UNAVAILABLE,
        API_ERROR_CODES.NETWORK_ERROR,
    ];
    return retryableCodes.includes(code as any);
}

function requiresUserAction(code: string): boolean {
    const userActionCodes = [
        API_ERROR_CODES.VALIDATION_FAILED,
        API_ERROR_CODES.MISSING_REQUIRED_FIELD,
        API_ERROR_CODES.INVALID_FORMAT,
        API_ERROR_CODES.INSUFFICIENT_BALANCE,
        API_ERROR_CODES.UNAUTHORIZED,
    ];
    return userActionCodes.includes(code as any);
}

// Type guards for response handling
export function isSuccessResponse<T>(response: ApiResponse<T>): response is ApiResponse<T> & { success: true; data: T } {
    return response.success === true && response.data !== undefined;
}

export function isErrorResponse(response: ApiResponse<any>): response is ApiResponse<never> & { success: false; error: ApiError } {
    return response.success === false && response.error !== undefined;
}

// Query parameter types for consistent API interfaces
export interface BaseQueryParams {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface MissionQueryParams extends BaseQueryParams {
    difficulty?: string[];
    topics?: string[];
    languages?: string[];
    status?: string[];
    search?: string;
    createdBy?: string;
    minReward?: number;
    maxReward?: number;
    locationBased?: boolean;
}

// Batch operation types
export interface BatchOperation<T> {
    items: T[];
    batchId: string;
    totalItems: number;
}

export interface BatchResult<T = any> {
    batchId: string;
    totalItems: number;
    successCount: number;
    failureCount: number;
    results: Array<{
        item: any;
        success: boolean;
        data?: T;
        error?: ApiError;
    }>;
}