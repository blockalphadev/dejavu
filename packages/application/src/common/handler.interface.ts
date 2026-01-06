/**
 * Handler Interfaces
 *
 * Handlers process Commands and Queries.
 */

import type { ICommand } from './command.interface';
import type { IQuery } from './query.interface';
import type { Result } from './result';

/**
 * Command handler interface
 */
export interface ICommandHandler<TCommand extends ICommand, TResult = void> {
    /** Handler name for identification */
    readonly handlerName: string;
    /** Command type this handler processes */
    readonly commandType: string;
    /** Execute the command */
    execute(command: TCommand): Promise<Result<TResult>>;
}

/**
 * Query handler interface
 */
export interface IQueryHandler<TQuery extends IQuery<TResult>, TResult = unknown> {
    /** Handler name for identification */
    readonly handlerName: string;
    /** Query type this handler processes */
    readonly queryType: string;
    /** Execute the query */
    execute(query: TQuery): Promise<Result<TResult>>;
}

/**
 * Abstract command handler base class
 */
export abstract class CommandHandler<TCommand extends ICommand, TResult = void>
    implements ICommandHandler<TCommand, TResult> {
    abstract readonly handlerName: string;
    abstract readonly commandType: string;
    abstract execute(command: TCommand): Promise<Result<TResult>>;
}

/**
 * Abstract query handler base class
 */
export abstract class QueryHandler<TQuery extends IQuery<TResult>, TResult = unknown>
    implements IQueryHandler<TQuery, TResult> {
    abstract readonly handlerName: string;
    abstract readonly queryType: string;
    abstract execute(query: TQuery): Promise<Result<TResult>>;
}
