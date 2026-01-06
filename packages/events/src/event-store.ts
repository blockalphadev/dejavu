/**
 * Event Store
 *
 * Stores domain events for audit trail, event replay, and
 * eventual event sourcing support.
 */

import type { DomainEvent } from '@dejavu/domain';

/**
 * Stored event record
 */
export interface StoredEvent {
    /** Unique event ID */
    eventId: string;
    /** Event type name */
    eventType: string;
    /** Aggregate type */
    aggregateType: string;
    /** Aggregate ID */
    aggregateId: string;
    /** Event payload as JSON */
    payload: Record<string, unknown>;
    /** Event metadata */
    metadata: Record<string, unknown>;
    /** When the event occurred */
    occurredOn: Date;
    /** When the event was stored */
    storedAt: Date;
    /** Sequence number for ordering */
    sequenceNumber: number;
}

/**
 * Query options for retrieving events
 */
export interface EventQueryOptions {
    /** Filter by aggregate ID */
    aggregateId?: string;
    /** Filter by aggregate type */
    aggregateType?: string;
    /** Filter by event type */
    eventType?: string;
    /** Events after this date */
    fromDate?: Date;
    /** Events before this date */
    toDate?: Date;
    /** Starting sequence number */
    fromSequence?: number;
    /** Limit results */
    limit?: number;
    /** Order direction */
    order?: 'asc' | 'desc';
}

/**
 * Event store interface
 */
export interface IEventStore {
    /**
     * Append events to the store
     */
    append(events: DomainEvent[]): Promise<void>;

    /**
     * Get events by query options
     */
    getEvents(options: EventQueryOptions): Promise<StoredEvent[]>;

    /**
     * Get all events for an aggregate
     */
    getEventsForAggregate(aggregateId: string): Promise<StoredEvent[]>;

    /**
     * Get the last event sequence number
     */
    getLastSequenceNumber(): Promise<number>;

    /**
     * Count events matching query
     */
    countEvents(options: EventQueryOptions): Promise<number>;
}

/**
 * In-Memory Event Store implementation
 *
 * Suitable for development and testing
 */
export class InMemoryEventStore implements IEventStore {
    private events: StoredEvent[] = [];
    private sequenceCounter: number = 0;

    /**
     * Append events to the store
     */
    async append(domainEvents: DomainEvent[]): Promise<void> {
        const storedAt = new Date();

        for (const event of domainEvents) {
            this.sequenceCounter++;
            const storedEvent: StoredEvent = {
                eventId: event.eventId,
                eventType: event.eventType,
                aggregateType: event.aggregateType,
                aggregateId: event.aggregateId,
                payload: event.toJSON().payload as Record<string, unknown>,
                metadata: event.metadata as unknown as Record<string, unknown>,
                occurredOn: event.occurredOn,
                storedAt,
                sequenceNumber: this.sequenceCounter,
            };
            this.events.push(storedEvent);
        }
    }

    /**
     * Get events by query options
     */
    async getEvents(options: EventQueryOptions): Promise<StoredEvent[]> {
        let result = [...this.events];

        // Apply filters
        if (options.aggregateId) {
            result = result.filter((e) => e.aggregateId === options.aggregateId);
        }
        if (options.aggregateType) {
            result = result.filter((e) => e.aggregateType === options.aggregateType);
        }
        if (options.eventType) {
            result = result.filter((e) => e.eventType === options.eventType);
        }
        if (options.fromDate) {
            result = result.filter((e) => e.occurredOn >= options.fromDate!);
        }
        if (options.toDate) {
            result = result.filter((e) => e.occurredOn <= options.toDate!);
        }
        if (options.fromSequence !== undefined) {
            result = result.filter((e) => e.sequenceNumber >= options.fromSequence!);
        }

        // Apply ordering
        result.sort((a, b) => {
            const diff = a.sequenceNumber - b.sequenceNumber;
            return options.order === 'desc' ? -diff : diff;
        });

        // Apply limit
        if (options.limit) {
            result = result.slice(0, options.limit);
        }

        return result;
    }

    /**
     * Get all events for an aggregate
     */
    async getEventsForAggregate(aggregateId: string): Promise<StoredEvent[]> {
        return this.getEvents({ aggregateId, order: 'asc' });
    }

    /**
     * Get the last event sequence number
     */
    async getLastSequenceNumber(): Promise<number> {
        return this.sequenceCounter;
    }

    /**
     * Count events matching query
     */
    async countEvents(options: EventQueryOptions): Promise<number> {
        const events = await this.getEvents({ ...options, limit: undefined });
        return events.length;
    }

    /**
     * Clear all events (for testing)
     */
    clear(): void {
        this.events = [];
        this.sequenceCounter = 0;
    }
}

/**
 * Create an in-memory event store
 */
export function createInMemoryEventStore(): InMemoryEventStore {
    return new InMemoryEventStore();
}
