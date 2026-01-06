/**
 * Outcome Entity
 *
 * Represents a possible outcome in a prediction market.
 */

import { Entity, EntityProps, StringId } from '../../common/entity.base';
import { PriceVO, ProbabilityVO, MoneyVO } from '../value-objects/market.vo';

export interface OutcomeProps extends EntityProps {
    name: string;
    description?: string;
    probability: ProbabilityVO;
    price: PriceVO;
    volume: MoneyVO;
    isWinningOutcome?: boolean;
}

export class OutcomeEntity extends Entity<OutcomeProps> {
    private constructor(props: OutcomeProps) {
        super(props);
    }

    static create(props: {
        id?: string;
        name: string;
        description?: string;
        initialProbability?: number;
    }): OutcomeEntity {
        const probability = props.initialProbability ?? 0.5;
        return new OutcomeEntity({
            id: new StringId(props.id ?? crypto.randomUUID()),
            name: props.name,
            description: props.description,
            probability: ProbabilityVO.create(probability),
            price: PriceVO.create(probability),
            volume: MoneyVO.create('0', 'USD'),
            isWinningOutcome: undefined,
        });
    }

    get name(): string {
        return this._props.name;
    }

    get description(): string | undefined {
        return this._props.description;
    }

    get probability(): ProbabilityVO {
        return this._props.probability;
    }

    get price(): PriceVO {
        return this._props.price;
    }

    get volume(): MoneyVO {
        return this._props.volume;
    }

    get isWinningOutcome(): boolean | undefined {
        return this._props.isWinningOutcome;
    }

    /**
     * Update probability and price
     */
    updateProbability(newProbability: number): void {
        this._props.probability = ProbabilityVO.create(newProbability);
        this._props.price = PriceVO.create(newProbability);
        this._props.updatedAt = new Date();
    }

    /**
     * Add volume
     */
    addVolume(amount: MoneyVO): void {
        this._props.volume = this._props.volume.add(amount);
        this._props.updatedAt = new Date();
    }

    /**
     * Mark as winning outcome
     */
    markAsWinner(): void {
        this._props.isWinningOutcome = true;
        this._props.updatedAt = new Date();
    }

    /**
     * Mark as losing outcome
     */
    markAsLoser(): void {
        this._props.isWinningOutcome = false;
        this._props.updatedAt = new Date();
    }

    /**
     * Convert to plain object
     */
    toObject() {
        return {
            id: this.id.toString(),
            name: this.name,
            description: this.description,
            probability: this.probability.value,
            price: this.price.value,
            volume: this.volume.amount,
            isWinningOutcome: this.isWinningOutcome,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
}
