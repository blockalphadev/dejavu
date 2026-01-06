/**
 * Order and Transaction Types
 *
 * Type definitions for trading operations
 */

import type { ChainId, ChainTransaction } from './chain';
import type { Auditable, UUID, UserId, OrderId, TransactionId } from './common';

/**
 * Order side
 */
export type OrderSide = 'buy' | 'sell';

/**
 * Order type
 */
export type OrderType =
    | 'market'      // Execute at current price
    | 'limit'       // Execute at specified price or better
    | 'stop_loss'   // Sell when price drops to threshold
    | 'take_profit'; // Sell when price rises to threshold

/**
 * Order status
 */
export type OrderStatus =
    | 'pending'     // Awaiting execution
    | 'open'        // Active limit order
    | 'partial'     // Partially filled
    | 'filled'      // Fully executed
    | 'cancelled'   // Cancelled by user
    | 'expired'     // Time expired
    | 'rejected';   // Rejected by system

/**
 * Trade order
 */
export interface Order extends Auditable {
    id: OrderId;
    userId: UserId;
    marketId: string;
    outcomeId: string;
    side: OrderSide;
    type: OrderType;
    status: OrderStatus;

    // Amounts
    quantity: string;
    filledQuantity: string;
    remainingQuantity: string;

    // Pricing
    price?: string;         // For limit orders
    averagePrice?: string;  // Actual execution price
    totalCost: string;

    // Expiration
    expiresAt?: Date;

    // Chain data
    chainId: ChainId;
    txHash?: string;

    // Metadata
    clientOrderId?: string;
}

/**
 * Transaction type
 */
export type TransactionType =
    | 'buy'
    | 'sell'
    | 'deposit'
    | 'withdraw'
    | 'claim'           // Claim winnings
    | 'add_liquidity'
    | 'remove_liquidity'
    | 'fee';

/**
 * Transaction status
 */
export type TransactionStatus =
    | 'pending'
    | 'processing'
    | 'confirmed'
    | 'failed'
    | 'reverted';

/**
 * Transaction record
 */
export interface Transaction extends Auditable {
    id: TransactionId;
    userId: UserId;
    type: TransactionType;
    status: TransactionStatus;

    // Amount
    amount: string;
    currency: string;

    // References
    marketId?: string;
    outcomeId?: string;
    orderId?: OrderId;

    // Chain data
    chainId: ChainId;
    chainTx?: ChainTransaction;

    // Metadata
    description?: string;
    metadata?: Record<string, unknown>;
}

/**
 * Order book entry
 */
export interface OrderBookEntry {
    price: string;
    quantity: string;
    orderCount: number;
    cumulativeQuantity: string;
}

/**
 * Order book for an outcome
 */
export interface OrderBook {
    outcomeId: string;
    bids: OrderBookEntry[];
    asks: OrderBookEntry[];
    spread: string;
    midPrice: string;
    lastUpdatedAt: Date;
}

/**
 * Trade history entry
 */
export interface TradeHistory {
    id: UUID;
    marketId: string;
    outcomeId: string;
    side: OrderSide;
    price: string;
    quantity: string;
    total: string;
    timestamp: Date;
    buyerAddress?: string;
    sellerAddress?: string;
    txHash?: string;
}

/**
 * Place order request
 */
export interface PlaceOrderRequest {
    marketId: string;
    outcomeId: string;
    side: OrderSide;
    type: OrderType;
    quantity: string;
    price?: string;
    expiresAt?: Date;
    clientOrderId?: string;
}

/**
 * Cancel order request
 */
export interface CancelOrderRequest {
    orderId: OrderId;
    reason?: string;
}
