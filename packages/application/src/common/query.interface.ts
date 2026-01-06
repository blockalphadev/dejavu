/**
 * Query Interface
 *
 * Queries represent requests to read data from the system.
 * They should never modify state.
 */

/**
 * Base query interface
 */
export interface IQuery<TResult = unknown> {
    /** Query type identifier */
    readonly queryType: string;
    /** Expected result type (for type inference) */
    readonly _resultType?: TResult;
}

/**
 * Abstract query base class
 */
export abstract class Query<TResult = unknown> implements IQuery<TResult> {
    abstract readonly queryType: string;
    readonly _resultType?: TResult;
}

/**
 * Paginated query options
 */
export interface PaginatedQueryOptions {
    /** Page number (1-indexed) */
    page?: number;
    /** Items per page */
    pageSize?: number;
    /** Sort field */
    sortBy?: string;
    /** Sort direction */
    sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated result
 */
export interface PaginatedResult<T> {
    /** Data items */
    data: T[];
    /** Total count */
    total: number;
    /** Current page */
    page: number;
    /** Page size */
    pageSize: number;
    /** Total pages */
    totalPages: number;
    /** Has next page */
    hasNextPage: boolean;
    /** Has previous page */
    hasPreviousPage: boolean;
}

/**
 * Create a paginated result
 */
export function createPaginatedResult<T>(
    data: T[],
    total: number,
    page: number,
    pageSize: number,
): PaginatedResult<T> {
    const totalPages = Math.ceil(total / pageSize);
    return {
        data,
        total,
        page,
        pageSize,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
    };
}
