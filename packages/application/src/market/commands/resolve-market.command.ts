/**
 * Resolve Market Command
 */

import { Command } from '../../common/command.interface';
import type { ResolutionSource } from '@dejavu/shared/types';

/**
 * DTO for resolving a market
 */
export interface ResolveMarketDto {
    /** Market ID to resolve */
    marketId: string;
    /** Winning outcome ID */
    winningOutcomeId: string;
    /** Resolution source */
    resolutionSource: ResolutionSource;
    /** Resolution proof/evidence */
    resolutionProof?: string;
    /** Resolution notes */
    notes?: string;
}

/**
 * Resolve Market Command
 */
export class ResolveMarketCommand extends Command {
    readonly commandType = 'market.resolve';

    constructor(
        public readonly data: ResolveMarketDto,
        options?: { correlationId?: string; userId?: string },
    ) {
        super(options);
    }
}

/**
 * Resolve Market Command Result
 */
export interface ResolveMarketResult {
    /** Market ID */
    marketId: string;
    /** Winning outcome ID */
    winningOutcomeId: string;
    /** Number of positions to settle */
    positionsToSettle: number;
    /** Total payout amount */
    totalPayout: string;
}
