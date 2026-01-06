/**
 * Place Order Command
 */

import { Command } from '../../common/command.interface';

/**
 * Order side
 */
export type OrderSide = 'buy' | 'sell';

/**
 * Order type
 */
export type OrderType = 'market' | 'limit';

/**
 * DTO for placing an order
 */
export interface PlaceOrderDto {
    /** Market ID */
    marketId: string;
    /** Outcome ID to bet on */
    outcomeId: string;
    /** Order side (buy/sell) */
    side: OrderSide;
    /** Order type */
    orderType: OrderType;
    /** Quantity (shares) */
    quantity: string;
    /** Limit price (required for limit orders) */
    limitPrice?: string;
    /** Expiration time for order */
    expiresAt?: Date;
}

/**
 * Place Order Command
 */
export class PlaceOrderCommand extends Command {
    readonly commandType = 'order.place';

    constructor(
        public readonly data: PlaceOrderDto,
        options?: { correlationId?: string; userId?: string },
    ) {
        super(options);
    }
}

/**
 * Place Order Command Result
 */
export interface PlaceOrderResult {
    /** Order ID */
    orderId: string;
    /** Order status */
    status: 'pending' | 'filled' | 'partially_filled' | 'cancelled';
    /** Filled quantity */
    filledQuantity: string;
    /** Average fill price */
    avgFillPrice?: string;
    /** Trades executed */
    trades: Array<{
        tradeId: string;
        quantity: string;
        price: string;
    }>;
}
