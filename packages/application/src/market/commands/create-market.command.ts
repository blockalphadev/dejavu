/**
 * Create Market Command
 */

import { Command } from '../../common/command.interface';
import type { MarketCategory, MarketType } from '@dejavu/shared/types';

/**
 * DTO for creating a market
 */
export interface CreateMarketDto {
    /** Market title */
    title: string;
    /** Market description */
    description: string;
    /** Market category */
    category: MarketCategory;
    /** Market type */
    type: MarketType;
    /** Possible outcomes */
    outcomes: Array<{
        title: string;
        description?: string;
    }>;
    /** Market end date */
    endDate: Date;
    /** Resolution date */
    resolutionDate?: Date;
    /** Initial liquidity amount */
    initialLiquidity?: string;
    /** Tags for discovery */
    tags?: string[];
    /** Market image URL */
    imageUrl?: string;
}

/**
 * Create Market Command
 */
export class CreateMarketCommand extends Command {
    readonly commandType = 'market.create';

    constructor(
        public readonly data: CreateMarketDto,
        options?: { correlationId?: string; userId?: string },
    ) {
        super(options);
    }
}

/**
 * Create Market Command Result
 */
export interface CreateMarketResult {
    /** Created market ID */
    marketId: string;
    /** Market slug for URL */
    slug: string;
    /** Outcome IDs */
    outcomeIds: string[];
}
