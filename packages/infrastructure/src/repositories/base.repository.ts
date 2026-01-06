/**
 * Base Repository Implementation
 *
 * Abstract base class for all repository implementations
 * with common CRUD operations and caching support.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { CacheService } from '@dejavu/caching';
import type { IEventBus } from '@dejavu/events';

/**
 * Repository options
 */
export interface RepositoryOptions {
    /** Supabase client */
    client: SupabaseClient;
    /** Optional cache service */
    cache?: CacheService;
    /** Optional event bus for domain events */
    eventBus?: IEventBus;
    /** Table name in database */
    tableName: string;
    /** Cache key prefix */
    cacheKeyPrefix?: string;
    /** Default cache TTL in seconds */
    cacheTtl?: number;
}

/**
 * Abstract base repository
 */
export abstract class BaseRepository<TEntity, TId = string> {
    protected readonly client: SupabaseClient;
    protected readonly cache?: CacheService;
    protected readonly eventBus?: IEventBus;
    protected readonly tableName: string;
    protected readonly cacheKeyPrefix: string;
    protected readonly cacheTtl: number;

    constructor(options: RepositoryOptions) {
        this.client = options.client;
        this.cache = options.cache;
        this.eventBus = options.eventBus;
        this.tableName = options.tableName;
        this.cacheKeyPrefix = options.cacheKeyPrefix || options.tableName;
        this.cacheTtl = options.cacheTtl || 3600;
    }

    /**
     * Generate cache key for an entity
     */
    protected getCacheKey(id: TId): string {
        return `${this.cacheKeyPrefix}:${String(id)}`;
    }

    /**
     * Find entity by ID
     */
    async findById(id: TId): Promise<TEntity | null> {
        // Try cache first
        if (this.cache) {
            const cached = await this.cache.get<TEntity>(this.getCacheKey(id));
            if (cached) {
                return cached;
            }
        }

        // Query database
        const { data, error } = await this.client
            .from(this.tableName)
            .select('*')
            .eq('id', id as unknown as string)
            .single();

        if (error || !data) {
            return null;
        }

        const entity = this.mapToEntity(data);

        // Cache the result
        if (this.cache && entity) {
            await this.cache.set(this.getCacheKey(id), entity, { ttl: this.cacheTtl });
        }

        return entity;
    }

    /**
     * Find all entities
     */
    async findAll(): Promise<TEntity[]> {
        const { data, error } = await this.client
            .from(this.tableName)
            .select('*');

        if (error || !data) {
            return [];
        }

        return data.map((row) => this.mapToEntity(row));
    }

    /**
     * Save entity (insert or update)
     */
    async save(entity: TEntity): Promise<TEntity> {
        const row = this.mapToRow(entity);
        const id = this.getId(entity);

        const { data, error } = await this.client
            .from(this.tableName)
            .upsert(row)
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to save entity: ${error.message}`);
        }

        const savedEntity = this.mapToEntity(data);

        // Invalidate cache
        if (this.cache && id) {
            await this.cache.delete(this.getCacheKey(id));
        }

        return savedEntity;
    }

    /**
     * Delete entity by ID
     */
    async delete(id: TId): Promise<boolean> {
        const { error } = await this.client
            .from(this.tableName)
            .delete()
            .eq('id', id as unknown as string);

        if (error) {
            return false;
        }

        // Invalidate cache
        if (this.cache) {
            await this.cache.delete(this.getCacheKey(id));
        }

        return true;
    }

    /**
     * Check if entity exists
     */
    async exists(id: TId): Promise<boolean> {
        const { count = 0, error } = await this.client
            .from(this.tableName)
            .select('id', { count: 'exact', head: true })
            .eq('id', id as unknown as string);

        if (error) {
            return false;
        }

        return count ? count > 0 : false;
    }

    /**
     * Map database row to entity
     */
    protected abstract mapToEntity(row: Record<string, unknown>): TEntity;

    /**
     * Map entity to database row
     */
    protected abstract mapToRow(entity: TEntity): Record<string, unknown>;

    /**
     * Get entity ID
     */
    protected abstract getId(entity: TEntity): TId | undefined;
}
