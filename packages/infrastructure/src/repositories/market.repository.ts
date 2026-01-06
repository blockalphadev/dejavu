/**
 * Market Repository Implementation
 *
 * Repository for Market aggregate with caching support.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { CacheService } from '@dejavu/caching';
import type { IEventBus } from '@dejavu/events';
import type { IMarketRepository } from '@dejavu/domain';
import { BaseRepository, type RepositoryOptions } from './base.repository';

/**
 * Market database row type
 */
interface MarketRow {
    id: string;
    title: string;
    slug: string;
    description: string;
    category: string;
    type: string;
    status: string;
    creator_id: string;
    end_date: string;
    resolution_date?: string;
    resolution_source?: string;
    winning_outcome_id?: string;
    total_volume: string;
    liquidity: string;
    image_url?: string;
    tags: string[];
    created_at: string;
    updated_at: string;
}

/**
 * Market entity (simplified for infrastructure layer)
 */
interface Market {
    id: string;
    title: string;
    slug: string;
    description: string;
    category: string;
    type: string;
    status: string;
    creatorId: string;
    endDate: Date;
    resolutionDate?: Date;
    resolutionSource?: string;
    winningOutcomeId?: string;
    totalVolume: string;
    liquidity: string;
    imageUrl?: string;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Market repository options
 */
export interface MarketRepositoryOptions {
    client: SupabaseClient;
    cache?: CacheService;
    eventBus?: IEventBus;
}

/**
 * Market Repository Implementation
 */
export class MarketRepository extends BaseRepository<Market, string> {
    constructor(options: MarketRepositoryOptions) {
        super({
            ...options,
            tableName: 'markets',
            cacheKeyPrefix: 'market',
            cacheTtl: 300, // 5 minutes
        });
    }

    /**
     * Find market by slug
     */
    async findBySlug(slug: string): Promise<Market | null> {
        // Try cache first
        if (this.cache) {
            const cached = await this.cache.get<Market>(`market:slug:${slug}`);
            if (cached) {
                return cached;
            }
        }

        const { data, error } = await this.client
            .from(this.tableName)
            .select('*')
            .eq('slug', slug)
            .single();

        if (error || !data) {
            return null;
        }

        const entity = this.mapToEntity(data);

        // Cache by both ID and slug
        if (this.cache && entity) {
            await Promise.all([
                this.cache.set(this.getCacheKey(entity.id), entity, { ttl: this.cacheTtl }),
                this.cache.set(`market:slug:${slug}`, entity, { ttl: this.cacheTtl }),
            ]);
        }

        return entity;
    }

    /**
     * Find markets by category
     */
    async findByCategory(category: string, limit: number = 50): Promise<Market[]> {
        const { data, error } = await this.client
            .from(this.tableName)
            .select('*')
            .eq('category', category)
            .eq('status', 'active')
            .order('total_volume', { ascending: false })
            .limit(limit);

        if (error || !data) {
            return [];
        }

        return data.map((row) => this.mapToEntity(row));
    }

    /**
     * Find trending markets
     */
    async findTrending(limit: number = 10): Promise<Market[]> {
        const { data, error } = await this.client
            .from(this.tableName)
            .select('*')
            .eq('status', 'active')
            .order('total_volume', { ascending: false })
            .limit(limit);

        if (error || !data) {
            return [];
        }

        return data.map((row) => this.mapToEntity(row));
    }

    /**
     * Find markets by creator
     */
    async findByCreator(creatorId: string): Promise<Market[]> {
        const { data, error } = await this.client
            .from(this.tableName)
            .select('*')
            .eq('creator_id', creatorId)
            .order('created_at', { ascending: false });

        if (error || !data) {
            return [];
        }

        return data.map((row) => this.mapToEntity(row));
    }

    /**
     * Search markets
     */
    async search(query: string, limit: number = 20): Promise<Market[]> {
        const { data, error } = await this.client
            .from(this.tableName)
            .select('*')
            .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
            .eq('status', 'active')
            .limit(limit);

        if (error || !data) {
            return [];
        }

        return data.map((row) => this.mapToEntity(row));
    }

    /**
     * Map database row to entity
     */
    protected mapToEntity(row: Record<string, unknown>): Market {
        const r = row as MarketRow;
        return {
            id: r.id,
            title: r.title,
            slug: r.slug,
            description: r.description,
            category: r.category,
            type: r.type,
            status: r.status,
            creatorId: r.creator_id,
            endDate: new Date(r.end_date),
            resolutionDate: r.resolution_date ? new Date(r.resolution_date) : undefined,
            resolutionSource: r.resolution_source,
            winningOutcomeId: r.winning_outcome_id,
            totalVolume: r.total_volume,
            liquidity: r.liquidity,
            imageUrl: r.image_url,
            tags: r.tags || [],
            createdAt: new Date(r.created_at),
            updatedAt: new Date(r.updated_at),
        };
    }

    /**
     * Map entity to database row
     */
    protected mapToRow(entity: Market): Record<string, unknown> {
        return {
            id: entity.id,
            title: entity.title,
            slug: entity.slug,
            description: entity.description,
            category: entity.category,
            type: entity.type,
            status: entity.status,
            creator_id: entity.creatorId,
            end_date: entity.endDate.toISOString(),
            resolution_date: entity.resolutionDate?.toISOString(),
            resolution_source: entity.resolutionSource,
            winning_outcome_id: entity.winningOutcomeId,
            total_volume: entity.totalVolume,
            liquidity: entity.liquidity,
            image_url: entity.imageUrl,
            tags: entity.tags,
            updated_at: new Date().toISOString(),
        };
    }

    /**
     * Get entity ID
     */
    protected getId(entity: Market): string | undefined {
        return entity.id;
    }
}

/**
 * Create a market repository
 */
export function createMarketRepository(options: MarketRepositoryOptions): MarketRepository {
    return new MarketRepository(options);
}
