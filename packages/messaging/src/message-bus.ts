/**
 * Message Bus
 *
 * High-level abstraction for message publishing and consuming
 * with support for various messaging patterns.
 */

import type { ConsumeMessage } from 'amqplib';
import type { RabbitMQClient } from './rabbitmq/rabbitmq.client';
import { createRabbitMQClientFromEnv } from './rabbitmq/rabbitmq.client';
import type {
    MessageEnvelope,
    MessageHandler,
    PublishOptions,
    SubscribeOptions,
    ConsumerInfo,
    RpcResponse,
} from './messaging.types';
import { createMessageEnvelope } from './messaging.types';
import { ALL_EXCHANGES } from './exchanges';
import { ALL_QUEUES, BINDINGS } from './queues';

/**
 * Message Bus implementation
 */
export class MessageBus {
    private readonly client: RabbitMQClient;
    private readonly consumers: Map<string, ConsumerInfo> = new Map();
    private initialized: boolean = false;

    constructor(client?: RabbitMQClient) {
        this.client = client || createRabbitMQClientFromEnv();
    }

    /**
     * Initialize the message bus
     *
     * Connects to RabbitMQ and sets up all exchanges, queues, and bindings
     */
    async initialize(): Promise<void> {
        if (this.initialized) {
            return;
        }

        await this.client.connect();
        await this.client.setup(ALL_EXCHANGES, ALL_QUEUES, BINDINGS);
        this.initialized = true;
        console.log('[MessageBus] Initialized');
    }

    /**
     * Publish a message
     */
    async publish<T>(
        type: string,
        payload: T,
        options: PublishOptions,
    ): Promise<boolean> {
        if (!this.initialized) {
            await this.initialize();
        }

        const envelope = createMessageEnvelope(type, payload, {
            correlationId: options.correlationId,
            headers: options.headers,
        });

        const channel = await this.client.getChannel();
        const exchange = options.exchange || '';

        const publishOptions = {
            persistent: options.persistent ?? true,
            contentType: 'application/json',
            contentEncoding: 'utf-8',
            correlationId: envelope.correlationId,
            messageId: envelope.messageId,
            timestamp: Date.now(),
            expiration: options.expiration?.toString(),
            priority: options.priority,
            replyTo: options.replyTo,
            headers: {
                ...options.headers,
                'x-message-type': type,
            },
        };

        try {
            const result = channel.publish(
                exchange,
                options.routingKey,
                Buffer.from(JSON.stringify(envelope)),
                publishOptions,
            );

            if (!result) {
                console.warn(`[MessageBus] Channel buffer is full for: ${options.routingKey}`);
            }

            return result;
        } catch (error) {
            console.error('[MessageBus] Publish error:', error);
            throw error;
        }
    }

    /**
     * Subscribe to a queue
     */
    async subscribe<T>(
        options: SubscribeOptions,
        handler: MessageHandler<T>,
    ): Promise<string> {
        if (!this.initialized) {
            await this.initialize();
        }

        const channel = await this.client.getChannel();
        const consumerTag = options.consumerTag || `consumer-${crypto.randomUUID()}`;

        const consumerInfo: ConsumerInfo = {
            consumerTag,
            queue: options.queue,
            active: true,
            messagesProcessed: 0,
            messagesFailed: 0,
        };

        const { consumerTag: actualTag } = await channel.consume(
            options.queue,
            async (msg: ConsumeMessage | null) => {
                if (!msg) {
                    return;
                }

                try {
                    const content = msg.content.toString('utf-8');
                    const envelope = JSON.parse(content) as MessageEnvelope<T>;

                    // Update retry count from message properties
                    if (msg.properties.headers?.['x-retry-count']) {
                        envelope.retryCount = parseInt(msg.properties.headers['x-retry-count'], 10);
                    }

                    await handler(
                        envelope,
                        () => {
                            channel.ack(msg);
                            consumerInfo.messagesProcessed++;
                        },
                        (requeue = false) => {
                            channel.nack(msg, false, requeue);
                            consumerInfo.messagesFailed++;
                        },
                    );
                } catch (error) {
                    console.error('[MessageBus] Message handling error:', error);
                    channel.nack(msg, false, false);
                    consumerInfo.messagesFailed++;
                }
            },
            {
                consumerTag,
                exclusive: options.exclusive,
                noLocal: options.noLocal,
                arguments: options.arguments,
            },
        );

        this.consumers.set(actualTag, consumerInfo);
        console.log(`[MessageBus] Subscribed to queue: ${options.queue} (${actualTag})`);

        return actualTag;
    }

