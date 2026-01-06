/**
 * RabbitMQ Event Bus
 *
 * Distributed event bus implementation using RabbitMQ.
 * Suitable for production environments with multiple service instances.
 */

import type { DomainEvent } from '@dejavu/domain';
import type { MessageBus, MessageEnvelope } from '@dejavu/messaging';
import { createMessageBus, DOMAIN_EVENTS_EXCHANGE } from '@dejavu/messaging';
import type { IEventBus, IEventHandler, EventBusConfig } from './event-bus.interface';
import { DEFAULT_EVENT_BUS_CONFIG } from './event-bus.interface';

/**
 * RabbitMQ Event Bus implementation
 */
export class RabbitMQEventBus implements IEventBus {
    private readonly messageBus: MessageBus;
    private readonly config: EventBusConfig;
    private readonly handlers: Map<string, IEventHandler[]> = new Map();
    private readonly handlersByName: Map<string, IEventHandler> = new Map();
    private readonly consumerTags: Map<string, string> = new Map();
    private initialized: boolean = false;

    constructor(messageBus?: MessageBus, config?: Partial<EventBusConfig>) {
        this.messageBus = messageBus || createMessageBus();
        this.config = { ...DEFAULT_EVENT_BUS_CONFIG, ...config, type: 'rabbitmq' };
    }

    /**
     * Initialize the event bus
     */
    async initialize(): Promise<void> {
        if (this.initialized) {
            return;
        }

        await this.messageBus.initialize();
        this.initialized = true;
        console.log('[RabbitMQEventBus] Initialized');
    }

    /**
     * Publish a single event
     */
    async publish(event: DomainEvent): Promise<void> {
        if (!this.initialized) {
            await this.initialize();
        }

        const eventData = event.toJSON();

        await this.messageBus.publish(
            event.eventType,
            eventData,
            {
                exchange: DOMAIN_EVENTS_EXCHANGE.name,
                routingKey: event.eventKey,
                persistent: true,
                correlationId: event.metadata.correlationId,
                headers: {
                    'x-event-id': event.eventId,
                    'x-aggregate-type': event.aggregateType,
                    'x-aggregate-id': event.aggregateId,
                },
            },
        );

        console.debug(`[RabbitMQEventBus] Published: ${event.eventKey}`);
    }

    /**
     * Publish multiple events
     */
    async publishAll(events: DomainEvent[]): Promise<void> {
        // Publish events in parallel for better performance
        await Promise.all(events.map((event) => this.publish(event)));
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

        console.log(`[RabbitMQEventBus] Handler ${handler.handlerName} registered for: ${eventType}`);

        // Note: Actual subscription to RabbitMQ queue happens when startConsuming is called
    }

    /**
     * Start consuming events from a queue
     */
    async startConsuming(queueName: string): Promise<void> {
        if (!this.initialized) {
            await this.initialize();
        }

        const consumerTag = await this.messageBus.subscribe(
            { queue: queueName },
            async (message: MessageEnvelope, ack, nack) => {
                const eventData = message.payload as Record<string, unknown>;
                const eventType = eventData['eventType'] as string;
                const eventKey = `${eventData['aggregateType']}.${eventType}`;

                // Get handlers for this event
                const handlers = this.handlers.get(eventKey) || [];
                const wildcardHandlers = this.handlers.get('*') || [];
                const allHandlers = [...handlers, ...wildcardHandlers];

                if (allHandlers.length === 0) {
                    console.debug(`[RabbitMQEventBus] No handlers for: ${eventKey}`);
                    ack();
                    return;
                }

                try {
                    // Execute handlers
                    await Promise.all(
                        allHandlers.map((handler) =>
                            this.executeHandler(handler, eventData, message.retryCount || 0),
                        ),
                    );
                    ack();
                } catch (error) {
                    console.error(`[RabbitMQEventBus] Handler failed for ${eventKey}:`, error);

                    // Check if should retry
                    const retryCount = message.retryCount || 0;
                    const maxRetries = this.config.maxRetries || 3;

                    if (this.config.retryOnFailure && retryCount < maxRetries) {
                        nack(true); // Requeue for retry
                    } else {
                        nack(false); // Send to dead letter queue
                    }
                }
            },
        );

        this.consumerTags.set(queueName, consumerTag);
        console.log(`[RabbitMQEventBus] Consuming from: ${queueName}`);
    }

    /**
     * Stop consuming from a queue
     */
    async stopConsuming(queueName: string): Promise<void> {
        const consumerTag = this.consumerTags.get(queueName);
        if (consumerTag) {
            await this.messageBus.unsubscribe(consumerTag);
            this.consumerTags.delete(queueName);
            console.log(`[RabbitMQEventBus] Stopped consuming from: ${queueName}`);
        }
    }

    /**
     * Execute a handler
     */
    private async executeHandler(
        handler: IEventHandler,
        eventData: Record<string, unknown>,
        retryCount: number,
    ): Promise<void> {
        // Reconstruct a minimal event-like object for the handler
        const event = {
            ...eventData,
            eventId: eventData['eventId'],
            eventType: eventData['eventType'],
            aggregateId: eventData['aggregateId'],
            aggregateType: eventData['aggregateType'],
            occurredOn: new Date(eventData['occurredOn'] as string),
            metadata: eventData['metadata'],
            retryCount,
        } as unknown as DomainEvent;

        await handler.handle(event);
    }

    /**
     * Unsubscribe a handler
     */
    unsubscribe(handlerName: string): void {
        const handler = this.handlersByName.get(handlerName);
        if (!handler) {
            return;
        }

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
        console.log(`[RabbitMQEventBus] Handler ${handlerName} unsubscribed`);
    }

    /**
     * Get all registered handlers
     */
    getHandlers(): IEventHandler[] {
        return Array.from(this.handlersByName.values());
    }

    /**
     * Health check
     */
    async isHealthy(): Promise<boolean> {
        return this.messageBus.isHealthy();
    }

    /**
     * Shutdown
     */
    async shutdown(): Promise<void> {
        // Stop all consumers
        for (const queueName of this.consumerTags.keys()) {
            await this.stopConsuming(queueName);
        }

        this.handlers.clear();
        this.handlersByName.clear();
        await this.messageBus.shutdown();
        this.initialized = false;

        console.log('[RabbitMQEventBus] Shutdown complete');
    }
}

/**
 * Create a RabbitMQ event bus
 */
export function createRabbitMQEventBus(
    messageBus?: MessageBus,
    config?: Partial<EventBusConfig>,
): RabbitMQEventBus {
    return new RabbitMQEventBus(messageBus, config);
}
