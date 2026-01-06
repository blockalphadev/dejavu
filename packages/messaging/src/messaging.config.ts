/**
 * Messaging Configuration
 *
 * Configuration types and defaults for the RabbitMQ messaging layer.
 */

/**
 * RabbitMQ connection configuration
 */
export interface RabbitMQConfig {
    /** RabbitMQ host */
    host: string;
    /** RabbitMQ port */
    port: number;
    /** RabbitMQ username */
    username: string;
    /** RabbitMQ password */
    password: string;
    /** Virtual host */
    vhost: string;
    /** Connection name for identification */
    connectionName?: string;
    /** Heartbeat interval in seconds */
    heartbeat?: number;
    /** Connection timeout in ms */
    connectionTimeout?: number;
    /** Enable TLS */
    tls?: boolean;
    /** Prefetch count for consumers */
    prefetchCount?: number;
}

/**
 * Default RabbitMQ configuration
 */
export const DEFAULT_RABBITMQ_CONFIG: RabbitMQConfig = {
    host: 'localhost',
    port: 5672,
    username: 'guest',
    password: 'guest',
    vhost: '/',
    heartbeat: 60,
    connectionTimeout: 10000,
    prefetchCount: 10,
};

/**
 * Create RabbitMQ connection URL
 */
export function createRabbitMQUrl(config: RabbitMQConfig): string {
    const protocol = config.tls ? 'amqps' : 'amqp';
    const auth = `${encodeURIComponent(config.username)}:${encodeURIComponent(config.password)}`;
    const vhost = encodeURIComponent(config.vhost);
    return `${protocol}://${auth}@${config.host}:${config.port}/${vhost}`;
}

/**
 * Create configuration from environment variables
 */
export function createRabbitMQConfigFromEnv(): RabbitMQConfig {
    return {
        host: process.env.RABBITMQ_HOST || DEFAULT_RABBITMQ_CONFIG.host,
        port: parseInt(process.env.RABBITMQ_PORT || String(DEFAULT_RABBITMQ_CONFIG.port), 10),
        username: process.env.RABBITMQ_USER || DEFAULT_RABBITMQ_CONFIG.username,
        password: process.env.RABBITMQ_PASSWORD || DEFAULT_RABBITMQ_CONFIG.password,
        vhost: process.env.RABBITMQ_VHOST || DEFAULT_RABBITMQ_CONFIG.vhost,
        heartbeat: parseInt(process.env.RABBITMQ_HEARTBEAT || '60', 10),
        connectionTimeout: parseInt(process.env.RABBITMQ_TIMEOUT || '10000', 10),
        tls: process.env.RABBITMQ_TLS === 'true',
        prefetchCount: parseInt(process.env.RABBITMQ_PREFETCH || '10', 10),
    };
}
