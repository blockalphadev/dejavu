/**
 * Aggregate Root Base Class
 *
 * The root entity that maintains consistency boundaries and domain events.
 */

import { Entity, EntityId, EntityProps } from './entity.base';
import { DomainEvent } from './domain-event.base';

/**
 * Aggregate root props
 */
export interface AggregateRootProps extends EntityProps {
    version?: number;
}

/**
 * Abstract Aggregate Root class
 */
export abstract class AggregateRoot<TProps extends AggregateRootProps> extends Entity<TProps> {
    private _domainEvents: DomainEvent[] = [];
    private _version: number;

    constructor(props: TProps) {
        super(props);
        this._version = props.version ?? 0;
    }

    /**
     * Get current version (for optimistic concurrency)
     */
    get version(): number {
        return this._version;
    }

    /**
     * Get pending domain events
     */
    get domainEvents(): ReadonlyArray<DomainEvent> {
        return this._domainEvents;
    }

    /**
     * Clear all domain events
     */
    clearEvents(): void {
        this._domainEvents = [];
    }

    /**
     * Add a domain event
     */
    protected addDomainEvent(event: DomainEvent): void {
        this._domainEvents.push(event);
    }

    /**
     * Increment version
     */
    protected incrementVersion(): void {
        this._version += 1;
        this._props.updatedAt = new Date();
    }
}
