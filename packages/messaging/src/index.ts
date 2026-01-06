/**
 * @dejavu/messaging
 *
 * Enterprise-grade RabbitMQ messaging layer with exchange/queue management,
 * message publishing, consuming, and RPC patterns.
 */

// Core exports
export * from './messaging.config';
export * from './messaging.types';
export * from './message-bus';

// RabbitMQ client
export * from './rabbitmq/index';

// Exchange and queue definitions
export * from './exchanges';
export * from './queues';