    /**
     * Unsubscribe a consumer
     */
    async unsubscribe(consumerTag: string): Promise<void> {
        const channel = await this.client.getChannel();
        await channel.cancel(consumerTag);

        const consumer = this.consumers.get(consumerTag);
        if (consumer) {
            consumer.active = false;
        }
        this.consumers.delete(consumerTag);

        console.log(`[MessageBus] Unsubscribed: ${consumerTag}`);
    }

    /**
     * RPC call - send request and wait for response
     */
    async rpc<TRequest, TResponse>(
        exchange: string,
        routingKey: string,
        payload: TRequest,
        timeout: number = 30000,
    ): Promise<RpcResponse<TResponse>> {
        if (!this.initialized) {
            await this.initialize();
        }

        const channel = await this.client.getChannel();
        const correlationId = crypto.randomUUID();

        // Create exclusive reply queue
        const { queue: replyQueue } = await channel.assertQueue('', {
            exclusive: true,
            autoDelete: true,
        });

        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                cleanup();
                resolve({
                    success: false,
                    error: 'RPC timeout',
                });
            }, timeout);

            const cleanup = async () => {
                clearTimeout(timer);
                try {
                    await channel.deleteQueue(replyQueue);
                } catch {
                    // Queue might already be deleted
                }
            };

            // Setup response consumer
            channel.consume(
                replyQueue,
                async (msg) => {
                    if (!msg) return;

                    if (msg.properties.correlationId === correlationId) {
                        cleanup();

                        try {
                            const content = JSON.parse(msg.content.toString('utf-8'));
                            channel.ack(msg);
                            resolve({
                                success: true,
                                data: content as TResponse,
                            });
                        } catch (error) {
                            channel.nack(msg, false, false);
                            resolve({
                                success: false,
                                error: 'Failed to parse response',
                            });
                        }
                    }
                },
                { noAck: false },
            ).catch(reject);

            // Send request
            const envelope = createMessageEnvelope('rpc.request', payload, {
                correlationId,
            });

            channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(envelope)), {
                correlationId,
                replyTo: replyQueue,
                expiration: timeout.toString(),
                persistent: false,
            });
        });
    }

    /**
     * Get all active consumers
     */
    getConsumers(): ConsumerInfo[] {
        return Array.from(this.consumers.values());
    }

    /**
     * Get consumer by tag
     */
    getConsumer(consumerTag: string): ConsumerInfo | undefined {
        return this.consumers.get(consumerTag);
    }

    /**
     * Shutdown the message bus
     */
    async shutdown(): Promise<void> {
        // Cancel all consumers
        for (const consumerTag of this.consumers.keys()) {
            await this.unsubscribe(consumerTag);
        }

        await this.client.disconnect();
        this.initialized = false;
        console.log('[MessageBus] Shutdown complete');
    }

    /**
     * Health check
     */
    async isHealthy(): Promise<boolean> {
        return this.client.isHealthy();
    }
}

/**
 * Create a message bus instance
 */
export function createMessageBus(client?: RabbitMQClient): MessageBus {
    return new MessageBus(client);
}

// Singleton instance
let defaultMessageBus: MessageBus | null = null;

/**
 * Get or create the default message bus
 */
export function getDefaultMessageBus(): MessageBus {
    if (!defaultMessageBus) {
        defaultMessageBus = createMessageBus();
    }
    return defaultMessageBus;
}

/**
 * Close the default message bus
 */
export async function closeDefaultMessageBus(): Promise<void> {
    if (defaultMessageBus) {
        await defaultMessageBus.shutdown();
        defaultMessageBus = null;
    }
}
