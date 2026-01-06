/**
 * Cache Service
 *
 * High-level cache abstraction with TTL management, serialization,
 * and support for various caching patterns.
 */

import type { RedisClient } from './redis/redis.client';
import { createRedisClientFromEnv } from './redis/redis.client';
import type { CacheConfig } from './cache.config';
import { DEFAULT_CACHE_CONFIG } from './cache.config';
import type {
    CacheEntry,
    CacheGetOptions,
    CacheSetOptions,
    CacheDeleteOptions,
    CacheStats,
    CacheEvent,
    CacheEventHandler,
} from './cache.types';

/**
 * Cache service implementation
 */
export class CacheService {
    private readonly client: RedisClient;
    private readonly config: CacheConfig;
    private readonly eventHandlers: CacheEventHandler[] = [];
    private stats = {
        hits: 0,
        misses: 0,
        totalResponseTime: 0,
        requestCount: 0,
    };

    constructor(client?: RedisClient, config?: Partial<CacheConfig>) {
        this.client = client || createRedisClientFromEnv();
        this.config = { ...DEFAULT_CACHE_CONFIG, ...config };
    }

    /**
     * Get a value from cache
     */
    async get<T>(key: string, options?: CacheGetOptions): Promise<T | null> {
        const startTime = Date.now();

        if (options?.skipCache) {
            this.emitEvent({ type: 'miss', key, timestamp: Date.now() });
            return null;
        }

        try {
            const data = await this.client.native.get(key);

            if (!data) {
                this.stats.misses++;
                this.emitEvent({ type: 'miss', key, timestamp: Date.now(), duration: Date.now() - startTime });
                return null;
            }

            const entry = JSON.parse(data) as CacheEntry<T>;
            const now = Date.now();

            // Check if expired
            if (entry.expiresAt < now) {
                if (options?.allowStale && this.config.staleWhileRevalidate) {
                    const staleDeadline = entry.expiresAt + (this.config.staleWhileRevalidate * 1000);
                    if (now < staleDeadline) {
                        // Return stale data
                        this.stats.hits++;
                        this.emitEvent({ type: 'hit', key, timestamp: Date.now(), duration: Date.now() - startTime });
                        return entry.value;
                    }
                }
                // Data is too old
                await this.delete(key);
                this.stats.misses++;
                this.emitEvent({ type: 'expire', key, timestamp: Date.now() });
                return null;
            }

            this.stats.hits++;
            this.updateResponseTime(startTime);
            this.emitEvent({ type: 'hit', key, timestamp: Date.now(), duration: Date.now() - startTime });
            return entry.value;
        } catch (error) {
            this.emitEvent({ type: 'error', key, timestamp: Date.now(), error: error as Error });
            console.error('[Cache] Get error:', error);
            return null;
        }
    }

    /**
     * Set a value in cache
     */
    async set<T>(key: string, value: T, options?: CacheSetOptions): Promise<boolean> {
        const startTime = Date.now();
        const ttl = options?.ttl ?? this.config.defaultTtl;

        try {
            const entry: CacheEntry<T> = {
                value,
                createdAt: Date.now(),
                expiresAt: Date.now() + (ttl * 1000),
            };

            const serialized = JSON.stringify(entry);
            const args: (string | number)[] = ['EX', ttl];

            if (options?.nx) {
                args.push('NX');
            } else if (options?.xx) {
                args.push('XX');
            }

            const result = await this.client.native.set(key, serialized, ...args as [string, number]);

            this.updateResponseTime(startTime);
            this.emitEvent({ type: 'set', key, timestamp: Date.now(), duration: Date.now() - startTime });

            // Handle tags for grouped invalidation
            if (options?.tags && options.tags.length > 0) {
                await this.addToTags(key, options.tags);
            }

            return result === 'OK';
        } catch (error) {
            this.emitEvent({ type: 'error', key, timestamp: Date.now(), error: error as Error });
            console.error('[Cache] Set error:', error);
            return false;
        }
    }

    /**
     * Delete a key from cache
     */
    async delete(key: string, options?: CacheDeleteOptions): Promise<boolean> {
        try {
            if (options?.pattern) {
                return this.deleteByPattern(key);
            }

            const result = await this.client.native.del(key);
            this.emitEvent({ type: 'delete', key, timestamp: Date.now() });
            return result > 0;
        } catch (error) {
            this.emitEvent({ type: 'error', key, timestamp: Date.now(), error: error as Error });
            console.error('[Cache] Delete error:', error);
            return false;
        }
    }

    /**
     * Delete keys by pattern
     */
    private async deleteByPattern(pattern: string): Promise<boolean> {
        try {
            const keys = await this.client.native.keys(pattern);
            if (keys.length === 0) {
                return true;
            }

            // Remove key prefix if present (ioredis adds it automatically on get/set but not on keys)
            const keyPrefix = this.config.redis.keyPrefix || '';
            const keysWithoutPrefix = keys.map(k => k.replace(keyPrefix, ''));

            const result = await this.client.native.del(...keysWithoutPrefix);
            return result > 0;
        } catch (error) {
            console.error('[Cache] Delete by pattern error:', error);
            return false;
        }
    }

    /**
     * Check if key exists
     */
    async exists(key: string): Promise<boolean> {
        try {
            const result = await this.client.native.exists(key);
            return result === 1;
        } catch (error) {
            console.error('[Cache] Exists error:', error);
            return false;
        }
    }

    /**
     * Get TTL of a key in seconds
     */
    async ttl(key: string): Promise<number> {
        try {
            return await this.client.native.ttl(key);
        } catch (error) {
            console.error('[Cache] TTL error:', error);
            return -1;
        }
    }

