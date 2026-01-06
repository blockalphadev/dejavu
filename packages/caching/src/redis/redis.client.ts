/**
 * Redis Client Factory
 *
 * Creates and manages Redis client connections with retry logic,
 * connection pooling, and health checks.
 */

import Redis from 'ioredis';
import type { RedisConfig } from '../cache.config';
import { DEFAULT_REDIS_CONFIG } from '../cache.config';

/**
 * Redis client wrapper with enhanced functionality
 */
export class RedisClient {
    private client: Redis;
    private readonly config: RedisConfig;
    private isConnected: boolean = false;
    private reconnectAttempts: number = 0;
    private readonly maxReconnectAttempts: number = 10;

    constructor(config: Partial<RedisConfig> = {}) {
        this.config = { ...DEFAULT_REDIS_CONFIG, ...config };
        this.client = this.createClient();
        this.setupEventHandlers();
    }

    /**
     * Create Redis client instance
     */
    private createClient(): Redis {
        const options: Redis.RedisOptions = {
            host: this.config.host,
            port: this.config.port,
            password: this.config.password,
            db: this.config.db,
            keyPrefix: this.config.keyPrefix,
            connectTimeout: this.config.connectTimeout,
            commandTimeout: this.config.commandTimeout,
            maxRetriesPerRequest: this.config.maxRetriesPerRequest,
            retryStrategy: (times: number) => {
                if (times > this.maxReconnectAttempts) {
                    console.error('[Redis] Max reconnection attempts reached');
                    return null; // Stop retrying
                }
                const delay = Math.min(times * 100, 3000);
                console.log(`[Redis] Reconnecting in ${delay}ms (attempt ${times})`);
                return delay;
            },
            lazyConnect: true,
            enableReadyCheck: true,
            showFriendlyErrorStack: process.env.NODE_ENV !== 'production',
        };

        if (this.config.tls) {
            options.tls = {};
        }

        if (this.config.connectionName) {
            options.connectionName = this.config.connectionName;
        }

        return new Redis(options);
    }

    /**
     * Setup event handlers for connection lifecycle
     */
    private setupEventHandlers(): void {
        this.client.on('connect', () => {
            console.log('[Redis] Connecting...');
        });

        this.client.on('ready', () => {
            this.isConnected = true;
            this.reconnectAttempts = 0;
            console.log('[Redis] Connected and ready');
        });

        this.client.on('error', (error: Error) => {
            console.error('[Redis] Error:', error.message);
        });

        this.client.on('close', () => {
            this.isConnected = false;
            console.log('[Redis] Connection closed');
        });

        this.client.on('reconnecting', () => {
            this.reconnectAttempts++;
            console.log(`[Redis] Reconnecting (attempt ${this.reconnectAttempts})`);
        });

        this.client.on('end', () => {
            this.isConnected = false;
            console.log('[Redis] Connection ended');
        });
    }

    /**
     * Connect to Redis
     */
    async connect(): Promise<void> {
        if (this.isConnected) {
            return;
        }

        try {
            await this.client.connect();
        } catch (error) {
            console.error('[Redis] Failed to connect:', error);
            throw error;
        }
    }

    /**
     * Disconnect from Redis
     */
    async disconnect(): Promise<void> {
        if (!this.isConnected) {
            return;
        }

        try {
            await this.client.quit();
        } catch (error) {
            console.error('[Redis] Error during disconnect:', error);
            // Force disconnect
            this.client.disconnect();
        }
    }

    /**
     * Check if connected
     */
    get connected(): boolean {
        return this.isConnected && this.client.status === 'ready';
    }

    /**
     * Get the underlying Redis client
     */
    get native(): Redis {
        return this.client;
    }

    /**
     * Health check - ping Redis
     */
    async ping(): Promise<boolean> {
        try {
            const result = await this.client.ping();
            return result === 'PONG';
        } catch {
            return false;
        }
    }

    /**
     * Get Redis info
     */
    async info(section?: string): Promise<string> {
        if (section) {
            return this.client.info(section);
        }
        return this.client.info();
    }

    /**
     * Get current database size
     */
    async dbSize(): Promise<number> {
        return this.client.dbsize();
    }

    /**
     * Flush current database (use with caution)
     */
    async flushDb(): Promise<void> {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('flushDb is not allowed in production');
        }
        await this.client.flushdb();
    }
}

/**
 * Create a Redis client instance
 */
export function createRedisClient(config?: Partial<RedisConfig>): RedisClient {
    return new RedisClient(config);
}

/**
 * Create Redis client from environment variables
 */
export function createRedisClientFromEnv(): RedisClient {
    return new RedisClient({
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : undefined,
        password: process.env.REDIS_PASSWORD,
        db: process.env.REDIS_DB ? parseInt(process.env.REDIS_DB, 10) : undefined,
        keyPrefix: process.env.REDIS_KEY_PREFIX,
        tls: process.env.REDIS_TLS === 'true',
    });
}

// Singleton instance
let defaultClient: RedisClient | null = null;

/**
 * Get or create the default Redis client
 */
export function getDefaultRedisClient(): RedisClient {
    if (!defaultClient) {
        defaultClient = createRedisClientFromEnv();
    }
    return defaultClient;
}

/**
 * Close the default Redis client
 */
export async function closeDefaultRedisClient(): Promise<void> {
    if (defaultClient) {
        await defaultClient.disconnect();
        defaultClient = null;
    }
}
