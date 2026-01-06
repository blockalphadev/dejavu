/**
 * Market Repository Interface
 */

import type { Result } from '@dejavu/shared/utils';
import type { IRepository } from '../../common/repository.interface';
import type { MarketAggregate } from '../aggregates/market.aggregate';
import type { MarketCategory, MarketStatus, ChainId } from '@dejavu/shared/types';

/**
 * Market query filters
 */
export interface MarketQueryFilters {
    status?: MarketStatus | MarketStatus[];
    category?: MarketCategory | MarketCategory[];
    chainId?: ChainId | ChainId[];
    creatorId?: string;
    featured?: boolean;
    tags?: string[];
    search?: string;
    startDateFrom?: Date;
    startDateTo?: Date;
    endDateFrom?: Date;
    endDateTo?: Date;
}

/**
 * Market sort options
 */
export interface MarketSortOptions {
    field: 'createdAt' | 'endDate' | 'volume' | 'liquidity' | 'title';
    order: 'asc' | 'desc';
}

/**
 * Market pagination options
 */
export interface MarketPaginationOptions {
    page: number;
    pageSize: number;
    sort?: MarketSortOptions;
}

/**
 * Paginated market result
 */
export interface PaginatedMarkets {
    markets: MarketAggregate[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

/**
 * Market Repository Interface
 */
export interface IMarketRepository extends IRepository<MarketAggregate> {
    /**
     * Find market by slug
     */
    findBySlug(slug: string): Promise<Result<MarketAggregate | null>>;

    /**
     * Find markets with filters and pagination
     */
    findMany(
        filters?: MarketQueryFilters,
        pagination?: MarketPaginationOptions,
    ): Promise<Result<PaginatedMarkets>>;

    /**
     * Find active markets
     */
    findActive(pagination?: MarketPaginationOptions): Promise<Result<PaginatedMarkets>>;

    /**
     * Find markets by creator
     */
    findByCreator(
        creatorId: string,
        pagination?: MarketPaginationOptions,
    ): Promise<Result<PaginatedMarkets>>;

    /**
     * Find featured markets
     */
    findFeatured(limit?: number): Promise<Result<MarketAggregate[]>>;

    /**
     * Find markets ending soon
     */
    findEndingSoon(limit?: number): Promise<Result<MarketAggregate[]>>;

    /**
     * Count by status
     */
    countByStatus(status: MarketStatus): Promise<Result<number>>;
}
