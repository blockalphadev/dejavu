/**
 * Event Bus Interface
 *
 * Abstract interface for event publishing and handling.
 * Supports both synchronous (in-memory) and asynchronous (distributed) implementations.
 */

import type { DomainEvent } from '@dejavu/domain';

/**
 * Event handler interface
 */
export interface IEventHandler<T extends DomainEvent = DomainEvent> {
    /** Handler name for identification */
    readonly handlerName: string;
    /** Event type this handler processes */
    readonly eventType: string;
    /** Handle the event */
    handle(event: T): Promise<void>;
}

/**
 * Event bus interface
 */
export interface IEventBus {
    /**
     * Publish a single event
     */
    publish(event: DomainEvent): Promise<void>;

    /**
     * Publish multiple events
     */
    publishAll(events: DomainEvent[]): Promise<void>;

    /**
     * Subscribe a handler to an event type
     */
    subscribe<T extends DomainEvent>(
        eventType: string,
        handler: IEventHandler<T>,
    ): void;

    /**
     * Unsubscribe a handler
     */
    unsubscribe(handlerName: string): void;

    /**
     * Get all registered handlers
     */
    getHandlers(): IEventHandler[];

    /**
     * Check if event bus is healthy
     */
    isHealthy(): Promise<boolean>;

    /**
     * Shutdown the event bus
     */
    shutdown(): Promise<void>;
}

/**
 * Event bus configuration
 */
export interface EventBusConfig {
    /** Event bus type */
    type: 'in-memory' | 'rabbitmq';
    /** Whether to store events */
    enableEventStore?: boolean;
    /** Retry failed events */
    retryOnFailure?: boolean;
    /** Max retry attempts */
    maxRetries?: number;
    /** Retry delay in ms */
    retryDelay?: number;
}

/**
 * Default event bus configuration
 */
export const DEFAULT_EVENT_BUS_CONFIG: EventBusConfig = {
    type: 'in-memory',
    enableEventStore: false,
    retryOnFailure: true,
    maxRetries: 3,
    retryDelay: 1000,
};

/**
 * Event handler decorator metadata key
 */
export const EVENT_HANDLER_METADATA_KEY = Symbol('eventHandler');

/**
 * Create event handler from a class
 */
export function createEventHandler<T extends DomainEvent>(
    handlerName: string,
    eventType: string,
    handleFn: (event: T) => Promise<void>,
): IEventHandler<T> {
    return {
        handlerName,
        eventType,
        handle: handleFn,
    };
}

/**
 * Event handler decorator
 *
 * @example
 * ```typescript
 * @EventHandler('market.created')
 * class MarketCreatedHandler implements IEventHandler<MarketCreatedEvent> {
 *   async handle(event: MarketCreatedEvent): Promise<void> {
 *     // Handle event
 *   }
 * }
 * ```
 */
export function EventHandler(eventType: string) {
    return function <T extends new (...args: unknown[]) => IEventHandler>(constructor: T) {
        Reflect.defineMetadata(EVENT_HANDLER_METADATA_KEY, eventType, constructor);
        return constructor;
    };
}
