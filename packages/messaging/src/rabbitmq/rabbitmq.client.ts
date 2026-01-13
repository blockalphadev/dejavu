/**
 * RabbitMQ Client
 *
 * Connection management for RabbitMQ with automatic reconnection,
 * channel pooling, and health monitoring.
 */

import amqp from 'amqplib';
import type { ChannelModel, Channel } from 'amqplib';
import type { RabbitMQConfig } from '../messaging.config';
import { DEFAULT_RABBITMQ_CONFIG, createRabbitMQUrl } from '../messaging.config';
import type { ExchangeConfig, QueueConfig, BindingConfig } from '../messaging.types';

/**
 * RabbitMQ client wrapper with enhanced functionality
 */
export class RabbitMQClient {
    private connection: ChannelModel | null = null;
    private channel: Channel | null = null;
    private readonly config: RabbitMQConfig;
    private reconnectAttempts: number = 0;
    private readonly maxReconnectAttempts: number = 10;
    private isConnecting: boolean = false;
    private isShuttingDown: boolean = false;

    constructor(config: Partial<RabbitMQConfig> = {}) {
        this.config = { ...DEFAULT_RABBITMQ_CONFIG, ...config };
    }

    /**
     * Connect to RabbitMQ
     */
    async connect(): Promise<void> {
        if (this.connection || this.isConnecting) {
            return;
        }

        this.isConnecting = true;

        try {
            const url = createRabbitMQUrl(this.config);
            const socketOptions = {
                timeout: this.config.connectionTimeout,
            };

            this.connection = await amqp.connect(url, socketOptions);
            console.log('[RabbitMQ] Connected');

            // Setup connection event handlers
            this.connection.on('error', (error: Error) => {
                console.error('[RabbitMQ] Connection error:', error.message);
            });

            this.connection.on('close', () => {
                console.log('[RabbitMQ] Connection closed');
                this.connection = null;
                this.channel = null;
                if (!this.isShuttingDown) {
                    this.scheduleReconnect();
                }
            });

            // Create initial channel
            await this.createChannel();
            this.reconnectAttempts = 0;
        } catch (error) {
            console.error('[RabbitMQ] Failed to connect:', error);
            this.connection = null;
            throw error;
        } finally {
            this.isConnecting = false;
        }
    }

    /**
     * Schedule reconnection
     */
    private scheduleReconnect(): void {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('[RabbitMQ] Max reconnection attempts reached');
            return;
        }

        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
        this.reconnectAttempts++;

