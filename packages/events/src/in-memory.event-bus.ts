/**
 * In-Memory Event Bus
 *
 * Simple event bus implementation for development and testing.
 * Events are processed synchronously within the same process.
 */

import type { DomainEvent } from '@dejavu/domain';
import type { IEventBus, IEventHandler, EventBusConfig } from './event-bus.interface';
import { DEFAULT_EVENT_BUS_CONFIG } from './event-bus.interface';

/**
 * In-Memory Event Bus implementation
 */
export class InMemoryEventBus implements IEventBus {
    private readonly handlers: Map<string, IEventHandler[]> = new Map();
    private readonly handlersByName: Map<string, IEventHandler> = new Map();
    private readonly config: EventBusConfig;
    private eventHistory: DomainEvent[] = [];
    private readonly maxHistorySize: number = 1000;

    constructor(config?: Partial<EventBusConfig>) {
        this.config = { ...DEFAULT_EVENT_BUS_CONFIG, ...config, type: 'in-memory' };
    }

    /**
     * Publish a single event
     */
    async publish(event: DomainEvent): Promise<void> {
        // Store in history if enabled
        if (this.config.enableEventStore) {
            this.storeEvent(event);
        }

        // Get handlers for this event type
        const eventKey = event.eventKey;
        const handlers = this.handlers.get(eventKey) || [];
        const wildcardHandlers = this.handlers.get('*') || [];

        const allHandlers = [...handlers, ...wildcardHandlers];

        if (allHandlers.length === 0) {
            console.debug(`[EventBus] No handlers for event: ${eventKey}`);
            return;
        }

        // Execute all handlers
        const results = await Promise.allSettled(
            allHandlers.map((handler) => this.executeHandler(handler, event)),
        );

        // Log any failures
        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            if (result.status === 'rejected') {
                console.error(
                    `[EventBus] Handler ${allHandlers[i].handlerName} failed:`,
                    result.reason,
                );
            }
        }
    }

    /**
     * Publish multiple events
     */
    async publishAll(events: DomainEvent[]): Promise<void> {
        // Publish events sequentially to maintain order
        for (const event of events) {
            await this.publish(event);
        }
    }

    /**
     * Execute a handler with retry logic
     */
    private async executeHandler(
        handler: IEventHandler,
        event: DomainEvent,
    ): Promise<void> {
        let lastError: Error | undefined;
        const maxAttempts = this.config.retryOnFailure ? (this.config.maxRetries || 3) : 1;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                await handler.handle(event);
                return;
            } catch (error) {
                lastError = error as Error;
                console.warn(
                    `[EventBus] Handler ${handler.handlerName} failed (attempt ${attempt}/${maxAttempts}):`,
                    error,
                );

                if (attempt < maxAttempts) {
                    await this.sleep(this.config.retryDelay || 1000);
                }
            }
        }

        throw lastError;
    }

    /**
     * Subscribe a handler to an event type
     */
    subscribe<T extends DomainEvent>(
        eventType: string,
        handler: IEventHandler<T>,
    ): void {
        if (!this.handlers.has(eventType)) {
            this.handlers.set(eventType, []);
        }

        this.handlers.get(eventType)!.push(handler as IEventHandler);
        this.handlersByName.set(handler.handlerName, handler as IEventHandler);

        console.log(`[EventBus] Handler ${handler.handlerName} subscribed to: ${eventType}`);
    }

    /**
     * Unsubscribe a handler
     */
    unsubscribe(handlerName: string): void {
        const handler = this.handlersByName.get(handlerName);
        if (!handler) {
            return;
        }

        // Remove from event type handlers
        for (const [eventType, handlers] of this.handlers.entries()) {
            const index = handlers.findIndex((h) => h.handlerName === handlerName);
            if (index !== -1) {
                handlers.splice(index, 1);
                if (handlers.length === 0) {
                    this.handlers.delete(eventType);
                }
            }
        }

        this.handlersByName.delete(handlerName);
        console.log(`[EventBus] Handler ${handlerName} unsubscribed`);
    }

    /**
     * Get all registered handlers
     */
    getHandlers(): IEventHandler[] {
        return Array.from(this.handlersByName.values());
    }

    /**
     * Store event in history
     */
    private storeEvent(event: DomainEvent): void {
        this.eventHistory.push(event);

        // Trim history if too large
        if (this.eventHistory.length > this.maxHistorySize) {
            this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
        }
    }

    /**
     * Get event history (for testing/debugging)
     */
    getEventHistory(): DomainEvent[] {
        return [...this.eventHistory];
    }

    /**
     * Clear event history
     */
    clearEventHistory(): void {
        this.eventHistory = [];
    }

    /**
     * Health check
     */
    async isHealthy(): Promise<boolean> {
        return true; // In-memory is always healthy
    }

    /**
     * Shutdown
     */
    async shutdown(): Promise<void> {
        this.handlers.clear();
        this.handlersByName.clear();
        this.eventHistory = [];
        console.log('[EventBus] In-memory event bus shutdown');
    }

    /**
     * Sleep utility
     */
    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}

/**
 * Create an in-memory event bus
 */
export function createInMemoryEventBus(config?: Partial<EventBusConfig>): InMemoryEventBus {
    return new InMemoryEventBus(config);
}
