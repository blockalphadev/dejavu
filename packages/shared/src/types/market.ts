/**
 * Market Types
 *
 * Type definitions for prediction markets
 */

import type { ChainId, ChainTransaction } from './chain';
import type { Auditable, MarketId, Probability, CurrencyAmount, UUID } from './common';

/**
 * Market status lifecycle
 */
export type MarketStatus =
    | 'draft'        // Market is being created
    | 'pending'      // Awaiting approval/funding
    | 'active'       // Trading enabled
    | 'paused'       // Temporarily suspended
    | 'closed'       // Trading closed, awaiting resolution
    | 'resolving'    // Resolution in progress
    | 'resolved'     // Final outcome determined
    | 'disputed'     // Resolution challenged
    | 'cancelled';   // Market cancelled

/**
 * Market categories
 */
export type MarketCategory =
    | 'crypto'
    | 'sports'
    | 'politics'
    | 'entertainment'
    | 'technology'
    | 'science'
    | 'economics'
    | 'weather'
    | 'other';

/**
 * Market type
 */
export type MarketType =
    | 'binary'       // Yes/No outcomes
    | 'categorical'  // Multiple outcomes
    | 'scalar';      // Numeric range

/**
 * Resolution source
 */
export type ResolutionSource =
    | 'oracle'      // Automated oracle
    | 'committee'   // DAO/committee decision
    | 'manual'      // Admin resolution
    | 'uma'         // UMA optimistic oracle
    | 'chainlink';  // Chainlink oracle

/**
 * Market outcome
 */
export interface MarketOutcome {
    id: UUID;
    name: string;
    description?: string;
    probability: Probability;
    price: CurrencyAmount;
    volume: CurrencyAmount;
    isWinningOutcome?: boolean;
}

/**
 * Market liquidity pool
 */
export interface LiquidityPool {
    totalLiquidity: CurrencyAmount;
    fee: number; // Percentage as decimal (e.g., 0.02 = 2%)
    lpTokenSupply: CurrencyAmount;
    reserves: Record<string, CurrencyAmount>; // outcome_id -> amount
}

/**
 * Market resolution
 */
export interface MarketResolution {
    resolvedAt: Date;
    winningOutcomeId: UUID;
    resolutionSource: ResolutionSource;
    resolutionData?: string;
    resolvedBy?: string;
    disputeDeadline?: Date;
}

/**
 * Core Market entity
 */
export interface Market extends Auditable {
    id: MarketId;
    slug: string;
    title: string;
    description: string;
    rules?: string;
    category: MarketCategory;
    type: MarketType;
    status: MarketStatus;

    // Timing
    startDate: Date;
    endDate: Date;
    resolutionDeadline: Date;

    // Trading data
    volume: CurrencyAmount;
    liquidity: CurrencyAmount;
    outcomes: MarketOutcome[];

    // Chain data
    chainId: ChainId;
    contractAddress?: string;
    creationTx?: ChainTransaction;

    // Metadata
    imageUrl?: string;
    iconUrl?: string;
    tags: string[];
    featured: boolean;

    // Resolution
    resolution?: MarketResolution;
    resolutionSource: ResolutionSource;

    // Creator
    creatorId: string;
    creatorFee?: number; // Percentage

    // Liquidity
    liquidityPool?: LiquidityPool;
}

/**
 * Market summary for list views
 */
export interface MarketSummary {
    id: MarketId;
    slug: string;
    title: string;
    category: MarketCategory;
    status: MarketStatus;
    endDate: Date;
    volume: CurrencyAmount;
    outcomes: Pick<MarketOutcome, 'id' | 'name' | 'probability' | 'price'>[];
    imageUrl?: string;
    chainId: ChainId;
}

/**
 * Market creation request
 */
export interface CreateMarketRequest {
    title: string;
    description: string;
    rules?: string;
    category: MarketCategory;
    type: MarketType;
    outcomes: { name: string; description?: string }[];
    endDate: Date;
    resolutionDeadline: Date;
    resolutionSource: ResolutionSource;
    chainId: ChainId;
    imageUrl?: string;
    tags?: string[];
    initialLiquidity?: CurrencyAmount;
    creatorFee?: number;
}
