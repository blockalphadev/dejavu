/**
 * Queue Definitions
 *
 * Predefined queues for the DeJaVu platform.
 */

import type { QueueConfig, BindingConfig } from './messaging.types';
import {
    DOMAIN_EVENTS_EXCHANGE,
    COMMANDS_EXCHANGE,
    DEAD_LETTER_EXCHANGE,
    ROUTING_KEYS,
} from './exchanges';

/**
 * Market events processor queue
 */
export const MARKET_EVENTS_QUEUE: QueueConfig = {
    name: 'dejavu.market.events',
    durable: true,
    deadLetterExchange: DEAD_LETTER_EXCHANGE.name,
    deadLetterRoutingKey: 'dlq.market.events',
    maxLength: 10000,
};

/**
 * Order events processor queue
 */
export const ORDER_EVENTS_QUEUE: QueueConfig = {
    name: 'dejavu.order.events',
    durable: true,
    deadLetterExchange: DEAD_LETTER_EXCHANGE.name,
    deadLetterRoutingKey: 'dlq.order.events',
    maxLength: 50000,
    maxPriority: 10, // Enable priority queue for orders
};

/**
 * Trade settlement queue
 */
export const TRADE_SETTLEMENT_QUEUE: QueueConfig = {
    name: 'dejavu.trade.settlement',
    durable: true,
    deadLetterExchange: DEAD_LETTER_EXCHANGE.name,
    deadLetterRoutingKey: 'dlq.trade.settlement',
};

/**
 * Notification processor queue
 */
export const NOTIFICATION_QUEUE: QueueConfig = {
    name: 'dejavu.notifications',
    durable: true,
    messageTtl: 86400000, // 24 hours
    maxLength: 100000,
};

/**
 * Blockchain transaction queue
 */
export const BLOCKCHAIN_TX_QUEUE: QueueConfig = {
    name: 'dejavu.blockchain.tx',
    durable: true,
    deadLetterExchange: DEAD_LETTER_EXCHANGE.name,
    deadLetterRoutingKey: 'dlq.blockchain.tx',
    maxPriority: 5,
};

/**
 * Analytics events queue
 */
export const ANALYTICS_QUEUE: QueueConfig = {
    name: 'dejavu.analytics',
    durable: true,
    messageTtl: 3600000, // 1 hour
    maxLength: 100000,
};

/**
 * Dead letter queues
 */
export const DLQ_MARKET: QueueConfig = {
    name: 'dejavu.dlq.market',
    durable: true,
    messageTtl: 604800000, // 7 days
};

export const DLQ_ORDER: QueueConfig = {
    name: 'dejavu.dlq.order',
    durable: true,
    messageTtl: 604800000,
};

export const DLQ_TRADE: QueueConfig = {
    name: 'dejavu.dlq.trade',
    durable: true,
    messageTtl: 604800000,
};

export const DLQ_BLOCKCHAIN: QueueConfig = {
    name: 'dejavu.dlq.blockchain',
    durable: true,
    messageTtl: 604800000,
};

/**
 * Sports events queue
 */
export const SPORTS_EVENTS_QUEUE: QueueConfig = {
    name: 'dejavu.sports.events',
    durable: true,
    deadLetterExchange: DEAD_LETTER_EXCHANGE.name,
    deadLetterRoutingKey: 'dlq.sports.events',
    maxLength: 50000,
};

/**
 * Sports live updates queue
 */
export const SPORTS_LIVE_QUEUE: QueueConfig = {
    name: 'dejavu.sports.live',
    durable: true,
    messageTtl: 300000, // 5 minutes - live data expires quickly
    maxLength: 10000,
    maxPriority: 10, // High priority for live updates
};

/**
 * Sports market updates queue
 */
export const SPORTS_MARKET_QUEUE: QueueConfig = {
    name: 'dejavu.sports.markets',
    durable: true,
    deadLetterExchange: DEAD_LETTER_EXCHANGE.name,
    deadLetterRoutingKey: 'dlq.sports.markets',
    maxLength: 25000,
};

/**
 * Sports market resolution queue
 */
export const SPORTS_RESOLUTION_QUEUE: QueueConfig = {
    name: 'dejavu.sports.resolution',
    durable: true,
    deadLetterExchange: DEAD_LETTER_EXCHANGE.name,
    deadLetterRoutingKey: 'dlq.sports.resolution',
};

/**
 * Sports sync tasks queue
 */
export const SPORTS_SYNC_QUEUE: QueueConfig = {
    name: 'dejavu.sports.sync',
    durable: true,
    deadLetterExchange: DEAD_LETTER_EXCHANGE.name,
    deadLetterRoutingKey: 'dlq.sports.sync',
    maxLength: 1000,
    maxPriority: 5,
};

/**
 * Sports odds updates queue
 */
export const SPORTS_ODDS_QUEUE: QueueConfig = {
    name: 'dejavu.sports.odds',
    durable: true,
    messageTtl: 60000, // 1 minute - odds change frequently
    maxLength: 50000,
};

/**
 * Sports dead letter queue
 */
export const DLQ_SPORTS: QueueConfig = {
    name: 'dejavu.dlq.sports',
    durable: true,
    messageTtl: 604800000, // 7 days
};

