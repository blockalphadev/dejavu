/**
 * Event Dispatcher
 *
 * Utility for dispatching domain events from aggregates after
 * they are persisted. Ensures events are published only after
 * successful persistence.
 */

import type { DomainEvent } from '@dejavu/domain';
import type { IEventBus } from './event-bus.interface';

/**
 * Event dispatcher for handling aggregate events
 */
export class EventDispatcher {
    private readonly eventBus: IEventBus;
    private readonly pendingEvents: Map<string, DomainEvent[]> = new Map();

    constructor(eventBus: IEventBus) {
        this.eventBus = eventBus;
    }

    /**
     * Register events from an aggregate for later dispatch
     *
     * @param aggregateId - The aggregate's unique identifier
     * @param events - Domain events to dispatch
     */
    registerEvents(aggregateId: string, events: DomainEvent[]): void {
        if (events.length === 0) {
            return;
        }

        const existing = this.pendingEvents.get(aggregateId) || [];
        this.pendingEvents.set(aggregateId, [...existing, ...events]);
    }

    /**
     * Dispatch events for an aggregate after successful persistence
     *
     * @param aggregateId - The aggregate's unique identifier
     */
    async dispatchEvents(aggregateId: string): Promise<void> {
        const events = this.pendingEvents.get(aggregateId);
        if (!events || events.length === 0) {
            return;
        }

        try {
            await this.eventBus.publishAll(events);
            this.pendingEvents.delete(aggregateId);
        } catch (error) {
            console.error(`[EventDispatcher] Failed to dispatch events for ${aggregateId}:`, error);
            throw error;
        }
    }

    /**
     * Clear pending events for an aggregate (e.g., on rollback)
     *
     * @param aggregateId - The aggregate's unique identifier
     */
    clearEvents(aggregateId: string): void {
        this.pendingEvents.delete(aggregateId);
    }

    /**
     * Clear all pending events
     */
    clearAllEvents(): void {
        this.pendingEvents.clear();
    }

    /**
     * Get pending events for an aggregate
     */
    getPendingEvents(aggregateId: string): DomainEvent[] {
        return this.pendingEvents.get(aggregateId) || [];
    }

    /**
     * Get total pending events count
     */
    getPendingCount(): number {
        let count = 0;
        for (const events of this.pendingEvents.values()) {
            count += events.length;
        }
        return count;
    }
}

/**
 * Create an event dispatcher
 */
export function createEventDispatcher(eventBus: IEventBus): EventDispatcher {
    return new EventDispatcher(eventBus);
}

/**
 * Unit of work integration for event dispatching
 *
 * Wraps a unit of work operation to automatically dispatch
 * events after successful commit.
 */
export async function withEventDispatch<T>(
    dispatcher: EventDispatcher,
    aggregateId: string,
    events: DomainEvent[],
    operation: () => Promise<T>,
): Promise<T> {
    dispatcher.registerEvents(aggregateId, events);

    try {
        const result = await operation();
        await dispatcher.dispatchEvents(aggregateId);
        return result;
    } catch (error) {
        dispatcher.clearEvents(aggregateId);
        throw error;
    }
}
