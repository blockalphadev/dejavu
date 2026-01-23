/**
 * Orders Service
 * 
 * Frontend API client for placing bets/orders on prediction markets.
 * Handles buy, sell, and position management.
 */

import { apiRequest, isAuthenticated } from './api';

// ========================
// Types
// ========================

export interface BuySharesDto {
    marketId: string;
    isYes: boolean;
    amount: number;
    maxCost: number;
}

export interface SellSharesDto {
    marketId: string;
    isYes: boolean;
    shares: number;
    minReturn: number;
}

export interface OrderResponse {
    id: string;
    userId: string;
    marketId: string;
    type: 'buy' | 'sell';
    side: 'yes' | 'no';
    shares: number;
    price: number;
    total: number;
    status: 'pending' | 'filled' | 'cancelled' | 'failed';
    txHash?: string;
    createdAt: string;
}

export interface Position {
    id: string;
    userId: string;
    marketId: string;
    yesShares: number;
    noShares: number;
    avgYesCost: number;
    avgNoCost: number;
    realizedPnl: number;
    unrealizedPnl: number;
    createdAt: string;
    updatedAt: string;
}

export interface PlaceBetResult {
    success: boolean;
    order?: OrderResponse;
    error?: string;
}

export interface ParlayBetDto {
    selections: Array<{
        marketId: string;
        isYes: boolean;
        price: number;
    }>;
    totalStake: number;
    slippageTolerance?: number; // default 5%
}

// ========================
// Orders API Service
// ========================

class OrdersApiService {
    /**
     * Buy shares in a prediction market
     */
    async buyShares(dto: BuySharesDto): Promise<OrderResponse> {
        if (!isAuthenticated()) {
            throw new Error('Please log in to place a bet');
        }

        return apiRequest<OrderResponse>('/orders/buy', {
            method: 'POST',
            body: dto,
        });
    }

    /**
     * Sell shares in a prediction market
     */
    async sellShares(dto: SellSharesDto): Promise<OrderResponse> {
        if (!isAuthenticated()) {
            throw new Error('Please log in to sell shares');
        }

        return apiRequest<OrderResponse>('/orders/sell', {
            method: 'POST',
            body: dto,
        });
    }

    /**
     * Get user's positions
     */
    async getPositions(): Promise<Position[]> {
        if (!isAuthenticated()) {
            return [];
        }

        return apiRequest<Position[]>('/orders/positions');
    }

    /**
     * Get position for a specific market
     */
    async getPositionByMarket(marketId: string): Promise<Position | null> {
        if (!isAuthenticated()) {
            return null;
        }

        try {
            return await apiRequest<Position>(`/orders/positions/${marketId}`);
        } catch {
            return null;
        }
    }

    /**
     * Get order history
     */
    async getOrderHistory(params?: {
        marketId?: string;
        limit?: number;
        offset?: number;
    }): Promise<OrderResponse[]> {
        if (!isAuthenticated()) {
            return [];
        }

        const queryParams = new URLSearchParams();
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined) {
                    queryParams.append(key, String(value));
                }
            });
        }
        const query = queryParams.toString();
        return apiRequest<OrderResponse[]>(`/orders/history${query ? `?${query}` : ''}`);
    }

    /**
     * Place a single bet with slippage protection
     */
    async placeSingleBet(
        marketId: string,
        isYes: boolean,
        amount: number,
        currentPrice: number,
        slippageTolerance: number = 0.05
    ): Promise<PlaceBetResult> {
        try {
            const maxCost = amount * (1 + slippageTolerance);
            
            const order = await this.buyShares({
                marketId,
                isYes,
                amount,
                maxCost,
            });

            return { success: true, order };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to place bet',
            };
        }
    }

    /**
     * Place multiple single bets (not parlay, just batch)
     */
    async placeBatchBets(
        bets: Array<{
            marketId: string;
            isYes: boolean;
            amount: number;
            price: number;
        }>,
        slippageTolerance: number = 0.05
    ): Promise<{
        results: PlaceBetResult[];
        totalSuccess: number;
        totalFailed: number;
    }> {
        const results: PlaceBetResult[] = [];
        let totalSuccess = 0;
        let totalFailed = 0;

        for (const bet of bets) {
            const result = await this.placeSingleBet(
                bet.marketId,
                bet.isYes,
                bet.amount,
                bet.price,
                slippageTolerance
            );

            results.push(result);
            if (result.success) {
                totalSuccess++;
            } else {
                totalFailed++;
            }
        }

        return { results, totalSuccess, totalFailed };
    }
}

