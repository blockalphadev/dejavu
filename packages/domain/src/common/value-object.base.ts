/**
 * Value Object Base Class
 *
 * Immutable objects defined by their attributes, not identity.
 */

/**
 * Abstract base Value Object class
 */
export abstract class ValueObject<T extends Record<string, unknown>> {
    protected readonly props: T;

    constructor(props: T) {
        this.props = Object.freeze({ ...props });
    }

    /**
     * Check structural equality
     */
    equals(vo?: ValueObject<T>): boolean {
        if (!vo) return false;
        if (this === vo) return true;
        return JSON.stringify(this.props) === JSON.stringify(vo.props);
    }

    /**
     * Get props clone
     */
    get value(): Readonly<T> {
        return this.props;
    }
}

/**
 * Single value wrapper for primitive values
 */
export abstract class SingleValueObject<T> {
    protected readonly _value: T;

    constructor(value: T) {
        this.validate(value);
        this._value = value;
    }

    /**
     * Validate the value
     */
    protected abstract validate(value: T): void;

    /**
     * Get the value
     */
    get value(): T {
        return this._value;
    }

    /**
     * Check equality
     */
    equals(vo?: SingleValueObject<T>): boolean {
        if (!vo) return false;
        return this._value === vo._value;
    }

    /**
     * String representation
     */
    toString(): string {
        return String(this._value);
    }
}
