/**
 * Market-specific Errors
 */

import { BusinessRuleError } from './domain-error';

/**
 * Market not active error
 */
export class MarketNotActiveError extends BusinessRuleError {
    constructor(marketId: string) {
        super(
            'MARKET_NOT_ACTIVE',
            `Market '${marketId}' is not active for trading`,
            { details: { marketId } },
        );
    }
}

/**
 * Market closed error
 */
export class MarketClosedError extends BusinessRuleError {
    constructor(marketId: string) {
        super(
            'MARKET_CLOSED',
            `Market '${marketId}' is closed`,
            { details: { marketId } },
        );
    }
}

/**
 * Invalid outcome error
 */
export class InvalidOutcomeError extends BusinessRuleError {
    constructor(outcomeId: string, marketId: string) {
        super(
            'INVALID_OUTCOME',
            `Outcome '${outcomeId}' is not valid for market '${marketId}'`,
            { details: { outcomeId, marketId } },
        );
    }
}

/**
 * Insufficient liquidity error
 */
export class InsufficientLiquidityError extends BusinessRuleError {
    constructor(required: string, available: string) {
        super(
            'INSUFFICIENT_LIQUIDITY',
            `Insufficient liquidity: required ${required}, available ${available}`,
            { details: { required, available } },
        );
    }
}

/**
 * Order price out of range error
 */
export class PriceOutOfRangeError extends BusinessRuleError {
    constructor(price: string, minPrice: string, maxPrice: string) {
        super(
            'PRICE_OUT_OF_RANGE',
            `Price ${price} is outside valid range [${minPrice}, ${maxPrice}]`,
            { details: { price, minPrice, maxPrice } },
        );
    }
}

/**
 * Market already resolved error
 */
export class MarketAlreadyResolvedError extends BusinessRuleError {
    constructor(marketId: string) {
        super(
            'MARKET_ALREADY_RESOLVED',
            `Market '${marketId}' has already been resolved`,
            { details: { marketId } },
        );
    }
}

/**
 * Unauthorized market action error
 */
export class UnauthorizedMarketActionError extends BusinessRuleError {
    constructor(action: string, marketId: string) {
        super(
            'UNAUTHORIZED_MARKET_ACTION',
            `Unauthorized to perform '${action}' on market '${marketId}'`,
            { severity: 'medium', details: { action, marketId } },
        );
    }
}
