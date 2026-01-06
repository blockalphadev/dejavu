/**
 * Cache Decorators
 *
 * Method decorators for automatic caching behavior.
 */

import type { CacheService } from '../cache.service';
import type { CacheSetOptions } from '../cache.types';
import { buildCacheKey } from '../cache.types';

// Symbol for storing cache service instance
const CACHE_SERVICE_KEY = Symbol('cacheService');

/**
 * Decorator metadata storage
 */
interface CacheableMetadata {
    keyPrefix: string;
    ttl?: number;
    tags?: string[];
    keyGenerator?: (...args: unknown[]) => string;
}

/**
 * Set cache service for decorators
 */
export function setCacheService(target: object, service: CacheService): void {
    (target as Record<symbol, CacheService>)[CACHE_SERVICE_KEY] = service;
}

/**
 * Get cache service from instance
 */
function getCacheService(target: object): CacheService | undefined {
    return (target as Record<symbol, CacheService>)[CACHE_SERVICE_KEY];
}

/**
 * @Cacheable decorator
 *
 * Automatically cache the result of a method.
 *
 * @example
 * ```typescript
 * class MarketRepository {
 *   @Cacheable({ keyPrefix: 'market', ttl: 300 })
 *   async getById(id: string): Promise<Market> {
 *     return this.db.findById(id);
 *   }
 * }
 * ```
 */
export function Cacheable(options: CacheableMetadata) {
    return function (
        target: object,
        propertyKey: string,
        descriptor: PropertyDescriptor,
    ) {
        const originalMethod = descriptor.value;

        descriptor.value = async function (...args: unknown[]) {
            const cacheService = getCacheService(this);

            if (!cacheService) {
                // No cache service, execute original method
                return originalMethod.apply(this, args);
            }

            // Generate cache key
            const cacheKey = options.keyGenerator
                ? options.keyGenerator(...args)
                : buildCacheKey(options.keyPrefix, {
                    method: propertyKey,
                    args: JSON.stringify(args),
                });

            // Try to get from cache
            const cached = await cacheService.get(cacheKey);
            if (cached !== null) {
                return cached;
            }

            // Execute original method
            const result = await originalMethod.apply(this, args);

            // Cache the result
            if (result !== undefined && result !== null) {
                const setOptions: CacheSetOptions = {};
                if (options.ttl) setOptions.ttl = options.ttl;
                if (options.tags) setOptions.tags = options.tags;
                await cacheService.set(cacheKey, result, setOptions);
            }

            return result;
        };

        return descriptor;
    };
}

/**
 * Cache invalidation metadata
 */
interface CacheInvalidateMetadata {
    keyPrefix?: string;
    tags?: string[];
    pattern?: string;
    keyGenerator?: (...args: unknown[]) => string | string[];
}

/**
 * @CacheInvalidate decorator
 *
 * Invalidate cache entries when a method is called.
 *
 * @example
 * ```typescript
 * class MarketRepository {
 *   @CacheInvalidate({ keyPrefix: 'market', keyGenerator: (id) => `market:${id}` })
 *   async update(id: string, data: UpdateMarketDto): Promise<Market> {
 *     return this.db.update(id, data);
 *   }
 * }
 * ```
 */
export function CacheInvalidate(options: CacheInvalidateMetadata) {
    return function (
        target: object,
        propertyKey: string,
        descriptor: PropertyDescriptor,
    ) {
        const originalMethod = descriptor.value;

        descriptor.value = async function (...args: unknown[]) {
            // Execute original method first
            const result = await originalMethod.apply(this, args);

            const cacheService = getCacheService(this);
            if (!cacheService) {
                return result;
            }

            // Invalidate by tags
            if (options.tags) {
                for (const tag of options.tags) {
                    await cacheService.invalidateByTag(tag);
                }
            }

            // Invalidate by pattern
            if (options.pattern) {
                await cacheService.delete(options.pattern, { pattern: true });
            }

            // Invalidate by generated keys
            if (options.keyGenerator) {
                const keys = options.keyGenerator(...args);
                const keyArray = Array.isArray(keys) ? keys : [keys];
                for (const key of keyArray) {
                    await cacheService.delete(key);
                }
            }

            return result;
        };

        return descriptor;
    };
}

/**
 * @CachePut decorator
 *
 * Always execute the method and update the cache with the result.
 *
 * @example
 * ```typescript
 * class MarketRepository {
 *   @CachePut({ keyPrefix: 'market', keyGenerator: (_, market) => `market:${market.id}` })
 *   async save(market: Market): Promise<Market> {
 *     return this.db.save(market);
 *   }
 * }
 * ```
 */
export function CachePut(options: CacheableMetadata) {
    return function (
        target: object,
        propertyKey: string,
        descriptor: PropertyDescriptor,
    ) {
        const originalMethod = descriptor.value;

        descriptor.value = async function (...args: unknown[]) {
            // Execute original method
            const result = await originalMethod.apply(this, args);

            const cacheService = getCacheService(this);
            if (!cacheService) {
                return result;
            }

            // Generate cache key
            const cacheKey = options.keyGenerator
                ? options.keyGenerator(...args)
                : buildCacheKey(options.keyPrefix, {
                    method: propertyKey,
                    result: result && typeof result === 'object' && 'id' in result
                        ? (result as { id: unknown }).id
                        : undefined,
                });

            // Update cache
            if (result !== undefined && result !== null) {
                const setOptions: CacheSetOptions = {};
                if (options.ttl) setOptions.ttl = options.ttl;
                if (options.tags) setOptions.tags = options.tags;
                await cacheService.set(cacheKey, result, setOptions);
            }

            return result;
        };

        return descriptor;
    };
}
