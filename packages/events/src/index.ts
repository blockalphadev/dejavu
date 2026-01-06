/**
 * @dejavu/events
 *
 * Event bus abstraction supporting both in-memory and distributed
 * (RabbitMQ) event publishing and handling.
 */

// Core exports
export * from './event-bus.interface';
export * from './in-memory.event-bus';
export * from './rabbitmq.event-bus';
export * from './event-dispatcher';
export * from './event-store';
