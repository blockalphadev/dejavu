/**
 * Get Market Query
 */

import { Query } from '../../common/query.interface';
import type { MarketCategory, MarketStatus, MarketType } from '@dejavu/shared/types';

/**
 * Market view model
 */
export interface MarketViewModel {
    /** Market ID */
    id: string;
    /** Market title */
    title: string;
    /** URL slug */
    slug: string;
    /** Description */
    description: string;
    /** Category */
    category: MarketCategory;
    /** Type */
    type: MarketType;
    /** Current status */
    status: MarketStatus;
    /** Creator info */
    creator: {
        id: string;
        displayName: string;
        avatarUrl?: string;
    };
    /** Outcomes with current prices */
    outcomes: Array<{
        id: string;
        title: string;
        description?: string;
        currentPrice: string;
        volume: string;
    }>;
    /** Market end date */
    endDate: Date;
    /** Total volume traded */
    totalVolume: string;
    /** Total liquidity */
    liquidity: string;
    /** Number of unique traders */
    tradersCount: number;
    /** Market image URL */
    imageUrl?: string;
    /** Tags */
    tags: string[];
    /** When market was created */
    createdAt: Date;
    /** When market was last updated */
    updatedAt: Date;
}

/**
 * Get Market Query
 */
export class GetMarketQuery extends Query<MarketViewModel> {
    readonly queryType = 'market.get';

    constructor(
        public readonly marketId: string,
    ) {
        super();
    }
}

/**
 * Get Market by Slug Query
 */
export class GetMarketBySlugQuery extends Query<MarketViewModel> {
    readonly queryType = 'market.getBySlug';

    constructor(
        public readonly slug: string,
    ) {
        super();
    }
}
