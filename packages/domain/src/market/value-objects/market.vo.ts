/**
 * Market Value Objects
 */

import { SingleValueObject, ValueObject } from '../common/value-object.base';
import { ValidationError } from '@dejavu/shared/errors';

/**
 * Market ID value object
 */
export class MarketIdVO extends SingleValueObject<string> {
    protected validate(value: string): void {
        if (!value || value.trim().length === 0) {
            throw new ValidationError('Market ID cannot be empty', { field: 'marketId' });
        }
    }

    static create(value: string): MarketIdVO {
        return new MarketIdVO(value);
    }

    static generate(): MarketIdVO {
        return new MarketIdVO(crypto.randomUUID());
    }
}

/**
 * Price value object (0-1 range for prediction markets)
 */
export class PriceVO extends SingleValueObject<number> {
    protected validate(value: number): void {
        if (value < 0 || value > 1) {
            throw new ValidationError('Price must be between 0 and 1', {
                field: 'price',
                details: { value, min: 0, max: 1 },
            });
        }
    }

    static create(value: number): PriceVO {
        return new PriceVO(value);
    }

    /**
     * Create from cents (0-100)
     */
    static fromCents(cents: number): PriceVO {
        return new PriceVO(cents / 100);
    }

    /**
     * Get as cents
     */
    toCents(): number {
        return Math.round(this._value * 100);
    }

    /**
     * Get as percentage string
     */
    toPercentage(): string {
        return `${(this._value * 100).toFixed(1)}%`;
    }
}

/**
 * Money value object with currency
 */
export class MoneyVO extends ValueObject<{ amount: string; currency: string }> {
    private constructor(props: { amount: string; currency: string }) {
        super(props);
    }

    static create(amount: string | number, currency: string = 'USD'): MoneyVO {
        const amountStr = typeof amount === 'number' ? amount.toString() : amount;

        if (isNaN(Number(amountStr))) {
            throw new ValidationError('Invalid money amount', {
                field: 'amount',
                details: { amount: amountStr },
            });
        }

        return new MoneyVO({ amount: amountStr, currency: currency.toUpperCase() });
    }

    get amount(): string {
        return this.props.amount;
    }

    get currency(): string {
        return this.props.currency;
    }

    get numericAmount(): number {
        return Number(this.props.amount);
    }

    /**
     * Add money
     */
    add(other: MoneyVO): MoneyVO {
        if (this.currency !== other.currency) {
            throw new ValidationError('Cannot add money with different currencies');
        }
        const newAmount = this.numericAmount + other.numericAmount;
        return MoneyVO.create(newAmount.toString(), this.currency);
    }

    /**
     * Subtract money
     */
    subtract(other: MoneyVO): MoneyVO {
        if (this.currency !== other.currency) {
            throw new ValidationError('Cannot subtract money with different currencies');
        }
        const newAmount = this.numericAmount - other.numericAmount;
        return MoneyVO.create(newAmount.toString(), this.currency);
    }

    /**
     * Multiply by factor
     */
    multiply(factor: number): MoneyVO {
        const newAmount = this.numericAmount * factor;
        return MoneyVO.create(newAmount.toString(), this.currency);
    }

    /**
     * Format for display
     */
    format(locale: string = 'en-US'): string {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: this.currency,
        }).format(this.numericAmount);
    }
}

/**
 * Probability value object (0-1)
 */
export class ProbabilityVO extends SingleValueObject<number> {
    protected validate(value: number): void {
        if (value < 0 || value > 1) {
            throw new ValidationError('Probability must be between 0 and 1', {
                field: 'probability',
            });
        }
    }

    static create(value: number): ProbabilityVO {
        return new ProbabilityVO(value);
    }

    toPercentage(): number {
        return this._value * 100;
    }

    toPercentageString(): string {
        return `${(this._value * 100).toFixed(1)}%`;
    }
}
