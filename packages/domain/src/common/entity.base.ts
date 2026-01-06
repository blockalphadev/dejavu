/**
 * Entity Base Class
 *
 * Base class for all domain entities with identity and equality.
 */

/**
 * Entity identifier interface
 */
export interface EntityId<T = string> {
    value: T;
    equals(id: EntityId<T>): boolean;
    toString(): string;
}

/**
 * String identifier implementation
 */
export class StringId implements EntityId<string> {
    constructor(public readonly value: string) {
        if (!value || value.trim().length === 0) {
            throw new Error('Entity ID cannot be empty');
        }
    }

    equals(id: EntityId<string>): boolean {
        return this.value === id.value;
    }

    toString(): string {
        return this.value;
    }
}

/**
 * Entity properties interface
 */
export interface EntityProps {
    id: EntityId;
    createdAt?: Date;
    updatedAt?: Date;
}

/**
 * Abstract base Entity class
 */
export abstract class Entity<TProps extends EntityProps> {
    protected readonly _props: TProps;

    constructor(props: TProps) {
        this._props = props;
        this._props.createdAt = props.createdAt ?? new Date();
        this._props.updatedAt = props.updatedAt ?? new Date();
    }

    /**
     * Get entity ID
     */
    get id(): EntityId {
        return this._props.id;
    }

    /**
     * Get creation timestamp
     */
    get createdAt(): Date {
        return this._props.createdAt!;
    }

    /**
     * Get last update timestamp
     */
    get updatedAt(): Date {
        return this._props.updatedAt!;
    }

    /**
     * Check equality by ID
     */
    equals(entity?: Entity<TProps>): boolean {
        if (!entity) return false;
        if (this === entity) return true;
        return this.id.equals(entity.id);
    }
}