    /**
     * Extend TTL of a key
     */
    async expire(key: string, ttl: number): Promise<boolean> {
        try {
            const result = await this.client.native.expire(key, ttl);
            return result === 1;
        } catch (error) {
            console.error('[Cache] Expire error:', error);
            return false;
        }
    }

    /**
     * Increment a numeric value
     */
    async increment(key: string, by: number = 1): Promise<number> {
        try {
            if (by === 1) {
                return await this.client.native.incr(key);
            }
            return await this.client.native.incrby(key, by);
        } catch (error) {
            console.error('[Cache] Increment error:', error);
            return 0;
        }
    }

    /**
     * Decrement a numeric value
     */
    async decrement(key: string, by: number = 1): Promise<number> {
        try {
            if (by === 1) {
                return await this.client.native.decr(key);
            }
            return await this.client.native.decrby(key, by);
        } catch (error) {
            console.error('[Cache] Decrement error:', error);
            return 0;
        }
    }

    /**
     * Get multiple keys at once
     */
    async mget<T>(keys: string[]): Promise<(T | null)[]> {
        try {
            const results = await this.client.native.mget(...keys);
            return results.map(data => {
                if (!data) return null;
                try {
                    const entry = JSON.parse(data) as CacheEntry<T>;
                    if (entry.expiresAt < Date.now()) return null;
                    return entry.value;
                } catch {
                    return null;
                }
            });
        } catch (error) {
            console.error('[Cache] MGet error:', error);
            return keys.map(() => null);
        }
    }

    /**
     * Set multiple keys at once
     */
    async mset<T>(entries: Array<{ key: string; value: T; ttl?: number }>): Promise<boolean> {
        try {
            const pipeline = this.client.native.pipeline();
            const now = Date.now();

            for (const { key, value, ttl } of entries) {
                const actualTtl = ttl ?? this.config.defaultTtl;
                const entry: CacheEntry<T> = {
                    value,
                    createdAt: now,
                    expiresAt: now + (actualTtl * 1000),
                };
                pipeline.setex(key, actualTtl, JSON.stringify(entry));
            }

            await pipeline.exec();
            return true;
        } catch (error) {
            console.error('[Cache] MSet error:', error);
            return false;
        }
    }

    /**
     * Add key to tags for grouped invalidation
     */
    private async addToTags(key: string, tags: string[]): Promise<void> {
        const pipeline = this.client.native.pipeline();
        for (const tag of tags) {
            pipeline.sadd(`tag:${tag}`, key);
        }
        await pipeline.exec();
    }

    /**
     * Invalidate all keys with a specific tag
     */
    async invalidateByTag(tag: string): Promise<boolean> {
        try {
            const tagKey = `tag:${tag}`;
            const keys = await this.client.native.smembers(tagKey);

            if (keys.length === 0) {
                return true;
            }

            const pipeline = this.client.native.pipeline();
            for (const key of keys) {
                pipeline.del(key);
            }
            pipeline.del(tagKey);
            await pipeline.exec();

            return true;
        } catch (error) {
            console.error('[Cache] Invalidate by tag error:', error);
            return false;
        }
    }

    /**
     * Get or set pattern - retrieve from cache or compute and cache
     */
    async getOrSet<T>(
        key: string,
        factory: () => Promise<T>,
        options?: CacheSetOptions,
    ): Promise<T> {
        const cached = await this.get<T>(key);
        if (cached !== null) {
            return cached;
        }

        const value = await factory();
        await this.set(key, value, options);
        return value;
    }

    /**
     * Get cache statistics
     */
    async getStats(): Promise<CacheStats> {
        const keyCount = await this.client.dbSize();
        const info = await this.client.info('memory');
        const memoryMatch = info.match(/used_memory:(\d+)/);
        const memoryUsage = memoryMatch ? parseInt(memoryMatch[1], 10) : 0;

        return {
            hits: this.stats.hits,
            misses: this.stats.misses,
            hitRatio: this.stats.hits + this.stats.misses > 0
                ? this.stats.hits / (this.stats.hits + this.stats.misses)
                : 0,
            keyCount,
            memoryUsage,
            avgResponseTime: this.stats.requestCount > 0
                ? this.stats.totalResponseTime / this.stats.requestCount
                : 0,
        };
    }

    /**
     * Reset statistics
     */
    resetStats(): void {
        this.stats = {
            hits: 0,
            misses: 0,
            totalResponseTime: 0,
            requestCount: 0,
        };
    }

    /**
     * Add event handler
     */
    onEvent(handler: CacheEventHandler): void {
        this.eventHandlers.push(handler);
    }

    /**
     * Remove event handler
     */
    offEvent(handler: CacheEventHandler): void {
        const index = this.eventHandlers.indexOf(handler);
        if (index !== -1) {
            this.eventHandlers.splice(index, 1);
        }
    }

    /**
     * Emit cache event
     */
    private emitEvent(event: CacheEvent): void {
        if (!this.config.enableMetrics) return;
        for (const handler of this.eventHandlers) {
            try {
                handler(event);
            } catch (error) {
                console.error('[Cache] Event handler error:', error);
            }
        }
    }

    /**
     * Update response time statistics
     */
    private updateResponseTime(startTime: number): void {
        this.stats.totalResponseTime += Date.now() - startTime;
        this.stats.requestCount++;
    }

    /**
     * Connect to Redis
     */
    async connect(): Promise<void> {
        await this.client.connect();
    }

    /**
     * Disconnect from Redis
     */
    async disconnect(): Promise<void> {
        await this.client.disconnect();
    }

    /**
     * Health check
     */
    async isHealthy(): Promise<boolean> {
        return this.client.ping();
    }
}

/**
 * Create a cache service instance
 */
export function createCacheService(
    client?: RedisClient,
    config?: Partial<CacheConfig>,
): CacheService {
    return new CacheService(client, config);
}