        console.log(`[RabbitMQ] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

        setTimeout(async () => {
            try {
                await this.connect();
            } catch (error) {
                console.error('[RabbitMQ] Reconnection failed:', error);
            }
        }, delay);
    }

    /**
     * Create a channel
     */
    async createChannel(): Promise<Channel> {
        if (!this.connection) {
            throw new Error('Not connected to RabbitMQ');
        }

        const channel = await this.connection.createChannel();
        this.channel = channel;
        console.log('[RabbitMQ] Channel created');

        // Set prefetch
        await channel.prefetch(this.config.prefetchCount || 10);

        // Channel error handling
        channel.on('error', (error: Error) => {
            console.error('[RabbitMQ] Channel error:', error.message);
        });

        channel.on('close', () => {
            console.log('[RabbitMQ] Channel closed');
            this.channel = null;
        });

        return channel;
    }

    /**
     * Get or create channel
     */
    async getChannel(): Promise<Channel> {
        if (!this.channel) {
            if (!this.connection) {
                await this.connect();
            }
            await this.createChannel();
        }
        return this.channel!;
    }

    /**
     * Disconnect from RabbitMQ
     */
    async disconnect(): Promise<void> {
        this.isShuttingDown = true;

        if (this.channel) {
            try {
                await this.channel.close();
            } catch (error) {
                console.error('[RabbitMQ] Error closing channel:', error);
            }
            this.channel = null;
        }

        if (this.connection) {
            try {
                await this.connection.close();
            } catch (error) {
                console.error('[RabbitMQ] Error closing connection:', error);
            }
            this.connection = null;
        }

        console.log('[RabbitMQ] Disconnected');
    }

    /**
     * Check if connected
     */
    get connected(): boolean {
        return this.connection !== null && this.channel !== null;
    }

    /**
     * Declare an exchange
     */
    async declareExchange(config: ExchangeConfig): Promise<void> {
        const channel = await this.getChannel();

        await channel.assertExchange(config.name, config.type, {
            durable: config.durable ?? true,
            autoDelete: config.autoDelete ?? false,
            internal: config.internal ?? false,
            alternateExchange: config.alternateExchange,
        });

        console.log(`[RabbitMQ] Exchange declared: ${config.name}`);
    }

    /**
     * Declare a queue
     */
    async declareQueue(config: QueueConfig): Promise<void> {
        const channel = await this.getChannel();

        const args: Record<string, unknown> = {};
        if (config.deadLetterExchange) {
            args['x-dead-letter-exchange'] = config.deadLetterExchange;
        }
        if (config.deadLetterRoutingKey) {
            args['x-dead-letter-routing-key'] = config.deadLetterRoutingKey;
        }
        if (config.messageTtl) {
            args['x-message-ttl'] = config.messageTtl;
        }
        if (config.maxLength) {
            args['x-max-length'] = config.maxLength;
        }
        if (config.maxPriority) {
            args['x-max-priority'] = config.maxPriority;
        }

        await channel.assertQueue(config.name, {
            durable: config.durable ?? true,
            exclusive: config.exclusive ?? false,
            autoDelete: config.autoDelete ?? false,
            arguments: Object.keys(args).length > 0 ? args : undefined,
        });

        console.log(`[RabbitMQ] Queue declared: ${config.name}`);
    }

    /**
     * Bind queue to exchange
     */
    async bindQueue(binding: BindingConfig): Promise<void> {
        const channel = await this.getChannel();

        await channel.bindQueue(
            binding.queue,
            binding.exchange,
            binding.routingKey,
            binding.arguments,
        );

        console.log(`[RabbitMQ] Queue bound: ${binding.queue} -> ${binding.exchange} (${binding.routingKey})`);
    }

    /**
     * Setup all exchanges, queues, and bindings
     */
    async setup(
        exchanges: ExchangeConfig[],
        queues: QueueConfig[],
        bindings: BindingConfig[],
    ): Promise<void> {
        // Declare exchanges
        for (const exchange of exchanges) {
            await this.declareExchange(exchange);
        }

        // Declare queues
        for (const queue of queues) {
            await this.declareQueue(queue);
        }

        // Bind queues
        for (const binding of bindings) {
            await this.bindQueue(binding);
        }

        console.log('[RabbitMQ] Setup complete');
    }

    /**
     * Health check
     */
    async isHealthy(): Promise<boolean> {
        if (!this.connected) {
            return false;
        }

        try {
            const channel = await this.getChannel();
            // Check if channel is still valid by checking a queue
            await channel.checkQueue('amq.rabbitmq.reply-to');
            return true;
        } catch {
            return false;
        }
    }
}

/**
 * Create a RabbitMQ client instance
 */
export function createRabbitMQClient(config?: Partial<RabbitMQConfig>): RabbitMQClient {
    return new RabbitMQClient(config);
}

/**
 * Create RabbitMQ client from environment variables
 */
export function createRabbitMQClientFromEnv(): RabbitMQClient {
    return new RabbitMQClient({
        host: process.env.RABBITMQ_HOST,
        port: process.env.RABBITMQ_PORT ? parseInt(process.env.RABBITMQ_PORT, 10) : undefined,
        username: process.env.RABBITMQ_USER,
        password: process.env.RABBITMQ_PASSWORD,
        vhost: process.env.RABBITMQ_VHOST,
        tls: process.env.RABBITMQ_TLS === 'true',
    });
}

// Singleton instance
let defaultClient: RabbitMQClient | null = null;

/**
 * Get or create the default RabbitMQ client
 */
export function getDefaultRabbitMQClient(): RabbitMQClient {
    if (!defaultClient) {
        defaultClient = createRabbitMQClientFromEnv();
    }
    return defaultClient;
}

/**
 * Close the default RabbitMQ client
 */
export async function closeDefaultRabbitMQClient(): Promise<void> {
    if (defaultClient) {
        await defaultClient.disconnect();
        defaultClient = null;
    }
}
