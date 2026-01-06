/**
 * Repository Interface
 *
 * Base interface for persistence abstraction.
 */

import { Result } from '@dejavu/shared/utils';
import { AggregateRoot, AggregateRootProps } from './aggregate-root.base';
import { EntityId } from './entity.base';

/**
 * Generic repository interface
 */
export interface IRepository<T extends AggregateRoot<AggregateRootProps>> {
    /**
     * Find by ID
     */
    findById(id: EntityId): Promise<Result<T | null>>;

    /**
     * Save aggregate (create or update)
     */
    save(aggregate: T): Promise<Result<void>>;

    /**
     * Delete aggregate
     */
    delete(id: EntityId): Promise<Result<void>>;

    /**
     * Check if exists
     */
    exists(id: EntityId): Promise<Result<boolean>>;
}

/**
 * Unit of Work interface for transaction management
 */
export interface IUnitOfWork {
    /**
     * Start a transaction
     */
    begin(): Promise<void>;

    /**
     * Commit the transaction
     */
    commit(): Promise<void>;

    /**
     * Rollback the transaction
     */
    rollback(): Promise<void>;

    /**
     * Execute work within a transaction
     */
    execute<T>(work: () => Promise<T>): Promise<T>;
}
