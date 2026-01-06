/**
 * Market Domain Events
 */

import { DomainEvent } from '../../common/domain-event.base';
import type { MarketCategory, MarketStatus, MarketType, ResolutionSource } from '@dejavu/shared/types';

/**
 * Market Created Event
 */
export class MarketCreatedEvent extends DomainEvent {
    readonly eventType = 'created';
    readonly aggregateType = 'market';

    constructor(
        public readonly aggregateId: string,
        public readonly title: string,
        public readonly category: MarketCategory,
        public readonly type: MarketType,
        public readonly creatorId: string,
        public readonly outcomes: string[],
        public readonly endDate: Date,
    ) {
        super();
    }

    protected getPayload() {
        return {
            title: this.title,
            category: this.category,
            type: this.type,
            creatorId: this.creatorId,
            outcomes: this.outcomes,
            endDate: this.endDate.toISOString(),
        };
    }
}

/**
 * Market Status Changed Event
 */
export class MarketStatusChangedEvent extends DomainEvent {
    readonly eventType = 'status_changed';
    readonly aggregateType = 'market';

    constructor(
        public readonly aggregateId: string,
        public readonly previousStatus: MarketStatus,
        public readonly newStatus: MarketStatus,
        public readonly reason?: string,
    ) {
        super();
    }

    protected getPayload() {
        return {
            previousStatus: this.previousStatus,
            newStatus: this.newStatus,
            reason: this.reason,
        };
    }
}

/**
 * Market Resolved Event
 */
export class MarketResolvedEvent extends DomainEvent {
    readonly eventType = 'resolved';
    readonly aggregateType = 'market';

    constructor(
        public readonly aggregateId: string,
        public readonly winningOutcomeId: string,
        public readonly resolutionSource: ResolutionSource,
        public readonly resolverId?: string,
    ) {
        super();
    }

    protected getPayload() {
        return {
            winningOutcomeId: this.winningOutcomeId,
            resolutionSource: this.resolutionSource,
            resolverId: this.resolverId,
        };
    }
}

/**
 * Order Placed Event
 */
export class OrderPlacedEvent extends DomainEvent {
    readonly eventType = 'order_placed';
    readonly aggregateType = 'market';

    constructor(
        public readonly aggregateId: string,
        public readonly orderId: string,
        public readonly userId: string,
        public readonly outcomeId: string,
        public readonly side: 'buy' | 'sell',
        public readonly quantity: string,
        public readonly price: string,
    ) {
        super();
    }

    protected getPayload() {
        return {
            orderId: this.orderId,
            userId: this.userId,
            outcomeId: this.outcomeId,
            side: this.side,
            quantity: this.quantity,
            price: this.price,
        };
    }
}

/**
 * Trade Executed Event
 */
export class TradeExecutedEvent extends DomainEvent {
    readonly eventType = 'trade_executed';
    readonly aggregateType = 'market';

    constructor(
        public readonly aggregateId: string,
        public readonly tradeId: string,
        public readonly buyOrderId: string,
        public readonly sellOrderId: string,
        public readonly outcomeId: string,
        public readonly quantity: string,
        public readonly price: string,
    ) {
        super();
    }

    protected getPayload() {
        return {
            tradeId: this.tradeId,
            buyOrderId: this.buyOrderId,
            sellOrderId: this.sellOrderId,
            outcomeId: this.outcomeId,
            quantity: this.quantity,
            price: this.price,
        };
    }
}

/**
 * Liquidity Added Event
 */
export class LiquidityAddedEvent extends DomainEvent {
    readonly eventType = 'liquidity_added';
    readonly aggregateType = 'market';

    constructor(
        public readonly aggregateId: string,
        public readonly providerId: string,
        public readonly amount: string,
        public readonly lpTokensMinted: string,
    ) {
        super();
    }

    protected getPayload() {
        return {
            providerId: this.providerId,
            amount: this.amount,
            lpTokensMinted: this.lpTokensMinted,
        };
    }
}
