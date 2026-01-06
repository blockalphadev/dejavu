/**
 * Command Interface
 *
 * Commands represent intent to change the system state.
 * They are typically fire-and-forget operations.
 */

/**
 * Base command interface
 */
export interface ICommand {
    /** Command type identifier */
    readonly commandType: string;
    /** Correlation ID for tracing */
    readonly correlationId?: string;
    /** User ID initiating the command */
    readonly userId?: string;
    /** Timestamp when command was created */
    readonly timestamp: Date;
}

/**
 * Abstract command base class
 */
export abstract class Command implements ICommand {
    abstract readonly commandType: string;
    readonly correlationId?: string;
    readonly userId?: string;
    readonly timestamp: Date;

    constructor(options?: { correlationId?: string; userId?: string }) {
        this.correlationId = options?.correlationId || crypto.randomUUID();
        this.userId = options?.userId;
        this.timestamp = new Date();
    }
}

/**
 * Command metadata for tracking
 */
export interface CommandMetadata {
    /** When command was received */
    receivedAt: Date;
    /** When command was processed */
    processedAt?: Date;
    /** Processing duration in ms */
    duration?: number;
    /** Whether command succeeded */
    success?: boolean;
    /** Error message if failed */
    error?: string;
}

/**
 * Command with metadata
 */
export interface CommandWithMetadata<T extends ICommand = ICommand> {
    command: T;
    metadata: CommandMetadata;
}
