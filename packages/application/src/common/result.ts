/**
 * Result Pattern
 *
 * Type-safe error handling using Result type instead of exceptions.
 */

/**
 * Result type for operations that can fail
 */
export type Result<T, E = Error> =
    | { success: true; value: T }
    | { success: false; error: E };

/**
 * Create a success result
 */
export function success<T>(value: T): Result<T, never> {
    return { success: true, value };
}

/**
 * Create a failure result
 */
export function failure<E = Error>(error: E): Result<never, E> {
    return { success: false, error };
}

/**
 * Check if result is success
 */
export function isSuccess<T, E>(result: Result<T, E>): result is { success: true; value: T } {
    return result.success;
}

/**
 * Check if result is failure
 */
export function isFailure<T, E>(result: Result<T, E>): result is { success: false; error: E } {
    return !result.success;
}

/**
 * Unwrap a result or throw if failure
 */
export function unwrap<T, E>(result: Result<T, E>): T {
    if (result.success) {
        return result.value;
    }
    throw result.error;
}

/**
 * Unwrap a result or return default value
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
    if (result.success) {
        return result.value;
    }
    return defaultValue;
}

/**
 * Map a successful result
 */
export function map<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
    if (result.success) {
        return success(fn(result.value));
    }
    return result;
}

/**
 * FlatMap a successful result
 */
export function flatMap<T, U, E>(
    result: Result<T, E>,
    fn: (value: T) => Result<U, E>,
): Result<U, E> {
    if (result.success) {
        return fn(result.value);
    }
    return result;
}

/**
 * Map an error
 */
export function mapError<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> {
    if (result.success) {
        return result;
    }
    return failure(fn(result.error));
}

/**
 * Combine multiple results
 */
export function combine<T, E>(results: Result<T, E>[]): Result<T[], E> {
    const values: T[] = [];
    for (const result of results) {
        if (!result.success) {
            return result;
        }
        values.push(result.value);
    }
    return success(values);
}

/**
 * Try to execute a function and return Result
 */
export async function tryCatch<T>(fn: () => Promise<T>): Promise<Result<T, Error>> {
    try {
        const value = await fn();
        return success(value);
    } catch (error) {
        return failure(error instanceof Error ? error : new Error(String(error)));
    }
}

/**
 * Application-specific errors
 */
export class ApplicationError extends Error {
    constructor(
        message: string,
        public readonly code: string,
        public readonly details?: Record<string, unknown>,
    ) {
        super(message);
        this.name = 'ApplicationError';
    }
}

/**
 * Validation error
 */
export class ValidationError extends ApplicationError {
    constructor(
        message: string,
        public readonly validationErrors: Record<string, string[]>,
    ) {
        super(message, 'VALIDATION_ERROR', { validationErrors });
        this.name = 'ValidationError';
    }
}

/**
 * Not found error
 */
export class NotFoundError extends ApplicationError {
    constructor(entity: string, id: string) {
        super(`${entity} with id ${id} not found`, 'NOT_FOUND', { entity, id });
        this.name = 'NotFoundError';
    }
}

/**
 * Unauthorized error
 */
export class UnauthorizedError extends ApplicationError {
    constructor(message: string = 'Unauthorized') {
        super(message, 'UNAUTHORIZED');
        this.name = 'UnauthorizedError';
    }
}

/**
 * Forbidden error
 */
export class ForbiddenError extends ApplicationError {
    constructor(message: string = 'Forbidden') {
        super(message, 'FORBIDDEN');
        this.name = 'ForbiddenError';
    }
}

/**
 * Conflict error
 */
export class ConflictError extends ApplicationError {
    constructor(message: string) {
        super(message, 'CONFLICT');
        this.name = 'ConflictError';
    }
}
