/**
 * Market Aggregate Root
 *
 * The root entity that maintains market consistency and raises domain events.
 */

import { AggregateRoot, AggregateRootProps } from '../../common/aggregate-root.base';
import { StringId } from '../../common/entity.base';
import type { MarketCategory, MarketStatus, MarketType, ResolutionSource, ChainId } from '@dejavu/shared/types';
import { BusinessRuleError, MarketNotActiveError, MarketClosedError, MarketAlreadyResolvedError } from '@dejavu/shared/errors';
import { OutcomeEntity } from '../entities/outcome.entity';
import { MarketIdVO, MoneyVO } from '../value-objects/market.vo';
import {
    MarketCreatedEvent,
    MarketStatusChangedEvent,
    MarketResolvedEvent,
    OrderPlacedEvent,
} from '../events/market.events';

export interface MarketAggregateProps extends AggregateRootProps {
    slug: string;
    title: string;
    description: string;
    rules?: string;
    category: MarketCategory;
    type: MarketType;
    status: MarketStatus;

    // Dates
    startDate: Date;
    endDate: Date;
    resolutionDeadline: Date;

    // Trading
    volume: MoneyVO;
    liquidity: MoneyVO;
    outcomes: OutcomeEntity[];

    // Chain
    chainId: ChainId;
    contractAddress?: string;

    // Metadata
    imageUrl?: string;
    tags: string[];
    featured: boolean;

    // Resolution
    resolutionSource: ResolutionSource;
    resolvedOutcomeId?: string;
    resolvedAt?: Date;
    resolvedBy?: string;

    // Creator
    creatorId: string;
    creatorFee: number;
}

export class MarketAggregate extends AggregateRoot<MarketAggregateProps> {
    private constructor(props: MarketAggregateProps) {
        super(props);
    }

    /**
     * Create a new market
     */
    static create(props: {
        title: string;
        description: string;
        rules?: string;
        category: MarketCategory;
        type: MarketType;
        outcomes: { name: string; description?: string }[];
        startDate?: Date;
        endDate: Date;
        resolutionDeadline: Date;
        resolutionSource: ResolutionSource;
        chainId: ChainId;
        creatorId: string;
        creatorFee?: number;
        imageUrl?: string;
        tags?: string[];
        initialLiquidity?: string;
    }): MarketAggregate {
        const id = MarketIdVO.generate();
        const slug = MarketAggregate.generateSlug(props.title);

        // Create outcome entities
        const outcomeCount = props.outcomes.length;
        const initialProbability = 1 / outcomeCount;
        const outcomes = props.outcomes.map((o) =>
            OutcomeEntity.create({
                name: o.name,
                description: o.description,
                initialProbability,
            })
        );

        const market = new MarketAggregate({
            id: new StringId(id.value),
            slug,
            title: props.title,
            description: props.description,
            rules: props.rules,
            category: props.category,
            type: props.type,
            status: 'pending',
            startDate: props.startDate ?? new Date(),
            endDate: props.endDate,
            resolutionDeadline: props.resolutionDeadline,
            volume: MoneyVO.create('0', 'USD'),
            liquidity: MoneyVO.create(props.initialLiquidity ?? '0', 'USD'),
            outcomes,
            chainId: props.chainId,
            imageUrl: props.imageUrl,
            tags: props.tags ?? [],
            featured: false,
            resolutionSource: props.resolutionSource,
            creatorId: props.creatorId,
            creatorFee: props.creatorFee ?? 0.02, // 2% default
        });

        // Raise domain event
        market.addDomainEvent(
            new MarketCreatedEvent(
                id.value,
                props.title,
                props.category,
                props.type,
                props.creatorId,
                outcomes.map((o) => o.name),
                props.endDate,
            )
        );

        return market;
    }

    /**
     * Generate URL-safe slug from title
     */
    private static generateSlug(title: string): string {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
            .slice(0, 100);
    }

    // Getters
    get slug(): string { return this._props.slug; }
    get title(): string { return this._props.title; }
    get description(): string { return this._props.description; }
    get rules(): string | undefined { return this._props.rules; }
    get category(): MarketCategory { return this._props.category; }
    get type(): MarketType { return this._props.type; }
    get status(): MarketStatus { return this._props.status; }
    get startDate(): Date { return this._props.startDate; }
    get endDate(): Date { return this._props.endDate; }
    get resolutionDeadline(): Date { return this._props.resolutionDeadline; }
    get volume(): MoneyVO { return this._props.volume; }
    get liquidity(): MoneyVO { return this._props.liquidity; }
    get outcomes(): readonly OutcomeEntity[] { return this._props.outcomes; }
    get chainId(): ChainId { return this._props.chainId; }
    get contractAddress(): string | undefined { return this._props.contractAddress; }
    get imageUrl(): string | undefined { return this._props.imageUrl; }
    get tags(): readonly string[] { return this._props.tags; }
    get featured(): boolean { return this._props.featured; }
    get resolutionSource(): ResolutionSource { return this._props.resolutionSource; }
    get creatorId(): string { return this._props.creatorId; }
    get creatorFee(): number { return this._props.creatorFee; }
    get isResolved(): boolean { return this._props.status === 'resolved'; }

