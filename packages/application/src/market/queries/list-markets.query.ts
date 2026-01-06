/**
 * List Markets Query
 */

import { Query, type PaginatedQueryOptions, type PaginatedResult } from '../../common/query.interface';
import type { MarketCategory, MarketStatus } from '@dejavu/shared/types';
import type { MarketViewModel } from './get-market.query';

/**
 * Market list item (lighter than full view model)
 */
export interface MarketListItem {
    /** Market ID */
    id: string;
    /** Market title */
    title: string;
    /** URL slug */
    slug: string;
    /** Category */
    category: MarketCategory;
    /** Current status */
    status: MarketStatus;
    /** End date */
    endDate: Date;
    /** Total volume */
    totalVolume: string;
    /** Liquidity */
    liquidity: string;
    /** Featured outcome prices */
    featuredPrices: Array<{
        outcomeTitle: string;
        price: string;
    }>;
    /** Market image URL */
    imageUrl?: string;
    /** Created at */
    createdAt: Date;
}

/**
 * List Markets Filter
 */
export interface ListMarketsFilter {
    /** Filter by category */
    category?: MarketCategory;
    /** Filter by status */
    status?: MarketStatus;
    /** Filter by creator */
    creatorId?: string;
    /** Search query */
    search?: string;
    /** Filter by tags */
    tags?: string[];
    /** Ending before date */
    endingBefore?: Date;
    /** Ending after date */
    endingAfter?: Date;
    /** Minimum volume */
    minVolume?: string;
    /** Featured markets only */
    featured?: boolean;
}

/**
 * List Markets Query Options
 */
export interface ListMarketsOptions extends PaginatedQueryOptions {
    filter?: ListMarketsFilter;
}

/**
 * List Markets Query
 */
export class ListMarketsQuery extends Query<PaginatedResult<MarketListItem>> {
    readonly queryType = 'market.list';

    constructor(
        public readonly options: ListMarketsOptions = {},
    ) {
        super();
    }
}

/**
 * Get Trending Markets Query
 */
export class GetTrendingMarketsQuery extends Query<MarketListItem[]> {
    readonly queryType = 'market.trending';

    constructor(
        public readonly limit: number = 10,
    ) {
        super();
    }
}

/**
 * Get User Markets Query
 */
export class GetUserMarketsQuery extends Query<PaginatedResult<MarketListItem>> {
    readonly queryType = 'market.userMarkets';

    constructor(
        public readonly userId: string,
        public readonly options: PaginatedQueryOptions = {},
    ) {
        super();
    }
}
