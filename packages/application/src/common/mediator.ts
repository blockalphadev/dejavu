/**
 * Mediator Pattern
 *
 * Central dispatcher for Commands and Queries.
 * Decouples senders from handlers.
 */

import type { ICommand } from './command.interface';
import type { IQuery } from './query.interface';
import type { ICommandHandler, IQueryHandler } from './handler.interface';
import type { Result } from './result';
import { failure } from './result';

/**
 * Mediator interface
 */
export interface IMediator {
    /**
     * Send a command for execution
     */
    send<TResult>(command: ICommand): Promise<Result<TResult>>;

    /**
     * Execute a query
     */
    query<TResult>(query: IQuery<TResult>): Promise<Result<TResult>>;

    /**
     * Register a command handler
     */
    registerCommandHandler<TCommand extends ICommand, TResult>(
        commandType: string,
        handler: ICommandHandler<TCommand, TResult>,
    ): void;

    /**
     * Register a query handler
     */
    registerQueryHandler<TQuery extends IQuery<TResult>, TResult>(
        queryType: string,
        handler: IQueryHandler<TQuery, TResult>,
    ): void;
}

/**
 * Mediator implementation
 */
export class Mediator implements IMediator {
    private readonly commandHandlers: Map<string, ICommandHandler<ICommand, unknown>> = new Map();
    private readonly queryHandlers: Map<string, IQueryHandler<IQuery<unknown>, unknown>> = new Map();

    /**
     * Send a command for execution
     */
    async send<TResult>(command: ICommand): Promise<Result<TResult>> {
        const handler = this.commandHandlers.get(command.commandType);

        if (!handler) {
            return failure(new Error(`No handler registered for command: ${command.commandType}`));
        }

        try {
            const result = await handler.execute(command);
            return result as Result<TResult>;
        } catch (error) {
            return failure(error instanceof Error ? error : new Error(String(error)));
        }
    }

    /**
     * Execute a query
     */
    async query<TResult>(query: IQuery<TResult>): Promise<Result<TResult>> {
        const handler = this.queryHandlers.get(query.queryType);

        if (!handler) {
            return failure(new Error(`No handler registered for query: ${query.queryType}`));
        }

        try {
            const result = await handler.execute(query);
            return result as Result<TResult>;
        } catch (error) {
            return failure(error instanceof Error ? error : new Error(String(error)));
        }
    }

    /**
     * Register a command handler
     */
    registerCommandHandler<TCommand extends ICommand, TResult>(
        commandType: string,
        handler: ICommandHandler<TCommand, TResult>,
    ): void {
        if (this.commandHandlers.has(commandType)) {
            console.warn(`[Mediator] Overwriting handler for command: ${commandType}`);
        }
        this.commandHandlers.set(commandType, handler as ICommandHandler<ICommand, unknown>);
        console.log(`[Mediator] Registered command handler: ${handler.handlerName} for ${commandType}`);
    }

    /**
     * Register a query handler
     */
    registerQueryHandler<TQuery extends IQuery<TResult>, TResult>(
        queryType: string,
        handler: IQueryHandler<TQuery, TResult>,
    ): void {
        if (this.queryHandlers.has(queryType)) {
            console.warn(`[Mediator] Overwriting handler for query: ${queryType}`);
        }
        this.queryHandlers.set(queryType, handler as IQueryHandler<IQuery<unknown>, unknown>);
        console.log(`[Mediator] Registered query handler: ${handler.handlerName} for ${queryType}`);
    }

    /**
     * Get registered command types
     */
    getRegisteredCommands(): string[] {
        return Array.from(this.commandHandlers.keys());
    }

    /**
     * Get registered query types
     */
    getRegisteredQueries(): string[] {
        return Array.from(this.queryHandlers.keys());
    }
}

/**
 * Create a mediator instance
 */
export function createMediator(): Mediator {
    return new Mediator();
}

// Singleton instance
let defaultMediator: Mediator | null = null;

/**
 * Get or create the default mediator
 */
export function getDefaultMediator(): Mediator {
    if (!defaultMediator) {
        defaultMediator = createMediator();
    }
    return defaultMediator;
}