    /**
     * Check if market is active for trading
     */
    get isActive(): boolean {
        return this._props.status === 'active';
    }

    /**
     * Check if market has ended
     */
    get hasEnded(): boolean {
        return new Date() > this._props.endDate;
    }

    /**
     * Activate the market for trading
     */
    activate(): void {
        if (this._props.status !== 'pending') {
            throw new BusinessRuleError(
                'CANNOT_ACTIVATE',
                `Cannot activate market with status '${this._props.status}'`
            );
        }

        const previousStatus = this._props.status;
        this._props.status = 'active';
        this.incrementVersion();

        this.addDomainEvent(
            new MarketStatusChangedEvent(
                this.id.toString(),
                previousStatus,
                'active',
                'Market activated for trading'
            )
        );
    }

    /**
     * Close the market for trading
     */
    close(): void {
        if (!this.isActive) {
            throw new MarketNotActiveError(this.id.toString());
        }

        const previousStatus = this._props.status;
        this._props.status = 'closed';
        this.incrementVersion();

        this.addDomainEvent(
            new MarketStatusChangedEvent(
                this.id.toString(),
                previousStatus,
                'closed',
                'Market closed for resolution'
            )
        );
    }

    /**
     * Resolve the market with a winning outcome
     */
    resolve(winningOutcomeId: string, resolverId?: string): void {
        if (this.isResolved) {
            throw new MarketAlreadyResolvedError(this.id.toString());
        }

        if (this._props.status !== 'closed') {
            throw new BusinessRuleError(
                'CANNOT_RESOLVE',
                'Market must be closed before resolution'
            );
        }

        const winningOutcome = this._props.outcomes.find(
            (o) => o.id.toString() === winningOutcomeId
        );

        if (!winningOutcome) {
            throw new BusinessRuleError(
                'INVALID_OUTCOME',
                `Outcome '${winningOutcomeId}' not found in market`
            );
        }

        // Mark outcomes
        for (const outcome of this._props.outcomes) {
            if (outcome.id.toString() === winningOutcomeId) {
                outcome.markAsWinner();
            } else {
                outcome.markAsLoser();
            }
        }

        this._props.status = 'resolved';
        this._props.resolvedOutcomeId = winningOutcomeId;
        this._props.resolvedAt = new Date();
        this._props.resolvedBy = resolverId;
        this.incrementVersion();

        this.addDomainEvent(
            new MarketResolvedEvent(
                this.id.toString(),
                winningOutcomeId,
                this._props.resolutionSource,
                resolverId
            )
        );
    }

    /**
     * Place an order
     */
    placeOrder(
        orderId: string,
        userId: string,
        outcomeId: string,
        side: 'buy' | 'sell',
        quantity: string,
        price: string,
    ): void {
        if (!this.isActive) {
            throw new MarketNotActiveError(this.id.toString());
        }

        if (this.hasEnded) {
            throw new MarketClosedError(this.id.toString());
        }

        const outcome = this._props.outcomes.find(
            (o) => o.id.toString() === outcomeId
        );

        if (!outcome) {
            throw new BusinessRuleError(
                'INVALID_OUTCOME',
                `Outcome '${outcomeId}' not found in market`
            );
        }

        this.addDomainEvent(
            new OrderPlacedEvent(
                this.id.toString(),
                orderId,
                userId,
                outcomeId,
                side,
                quantity,
                price
            )
        );
    }

    /**
     * Update volume after trade
     */
    addVolume(amount: MoneyVO, outcomeId: string): void {
        this._props.volume = this._props.volume.add(amount);

        const outcome = this._props.outcomes.find(
            (o) => o.id.toString() === outcomeId
        );
        outcome?.addVolume(amount);

        this.incrementVersion();
    }

    /**
     * Set contract address after deployment
     */
    setContractAddress(address: string): void {
        this._props.contractAddress = address;
        this.incrementVersion();
    }

    /**
     * Convert to plain object
     */
    toObject() {
        return {
            id: this.id.toString(),
            slug: this.slug,
            title: this.title,
            description: this.description,
            rules: this.rules,
            category: this.category,
            type: this.type,
            status: this.status,
            startDate: this.startDate,
            endDate: this.endDate,
            resolutionDeadline: this.resolutionDeadline,
            volume: this.volume.amount,
            liquidity: this.liquidity.amount,
            outcomes: this._props.outcomes.map((o) => o.toObject()),
            chainId: this.chainId,
            contractAddress: this.contractAddress,
            imageUrl: this.imageUrl,
            tags: [...this.tags],
            featured: this.featured,
            resolutionSource: this.resolutionSource,
            creatorId: this.creatorId,
            creatorFee: this.creatorFee,
            version: this.version,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
}
