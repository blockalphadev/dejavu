/**
 * Distributed Lock Service
 *
 * Redis-based distributed locking for preventing race conditions
 * in distributed systems.
 */

import type { RedisClient } from './redis/redis.client';
import { createRedisClientFromEnv } from './redis/redis.client';

/**
 * Lock options
 */
export interface LockOptions {
    /** Lock TTL in milliseconds */
    ttl?: number;
    /** Retry attempts to acquire lock */
    retryCount?: number;
    /** Delay between retries in milliseconds */
    retryDelay?: number;
    /** Unique lock identifier for this process */
    lockId?: string;
}

/**
 * Lock result
 */
export interface LockResult {
    /** Whether lock was acquired */
    acquired: boolean;
    /** Lock identifier (for releasing) */
    lockId: string;
    /** When the lock expires */
    expiresAt: number;
}

/**
 * Default lock options
 */
const DEFAULT_LOCK_OPTIONS: Required<LockOptions> = {
    ttl: 30000, // 30 seconds
    retryCount: 3,
    retryDelay: 100,
    lockId: '',
};

/**
 * Distributed Lock Service using Redis
 */
export class DistributedLockService {
    private readonly client: RedisClient;
    private readonly keyPrefix: string = 'lock:';

    constructor(client?: RedisClient) {
        this.client = client || createRedisClientFromEnv();
    }

    /**
     * Generate a unique lock ID
     */
    private generateLockId(): string {
        return `${process.pid}-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    }

    /**
     * Acquire a distributed lock
     */
    async acquire(key: string, options?: LockOptions): Promise<LockResult> {
        const opts = { ...DEFAULT_LOCK_OPTIONS, ...options };
        const lockKey = `${this.keyPrefix}${key}`;
        const lockId = opts.lockId || this.generateLockId();
        const expiresAt = Date.now() + opts.ttl;

        for (let attempt = 0; attempt <= opts.retryCount; attempt++) {
            try {
                // Try to set the lock with NX (only if not exists)
                const result = await this.client.native.set(
                    lockKey,
                    lockId,
                    'PX',
                    opts.ttl,
                    'NX',
                );

                if (result === 'OK') {
                    return {
                        acquired: true,
                        lockId,
                        expiresAt,
                    };
                }

                // Lock is held by someone else, retry after delay
                if (attempt < opts.retryCount) {
                    await this.sleep(opts.retryDelay);
                }
            } catch (error) {
                console.error('[Lock] Error acquiring lock:', error);
                if (attempt < opts.retryCount) {
                    await this.sleep(opts.retryDelay);
                }
            }
        }

        return {
            acquired: false,
            lockId,
            expiresAt: 0,
        };
    }

    /**
     * Release a distributed lock
     *
     * Uses Lua script to ensure atomic check-and-delete
     */
    async release(key: string, lockId: string): Promise<boolean> {
        const lockKey = `${this.keyPrefix}${key}`;

        // Lua script for atomic release
        // Only delete if the lock is held by this lockId
        const script = `
            if redis.call('get', KEYS[1]) == ARGV[1] then
                return redis.call('del', KEYS[1])
            else
                return 0
            end
        `;

        try {
            const result = await this.client.native.eval(script, 1, lockKey, lockId) as number;
            return result === 1;
        } catch (error) {
            console.error('[Lock] Error releasing lock:', error);
            return false;
        }
    }

    /**
     * Extend a lock's TTL
     */
    async extend(key: string, lockId: string, ttl: number): Promise<boolean> {
        const lockKey = `${this.keyPrefix}${key}`;

        // Lua script for atomic extend
        // Only extend if the lock is held by this lockId
        const script = `
            if redis.call('get', KEYS[1]) == ARGV[1] then
                return redis.call('pexpire', KEYS[1], ARGV[2])
            else
                return 0
            end
        `;

        try {
            const result = await this.client.native.eval(script, 1, lockKey, lockId, ttl) as number;
            return result === 1;
        } catch (error) {
            console.error('[Lock] Error extending lock:', error);
            return false;
        }
    }

    /**
     * Check if a lock is held
     */
    async isLocked(key: string): Promise<boolean> {
        const lockKey = `${this.keyPrefix}${key}`;
        try {
            const result = await this.client.native.exists(lockKey);
            return result === 1;
        } catch (error) {
            console.error('[Lock] Error checking lock:', error);
            return false;
        }
    }

    /**
     * Get lock info
     */
    async getLockInfo(key: string): Promise<{ lockId: string | null; ttl: number }> {
        const lockKey = `${this.keyPrefix}${key}`;
        try {
            const [lockId, ttl] = await Promise.all([
                this.client.native.get(lockKey),
                this.client.native.pttl(lockKey),
            ]);
            return { lockId, ttl };
        } catch (error) {
            console.error('[Lock] Error getting lock info:', error);
            return { lockId: null, ttl: -1 };
        }
    }

    /**
     * Execute a function with a lock
     *
     * Automatically acquires and releases the lock
     */
    async withLock<T>(
        key: string,
        fn: () => Promise<T>,
        options?: LockOptions,
    ): Promise<T> {
        const lock = await this.acquire(key, options);

        if (!lock.acquired) {
            throw new Error(`Failed to acquire lock for key: ${key}`);
        }

        try {
            return await fn();
        } finally {
            await this.release(key, lock.lockId);
        }
    }

    /**
     * Sleep utility
     */
    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}

/**
 * Create a distributed lock service instance
 */
export function createDistributedLockService(client?: RedisClient): DistributedLockService {
    return new DistributedLockService(client);
}
