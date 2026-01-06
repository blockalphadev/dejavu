/**
 * Result Pattern Implementation
 *
 * A functional approach to error handling that makes errors explicit
 * and forces consumers to handle both success and failure cases.
 */

/**
 * Success result type
 */
export interface Success<T> {
    readonly success: true;
    readonly value: T;
}

/**
 * Failure result type
 */
export interface Failure<E> {
    readonly success: false;
    readonly error: E;
}

/**
 * Result type - either Success or Failure
 */
export type Result<T, E = Error> = Success<T> | Failure<E>;

/**
 * Result factory functions
 */
export const Result = {
    /**
     * Create a success result
     */
    ok: <T>(value: T): Success<T> => ({
        success: true,
        value,
    }),

    /**
     * Create a failure result
     */
    fail: <E>(error: E): Failure<E> => ({
        success: false,
        error,
    }),

    /**
     * Check if result is success
     */
    isOk: <T, E>(result: Result<T, E>): result is Success<T> => result.success,

    /**
     * Check if result is failure
     */
    isFail: <T, E>(result: Result<T, E>): result is Failure<E> => !result.success,

    /**
     * Map success value to new value
     */
    map: <T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> => {
        if (result.success) {
            return Result.ok(fn(result.value));
        }
        return result;
    },

    /**
     * Map error to new error
     */
    mapError: <T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> => {
        if (!result.success) {
            return Result.fail(fn(result.error));
        }
        return result;
    },

    /**
     * FlatMap/chain success value
     */
    flatMap: <T, U, E>(result: Result<T, E>, fn: (value: T) => Result<U, E>): Result<U, E> => {
        if (result.success) {
            return fn(result.value);
        }
        return result;
    },

    /**
     * Get value or default
     */
    getOrElse: <T, E>(result: Result<T, E>, defaultValue: T): T => {
        if (result.success) {
            return result.value;
        }
        return defaultValue;
    },

    /**
     * Get value or throw error
     */
    getOrThrow: <T, E>(result: Result<T, E>): T => {
        if (result.success) {
            return result.value;
        }
        throw result.error;
    },

    /**
     * Combine multiple results into a single result with array of values
     */
    combine: <T, E>(results: Result<T, E>[]): Result<T[], E> => {
        const values: T[] = [];
        for (const result of results) {
            if (!result.success) {
                return result;
            }
            values.push(result.value);
        }
        return Result.ok(values);
    },

    /**
     * Try to execute a function and wrap result
     */
    try: <T>(fn: () => T): Result<T, Error> => {
        try {
            return Result.ok(fn());
        } catch (error) {
            return Result.fail(error instanceof Error ? error : new Error(String(error)));
        }
    },

    /**
     * Try to execute an async function and wrap result
     */
    tryAsync: async <T>(fn: () => Promise<T>): Promise<Result<T, Error>> => {
        try {
            return Result.ok(await fn());
        } catch (error) {
            return Result.fail(error instanceof Error ? error : new Error(String(error)));
        }
    },
} as const;

/**
 * Optional type - represents a value that may or may not exist
 */
export type Optional<T> = T | null | undefined;

/**
 * Either type - represents a value that can be one of two types
 */
export type Either<L, R> = { left: L; right?: never } | { left?: never; right: R };

/**
 * Either factory functions
 */
export const Either = {
    left: <L, R = never>(value: L): Either<L, R> => ({ left: value }),
    right: <R, L = never>(value: R): Either<L, R> => ({ right: value }),
    isLeft: <L, R>(either: Either<L, R>): either is { left: L; right?: never } =>
        'left' in either && either.left !== undefined,
    isRight: <L, R>(either: Either<L, R>): either is { left?: never; right: R } =>
        'right' in either && either.right !== undefined,
} as const;

/**
 * Async Result type for async operations
 */
export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;