/**
 * Sports markets dead letter queue
 */
export const DLQ_SPORTS_MARKETS: QueueConfig = {
    name: 'dejavu.dlq.sports.markets',
    durable: true,
    messageTtl: 604800000,
};

/**
 * Sports sync dead letter queue
 */
export const DLQ_SPORTS_SYNC: QueueConfig = {
    name: 'dejavu.dlq.sports.sync',
    durable: true,
    messageTtl: 604800000,
};

/**
 * All queues to be declared
 */
export const ALL_QUEUES: QueueConfig[] = [
    MARKET_EVENTS_QUEUE,
    ORDER_EVENTS_QUEUE,
    TRADE_SETTLEMENT_QUEUE,
    NOTIFICATION_QUEUE,
    BLOCKCHAIN_TX_QUEUE,
    ANALYTICS_QUEUE,
    SPORTS_EVENTS_QUEUE,
    SPORTS_LIVE_QUEUE,
    SPORTS_MARKET_QUEUE,
    SPORTS_RESOLUTION_QUEUE,
    SPORTS_SYNC_QUEUE,
    SPORTS_ODDS_QUEUE,
    DLQ_MARKET,
    DLQ_ORDER,
    DLQ_TRADE,
    DLQ_BLOCKCHAIN,
    DLQ_SPORTS,
    DLQ_SPORTS_MARKETS,
    DLQ_SPORTS_SYNC,
];

/**
 * Queue bindings
 */
export const BINDINGS: BindingConfig[] = [
    // Market events bindings
    {
        exchange: DOMAIN_EVENTS_EXCHANGE.name,
        queue: MARKET_EVENTS_QUEUE.name,
        routingKey: ROUTING_KEYS.ALL_MARKET_EVENTS,
    },

    // Order events bindings
    {
        exchange: DOMAIN_EVENTS_EXCHANGE.name,
        queue: ORDER_EVENTS_QUEUE.name,
        routingKey: ROUTING_KEYS.ALL_ORDER_EVENTS,
    },

    // Trade events bindings
    {
        exchange: DOMAIN_EVENTS_EXCHANGE.name,
        queue: TRADE_SETTLEMENT_QUEUE.name,
        routingKey: ROUTING_KEYS.ALL_TRADE_EVENTS,
    },

    // Analytics receives all events
    {
        exchange: DOMAIN_EVENTS_EXCHANGE.name,
        queue: ANALYTICS_QUEUE.name,
        routingKey: ROUTING_KEYS.ALL_EVENTS,
    },

    // Blockchain tx bindings
    {
        exchange: COMMANDS_EXCHANGE.name,
        queue: BLOCKCHAIN_TX_QUEUE.name,
        routingKey: 'blockchain.submit_tx',
    },

    // Sports events bindings
    {
        exchange: DOMAIN_EVENTS_EXCHANGE.name,
        queue: SPORTS_EVENTS_QUEUE.name,
        routingKey: 'sports.event.*',
    },
    {
        exchange: DOMAIN_EVENTS_EXCHANGE.name,
        queue: SPORTS_LIVE_QUEUE.name,
        routingKey: 'sports.live.*',
    },
    {
        exchange: DOMAIN_EVENTS_EXCHANGE.name,
        queue: SPORTS_MARKET_QUEUE.name,
        routingKey: 'sports.market.*',
    },
    {
        exchange: DOMAIN_EVENTS_EXCHANGE.name,
        queue: SPORTS_ODDS_QUEUE.name,
        routingKey: 'sports.odds.*',
    },
    {
        exchange: COMMANDS_EXCHANGE.name,
        queue: SPORTS_SYNC_QUEUE.name,
        routingKey: 'sports.sync.*',
    },
    {
        exchange: COMMANDS_EXCHANGE.name,
        queue: SPORTS_RESOLUTION_QUEUE.name,
        routingKey: 'sports.resolution.*',
    },

    // Dead letter bindings
    {
        exchange: DEAD_LETTER_EXCHANGE.name,
        queue: DLQ_MARKET.name,
        routingKey: 'dlq.market.events',
    },
    {
        exchange: DEAD_LETTER_EXCHANGE.name,
        queue: DLQ_ORDER.name,
        routingKey: 'dlq.order.events',
    },
    {
        exchange: DEAD_LETTER_EXCHANGE.name,
        queue: DLQ_TRADE.name,
        routingKey: 'dlq.trade.settlement',
    },
    {
        exchange: DEAD_LETTER_EXCHANGE.name,
        queue: DLQ_BLOCKCHAIN.name,
        routingKey: 'dlq.blockchain.tx',
    },
    {
        exchange: DEAD_LETTER_EXCHANGE.name,
        queue: DLQ_SPORTS.name,
        routingKey: 'dlq.sports.events',
    },
    {
        exchange: DEAD_LETTER_EXCHANGE.name,
        queue: DLQ_SPORTS_MARKETS.name,
        routingKey: 'dlq.sports.markets',
    },
    {
        exchange: DEAD_LETTER_EXCHANGE.name,
        queue: DLQ_SPORTS_SYNC.name,
        routingKey: 'dlq.sports.sync',
    },
];
