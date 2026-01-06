/**
 * Use Case Interface
 *
 * Use cases encapsulate application business logic.
 */

import type { Result } from './result';

/**
 * Use case interface
 */
export interface IUseCase<TRequest, TResponse> {
    /** Use case name for identification */
    readonly useCaseName: string;
    /** Execute the use case */
    execute(request: TRequest): Promise<Result<TResponse>>;
}

/**
 * Abstract use case base class
 */
export abstract class UseCase<TRequest, TResponse> implements IUseCase<TRequest, TResponse> {
    abstract readonly useCaseName: string;
    abstract execute(request: TRequest): Promise<Result<TResponse>>;
}
