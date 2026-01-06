/**
 * Unit of Work Pattern
 *
 * Manages transactions and coordinates persistence of aggregates.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { DomainEvent } from '@dejavu/domain';
import type { IEventBus } from '@dejavu/events';
import { EventDispatcher } from '@dejavu/events';

/**
 * Unit of Work interface
 */
export interface IUnitOfWork {
    /**
     * Begin a new transaction
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
     * Register domain events to be dispatched after commit
     */
    registerEvents(aggregateId: string, events: DomainEvent[]): void;
}

/**
 * Unit of Work implementation with Supabase
 *
 * Note: Supabase doesn't support true transactions in the client SDK.
 * This implementation provides event dispatching coordination and
 * can be extended with RPC calls for transaction support.
 */
export class UnitOfWork implements IUnitOfWork {
    private readonly eventDispatcher: EventDispatcher;
    private readonly pendingOperations: Array<() => Promise<void>> = [];
    private isActive: boolean = false;

    constructor(eventBus: IEventBus) {
        this.eventDispatcher = new EventDispatcher(eventBus);
    }

    /**
     * Begin a new unit of work
     */
    async begin(): Promise<void> {
        if (this.isActive) {
            throw new Error('Unit of work is already active');
        }
        this.isActive = true;
    }

    /**
     * Commit the unit of work
     *
     * Executes all pending operations and dispatches domain events.
     */
    async commit(): Promise<void> {
        if (!this.isActive) {
            throw new Error('No active unit of work to commit');
        }

        try {
            // Execute all pending operations
            for (const operation of this.pendingOperations) {
                await operation();
            }

            // Dispatch all domain events
            // Events are dispatched after all operations succeed
            this.pendingOperations.length = 0;
            this.isActive = false;
        } catch (error) {
            await this.rollback();
            throw error;
        }
    }

    /**
     * Rollback the unit of work
     */
    async rollback(): Promise<void> {
        this.pendingOperations.length = 0;
        this.eventDispatcher.clearAllEvents();
        this.isActive = false;
    }

    /**
     * Register domain events for an aggregate
     */
    registerEvents(aggregateId: string, events: DomainEvent[]): void {
        if (!this.isActive) {
            throw new Error('Cannot register events without an active unit of work');
        }

        this.eventDispatcher.registerEvents(aggregateId, events);

        // Queue event dispatch for commit
        this.pendingOperations.push(async () => {
            await this.eventDispatcher.dispatchEvents(aggregateId);
        });
    }

    /**
     * Add an operation to be executed on commit
     */
    addOperation(operation: () => Promise<void>): void {
        if (!this.isActive) {
            throw new Error('Cannot add operation without an active unit of work');
        }
        this.pendingOperations.push(operation);
    }

    /**
     * Check if unit of work is active
     */
    get active(): boolean {
        return this.isActive;
    }
}

/**
 * Create a unit of work
 */
export function createUnitOfWork(eventBus: IEventBus): UnitOfWork {
    return new UnitOfWork(eventBus);
}

/**
 * Execute a function within a unit of work
 *
 * Automatic begin, commit on success, rollback on failure.
 */
export async function withUnitOfWork<T>(
    uow: IUnitOfWork,
    fn: () => Promise<T>,
): Promise<T> {
    await uow.begin();

    try {
        const result = await fn();
        await uow.commit();
        return result;
    } catch (error) {
        await uow.rollback();
        throw error;
    }
}