// Export singleton instance
export const OrdersService = new OrdersApiService();

// Export class for custom instances
export { OrdersApiService };

// ========================
// Utility Functions
// ========================

/**
 * Convert probability (0-1) to decimal odds
 * e.g., 0.5 (50%) -> 2.0 decimal odds
 */
export function probabilityToDecimalOdds(probability: number): number {
    if (probability <= 0 || probability >= 1) return 0;
    return 1 / probability;
}

/**
 * Convert decimal odds to American odds
 * e.g., 2.0 -> +100, 1.5 -> -200
 */
export function decimalToAmericanOdds(decimal: number): string {
    if (decimal >= 2) {
        return `+${Math.round((decimal - 1) * 100)}`;
    } else if (decimal > 1) {
        return `-${Math.round(100 / (decimal - 1))}`;
    }
    return '-';
}

/**
 * Convert probability to American odds
 */
export function probabilityToAmericanOdds(probability: number): string {
    const decimal = probabilityToDecimalOdds(probability);
    return decimalToAmericanOdds(decimal);
}

/**
 * Convert decimal odds to fractional
 * e.g., 2.5 -> 3/2
 */
export function decimalToFractionalOdds(decimal: number): string {
    if (decimal <= 1) return '-';
    
    const profit = decimal - 1;
    // Find best fraction
    const fractions = [
        [1, 1], [2, 1], [3, 1], [4, 1], [5, 1],
        [1, 2], [3, 2], [5, 2], [7, 2], [9, 2],
        [1, 3], [2, 3], [4, 3], [5, 3],
        [1, 4], [3, 4], [5, 4], [7, 4],
        [1, 5], [2, 5], [3, 5], [4, 5],
        [11, 10], [21, 20], [11, 8], [13, 8],
        [6, 5], [11, 10], [1, 10], [1, 20],
    ];

    let closest = [1, 1];
    let minDiff = Infinity;

    for (const [n, d] of fractions) {
        const diff = Math.abs(n / d - profit);
        if (diff < minDiff) {
            minDiff = diff;
            closest = [n, d];
        }
    }

    return `${closest[0]}/${closest[1]}`;
}

/**
 * Format odds based on preferred format
 */
export type OddsFormat = 'decimal' | 'american' | 'fractional' | 'percentage';

export function formatOdds(probability: number, format: OddsFormat): string {
    switch (format) {
        case 'decimal':
            return probabilityToDecimalOdds(probability).toFixed(2);
        case 'american':
            return probabilityToAmericanOdds(probability);
        case 'fractional':
            return decimalToFractionalOdds(probabilityToDecimalOdds(probability));
        case 'percentage':
            return `${(probability * 100).toFixed(1)}%`;
        default:
            return `${(probability * 100).toFixed(0)}¢`;
    }
}

/**
 * Calculate parlay odds (multiply all individual odds)
 */
export function calculateParlayOdds(probabilities: number[]): number {
    if (probabilities.length === 0) return 0;
    
    // Parlay multiplies the decimal odds
    return probabilities.reduce((acc, prob) => {
        const decimalOdds = probabilityToDecimalOdds(prob);
        return acc * decimalOdds;
    }, 1);
}

/**
 * Calculate parlay payout
 */
export function calculateParlayPayout(stake: number, probabilities: number[]): number {
    const combinedOdds = calculateParlayOdds(probabilities);
    return stake * combinedOdds;
}

