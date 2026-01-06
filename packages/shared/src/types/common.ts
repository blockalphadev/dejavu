/**
 * Common Types
 *
 * Generic types used across the entire platform
 */

/**
 * Pagination parameters
 */
export interface PaginationParams {
    page: number;
    pageSize: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: Record<string, unknown>;
    };
    meta?: {
        timestamp: string;
        requestId?: string;
    };
}

/**
 * Timestamp fields for entities
 */
export interface Timestamps {
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Soft delete fields
 */
export interface SoftDeletable {
    deletedAt?: Date;
    isDeleted: boolean;
}

/**
 * Audit fields
 */
export interface Auditable extends Timestamps {
    createdBy?: string;
    updatedBy?: string;
}

/**
 * UUID branded type
 */
export type UUID = string & { readonly __brand: unique symbol };

/**
 * ISO Date string branded type
 */
export type ISODateString = string & { readonly __brand: unique symbol };

/**
 * ID types for type-safe identifiers
 */
export type UserId = UUID & { readonly __type: 'UserId' };
export type MarketId = UUID & { readonly __type: 'MarketId' };
export type OrderId = UUID & { readonly __type: 'OrderId' };
export type TransactionId = UUID & { readonly __type: 'TransactionId' };

/**
 * Currency amount represented as string for precision
 */
export type CurrencyAmount = string & { readonly __type: 'CurrencyAmount' };

/**
 * Percentage value (0-100)
 */
export type Percentage = number & { readonly __type: 'Percentage' };

/**
 * Probability value (0-1)
 */
export type Probability = number & { readonly __type: 'Probability' };

/**
 * Environment types
 */
export type Environment = 'development' | 'staging' | 'production' | 'test';

/**
 * Log levels
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';
