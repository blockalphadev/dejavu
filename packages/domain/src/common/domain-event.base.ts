/**
 * Domain Event Base Class
 *
 * Events that capture something meaningful that happened in the domain.
 */

import { StringId } from './entity.base';

/**
 * Domain event metadata
 */
export interface DomainEventMetadata {
    timestamp: Date;
    correlationId?: string;
    causationId?: string;
    userId?: string;
}

/**
 * Abstract base Domain Event class
 */
export abstract class DomainEvent {
    readonly eventId: string;
    readonly occurredOn: Date;
    readonly metadata: DomainEventMetadata;

    abstract readonly eventType: string;
    abstract readonly aggregateId: string;
    abstract readonly aggregateType: string;

    constructor(metadata?: Partial<DomainEventMetadata>) {
        this.eventId = crypto.randomUUID();
        this.occurredOn = new Date();
        this.metadata = {
            timestamp: this.occurredOn,
            ...metadata,
        };
    }

    /**
     * Get event key for routing
     */
    get eventKey(): string {
        return `${this.aggregateType}.${this.eventType}`;
    }

    /**
     * Serialize event to JSON
     */
    toJSON(): Record<string, unknown> {
        return {
            eventId: this.eventId,
            eventType: this.eventType,
            aggregateId: this.aggregateId,
            aggregateType: this.aggregateType,
            occurredOn: this.occurredOn.toISOString(),
            metadata: this.metadata,
            payload: this.getPayload(),
        };
    }

    /**
     * Get event-specific payload
     */
    protected abstract getPayload(): Record<string, unknown>;
}

/**
 * Domain event handler interface
 */
export interface IDomainEventHandler<T extends DomainEvent = DomainEvent> {
    handle(event: T): Promise<void>;
}

/**
 * Domain event publisher interface
 */
export interface IDomainEventPublisher {
    publish(event: DomainEvent): Promise<void>;
    publishAll(events: DomainEvent[]): Promise<void>;
}
