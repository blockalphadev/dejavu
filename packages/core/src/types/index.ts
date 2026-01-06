/**
 * @dejavu/core - Shared Types
 * 
 * This module exports all shared TypeScript types used across the DeJaVu platform.
 */

// ============================================================================
// Chain Types
// ============================================================================

export type ChainId =
    | 'ethereum'
    | 'base'
    | 'solana'
    | 'sui'
    | 'polygon'
    | 'arbitrum'
    | 'optimism';

export type ChainType = 'evm' | 'solana' | 'sui';

export interface Chain {
    id: ChainId;
    type: ChainType;
    name: string;
    nativeCurrency: {
        name: string;
        symbol: string;
        decimals: number;
    };
    rpcUrls: string[];
    blockExplorers: string[];
    testnet: boolean;
}

// ============================================================================
// Market Types
// ============================================================================

export type MarketStatus = 'active' | 'closed' | 'resolved' | 'disputed';

export type MarketCategory =
    | 'crypto'
    | 'sports'
    | 'politics'
    | 'entertainment'
    | 'science'
    | 'economics'
    | 'other';

export interface MarketOutcome {
    id: string;
    name: string;
    probability: number;
    price: number;
}

export interface Market {
    id: string;
    slug: string;
    title: string;
    description: string;
    category: MarketCategory;
    status: MarketStatus;
    createdAt: Date;
    endDate: Date;
    resolutionDate?: Date;
    volume: number;
    liquidity: number;
    outcomes: MarketOutcome[];
    imageUrl?: string;
    tags: string[];
    chainId: ChainId;
    contractAddress?: string;
}

// ============================================================================
// Sports Types
// ============================================================================

export type SportType =
    | 'football'
    | 'basketball'
    | 'baseball'
    | 'hockey'
    | 'soccer'
    | 'tennis'
    | 'mma'
    | 'other';

export interface Team {
    id: string;
    name: string;
    abbreviation: string;
    logoUrl?: string;
    primaryColor?: string;
}

export interface SportsEvent {
    id: string;
    sportType: SportType;
    league: string;
    homeTeam: Team;
    awayTeam: Team;
    startTime: Date;
    status: 'scheduled' | 'live' | 'finished' | 'postponed';
    homeScore?: number;
    awayScore?: number;
}

export interface SportsMarket extends Market {
    event: SportsEvent;
    marketType: 'moneyline' | 'spread' | 'total' | 'prop';
}

// ============================================================================
// User Types
// ============================================================================

export interface WalletAddress {
    chain: ChainType;
    address: string;
}

export interface User {
    id: string;
    username?: string;
    email?: string;
    avatarUrl?: string;
    wallets: WalletAddress[];
    createdAt: Date;
    updatedAt: Date;
}

export interface UserPosition {
    marketId: string;
    outcomeId: string;
    shares: number;
    averagePrice: number;
    currentValue: number;
    pnl: number;
}

// ============================================================================
// Transaction Types
// ============================================================================

export type TransactionType = 'buy' | 'sell' | 'claim' | 'deposit' | 'withdraw';

export type TransactionStatus = 'pending' | 'confirmed' | 'failed';

export interface Transaction {
    id: string;
    type: TransactionType;
    status: TransactionStatus;
    chainId: ChainId;
    hash: string;
    from: string;
    to: string;
    value: string;
    timestamp: Date;
    marketId?: string;
    outcomeId?: string;
}

// ============================================================================
// API Types
// ============================================================================

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
}

export interface ApiError {
    code: string;
    message: string;
    details?: Record<string, unknown>;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: ApiError;
}
