/**
 * Cache Configuration
 *
 * Configuration types and defaults for the caching layer.
 */

/**
 * Redis connection configuration
 */
export interface RedisConfig {
    /** Redis host */
    host: string;
    /** Redis port */
    port: number;
    /** Redis password (optional) */
    password?: string;
    /** Redis database number */
    db?: number;
    /** Connection name for identification */
    connectionName?: string;
    /** Enable TLS */
    tls?: boolean;
    /** Key prefix for namespacing */
    keyPrefix?: string;
    /** Connection timeout in ms */
    connectTimeout?: number;
    /** Command timeout in ms */
    commandTimeout?: number;
    /** Max retries per request */
    maxRetriesPerRequest?: number;
    /** Enable read-only mode */
    readOnly?: boolean;
}

/**
 * Cache configuration options
 */
export interface CacheConfig {
    /** Redis configuration */
    redis: RedisConfig;
    /** Default TTL in seconds */
    defaultTtl: number;
    /** Enable cache compression for large values */
    enableCompression?: boolean;
    /** Compression threshold in bytes */
    compressionThreshold?: number;
    /** Enable cache metrics collection */
    enableMetrics?: boolean;
    /** Stale-while-revalidate window in seconds */
    staleWhileRevalidate?: number;
}

/**
 * Default Redis configuration
 */
export const DEFAULT_REDIS_CONFIG: RedisConfig = {
    host: 'localhost',
    port: 6379,
    db: 0,
    keyPrefix: 'dejavu:',
    connectTimeout: 10000,
    commandTimeout: 5000,
    maxRetriesPerRequest: 3,
};

/**
 * Default cache configuration
 */
export const DEFAULT_CACHE_CONFIG: CacheConfig = {
    redis: DEFAULT_REDIS_CONFIG,
    defaultTtl: 3600, // 1 hour
    enableCompression: true,
    compressionThreshold: 1024, // 1KB
    enableMetrics: true,
    staleWhileRevalidate: 60, // 1 minute
};

/**
 * Create cache configuration from environment variables
 */
export function createCacheConfigFromEnv(): CacheConfig {
    return {
        redis: {
            host: process.env.REDIS_HOST || DEFAULT_REDIS_CONFIG.host,
            port: parseInt(process.env.REDIS_PORT || String(DEFAULT_REDIS_CONFIG.port), 10),
            password: process.env.REDIS_PASSWORD || undefined,
            db: parseInt(process.env.REDIS_DB || String(DEFAULT_REDIS_CONFIG.db), 10),
            keyPrefix: process.env.REDIS_KEY_PREFIX || DEFAULT_REDIS_CONFIG.keyPrefix,
            tls: process.env.REDIS_TLS === 'true',
            connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT || '10000', 10),
            commandTimeout: parseInt(process.env.REDIS_COMMAND_TIMEOUT || '5000', 10),
        },
        defaultTtl: parseInt(process.env.CACHE_DEFAULT_TTL || '3600', 10),
        enableCompression: process.env.CACHE_COMPRESSION !== 'false',
        compressionThreshold: parseInt(process.env.CACHE_COMPRESSION_THRESHOLD || '1024', 10),
        enableMetrics: process.env.CACHE_METRICS !== 'false',
        staleWhileRevalidate: parseInt(process.env.CACHE_STALE_REVALIDATE || '60', 10),
    };
}
