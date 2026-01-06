/**
 * Messaging Types
 *
 * Type definitions for the messaging layer.
 */

/**
 * Message envelope with metadata
 */
export interface MessageEnvelope<T = unknown> {
    /** Unique message ID */
    messageId: string;
    /** Message type/name */
    type: string;
    /** Message payload */
    payload: T;
    /** Correlation ID for tracking related messages */
    correlationId?: string;
    /** Causation ID (ID of message that caused this one) */
    causationId?: string;
    /** Timestamp when message was created */
    timestamp: string;
    /** Message headers */
    headers?: Record<string, string>;
    /** Retry count */
    retryCount?: number;
}

/**
 * Message handler function
 */
export type MessageHandler<T = unknown> = (
    message: MessageEnvelope<T>,
    ack: () => void,
    nack: (requeue?: boolean) => void,
) => Promise<void>;

/**
 * Publish options
 */
export interface PublishOptions {
    /** Exchange to publish to */
    exchange?: string;
    /** Routing key */
    routingKey: string;
    /** Message persistence */
    persistent?: boolean;
    /** Message expiration in ms */
    expiration?: number;
    /** Message priority (0-9) */
    priority?: number;
    /** Correlation ID */
    correlationId?: string;
    /** Reply-to queue for RPC */
    replyTo?: string;
    /** Custom headers */
    headers?: Record<string, string>;
}

/**
 * Subscribe options
 */
export interface SubscribeOptions {
    /** Queue name */
    queue: string;
    /** Consumer tag for identification */
    consumerTag?: string;
    /** Exclusive consumer */
    exclusive?: boolean;
    /** No local messages */
    noLocal?: boolean;
    /** Arguments for consumer */
    arguments?: Record<string, unknown>;
}

/**
 * Exchange configuration
 */
export interface ExchangeConfig {
    /** Exchange name */
    name: string;
    /** Exchange type */
    type: 'direct' | 'topic' | 'fanout' | 'headers';
    /** Durable exchange */
    durable?: boolean;
    /** Auto-delete when unused */
    autoDelete?: boolean;
    /** Internal exchange */
    internal?: boolean;
    /** Alternate exchange for unroutable messages */
    alternateExchange?: string;
}

/**
 * Queue configuration
 */
export interface QueueConfig {
    /** Queue name */
    name: string;
    /** Durable queue */
    durable?: boolean;
    /** Exclusive to connection */
    exclusive?: boolean;
    /** Auto-delete when unused */
    autoDelete?: boolean;
    /** Dead letter exchange */
    deadLetterExchange?: string;
    /** Dead letter routing key */
    deadLetterRoutingKey?: string;
    /** Message TTL in ms */
    messageTtl?: number;
    /** Max queue length */
    maxLength?: number;
    /** Max priority (enables priority queue) */
    maxPriority?: number;
}

/**
 * Binding configuration
 */
export interface BindingConfig {
    /** Source exchange */
    exchange: string;
    /** Target queue */
    queue: string;
    /** Routing key pattern */
    routingKey: string;
    /** Binding arguments */
    arguments?: Record<string, unknown>;
}

/**
 * RPC response
 */
export interface RpcResponse<T = unknown> {
    /** Success flag */
    success: boolean;
    /** Response data */
    data?: T;
    /** Error message if failed */
    error?: string;
}

/**
 * Consumer info
 */
export interface ConsumerInfo {
    /** Consumer tag */
    consumerTag: string;
    /** Queue name */
    queue: string;
    /** Whether consumer is active */
    active: boolean;
    /** Messages processed */
    messagesProcessed: number;
    /** Messages failed */
    messagesFailed: number;
}

/**
 * Create a message envelope
 */
export function createMessageEnvelope<T>(
    type: string,
    payload: T,
    options?: Partial<MessageEnvelope<T>>,
): MessageEnvelope<T> {
    return {
        messageId: crypto.randomUUID(),
        type,
        payload,
        timestamp: new Date().toISOString(),
        ...options,
    };
}
