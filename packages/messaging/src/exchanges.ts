/**
 * Exchange Definitions
 *
 * Predefined exchanges for the DeJaVu platform.
 */

import type { ExchangeConfig } from './messaging.types';

/**
 * Domain events exchange
 *
 * Used for publishing domain events (topic exchange for flexible routing)
 */
export const DOMAIN_EVENTS_EXCHANGE: ExchangeConfig = {
    name: 'dejavu.domain.events',
    type: 'topic',
    durable: true,
    autoDelete: false,
};

/**
 * Commands exchange
 *
 * Used for async command processing (direct exchange for point-to-point)
 */
export const COMMANDS_EXCHANGE: ExchangeConfig = {
    name: 'dejavu.commands',
    type: 'direct',
    durable: true,
    autoDelete: false,
};

/**
 * Notifications exchange
 *
 * Used for user notifications (fanout for broadcasting)
 */
export const NOTIFICATIONS_EXCHANGE: ExchangeConfig = {
    name: 'dejavu.notifications',
    type: 'fanout',
    durable: true,
    autoDelete: false,
};

/**
 * Dead letter exchange
 *
 * Used for failed messages
 */
export const DEAD_LETTER_EXCHANGE: ExchangeConfig = {
    name: 'dejavu.dlx',
    type: 'direct',
    durable: true,
    autoDelete: false,
};

/**
 * Delayed exchange (for scheduled messages)
 *
 * Note: Requires rabbitmq_delayed_message_exchange plugin
 */
export const DELAYED_EXCHANGE: ExchangeConfig = {
    name: 'dejavu.delayed',
    type: 'direct', // Will be 'x-delayed-message' with plugin
    durable: true,
    autoDelete: false,
};

/**
 * All exchanges to be declared
 */
export const ALL_EXCHANGES: ExchangeConfig[] = [
    DOMAIN_EVENTS_EXCHANGE,
    COMMANDS_EXCHANGE,
    NOTIFICATIONS_EXCHANGE,
    DEAD_LETTER_EXCHANGE,
];

/**
 * Routing key patterns for domain events
 */
export const ROUTING_KEYS = {
    // Market events
    MARKET_CREATED: 'market.created',
    MARKET_UPDATED: 'market.updated',
    MARKET_RESOLVED: 'market.resolved',
    MARKET_STATUS_CHANGED: 'market.status_changed',

    // Order events
    ORDER_PLACED: 'order.placed',
    ORDER_MATCHED: 'order.matched',
    ORDER_CANCELLED: 'order.cancelled',
    ORDER_FILLED: 'order.filled',

    // Trade events
    TRADE_EXECUTED: 'trade.executed',
    TRADE_SETTLED: 'trade.settled',

    // User events
    USER_REGISTERED: 'user.registered',
    USER_UPDATED: 'user.updated',
    USER_WALLET_CONNECTED: 'user.wallet_connected',

    // Liquidity events
    LIQUIDITY_ADDED: 'liquidity.added',
    LIQUIDITY_REMOVED: 'liquidity.removed',

    // Blockchain events
    BLOCKCHAIN_TX_SUBMITTED: 'blockchain.tx_submitted',
    BLOCKCHAIN_TX_CONFIRMED: 'blockchain.tx_confirmed',
    BLOCKCHAIN_TX_FAILED: 'blockchain.tx_failed',

    // Wildcard patterns
    ALL_MARKET_EVENTS: 'market.*',
    ALL_ORDER_EVENTS: 'order.*',
    ALL_TRADE_EVENTS: 'trade.*',
    ALL_USER_EVENTS: 'user.*',
    ALL_EVENTS: '#',
} as const;
