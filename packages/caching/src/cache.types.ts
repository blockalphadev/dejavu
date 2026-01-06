/**
 * Cache Types
 *
 * Type definitions for the caching layer.
 */

/**
 * Cache entry with metadata
 */
export interface CacheEntry<T> {
    /** Cached value */
    value: T;
    /** Creation timestamp */
    createdAt: number;
    /** Expiration timestamp */
    expiresAt: number;
    /** Whether the entry is compressed */
    compressed?: boolean;
    /** Cache version for invalidation */
    version?: number;
}

/**
 * Cache get options
 */
export interface CacheGetOptions {
    /** Skip cache and fetch fresh data */
    skipCache?: boolean;
    /** Allow returning stale data while revalidating */
    allowStale?: boolean;
}

/**
 * Cache set options
 */
export interface CacheSetOptions {
    /** TTL in seconds (overrides default) */
    ttl?: number;
    /** Conditional set - only if key doesn't exist */
    nx?: boolean;
    /** Conditional set - only if key exists */
    xx?: boolean;
    /** Tags for grouped invalidation */
    tags?: string[];
}

/**
 * Cache delete options
 */
export interface CacheDeleteOptions {
    /** Delete by pattern */
    pattern?: boolean;
}

/**
 * Cache statistics
 */
export interface CacheStats {
    /** Total cache hits */
    hits: number;
    /** Total cache misses */
    misses: number;
    /** Hit ratio (0-1) */
    hitRatio: number;
    /** Total keys in cache */
    keyCount: number;
    /** Memory usage in bytes */
    memoryUsage: number;
    /** Average response time in ms */
    avgResponseTime: number;
}

/**
 * Cache key builder options
 */
export interface CacheKeyOptions {
    /** Namespace for the key */
    namespace?: string;
    /** Version for cache busting */
    version?: number;
}

/**
 * Build a cache key with namespace and version
 */
export function buildCacheKey(
    base: string,
    params?: Record<string, unknown>,
    options?: CacheKeyOptions,
): string {
    const parts: string[] = [];

    if (options?.namespace) {
        parts.push(options.namespace);
    }

    parts.push(base);

    if (params && Object.keys(params).length > 0) {
        // Sort keys for consistent key generation
        const sortedParams = Object.keys(params)
            .sort()
            .map((key) => `${key}:${JSON.stringify(params[key])}`)
            .join(':');
        parts.push(sortedParams);
    }

    if (options?.version !== undefined) {
        parts.push(`v${options.version}`);
    }

    return parts.join(':');
}

/**
 * Cache event types
 */
export type CacheEventType = 'hit' | 'miss' | 'set' | 'delete' | 'expire' | 'error';

/**
 * Cache event
 */
export interface CacheEvent {
    type: CacheEventType;
    key: string;
    timestamp: number;
    duration?: number;
    error?: Error;
}

/**
 * Cache event handler
 */
export type CacheEventHandler = (event: CacheEvent) => void;
