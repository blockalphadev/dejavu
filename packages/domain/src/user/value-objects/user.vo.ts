/**
 * User Value Objects
 */

import { SingleValueObject, ValueObject } from '../common/value-object.base';
import { ValidationError } from '@dejavu/shared/errors';
import type { ChainId, ChainType } from '@dejavu/shared/types';

/**
 * User ID value object
 */
export class UserIdVO extends SingleValueObject<string> {
    protected validate(value: string): void {
        if (!value || value.trim().length === 0) {
            throw new ValidationError('User ID cannot be empty', { field: 'userId' });
        }
    }

    static create(value: string): UserIdVO {
        return new UserIdVO(value);
    }

    static generate(): UserIdVO {
        return new UserIdVO(crypto.randomUUID());
    }
}

/**
 * Email value object
 */
export class EmailVO extends SingleValueObject<string> {
    private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    protected validate(value: string): void {
        if (!value || !EmailVO.EMAIL_REGEX.test(value)) {
            throw new ValidationError('Invalid email address', { field: 'email' });
        }
    }

    static create(value: string): EmailVO {
        return new EmailVO(value.toLowerCase().trim());
    }

    get domain(): string {
        return this._value.split('@')[1];
    }
}

/**
 * Username value object
 */
export class UsernameVO extends SingleValueObject<string> {
    private static readonly MIN_LENGTH = 3;
    private static readonly MAX_LENGTH = 30;
    private static readonly USERNAME_REGEX = /^[a-zA-Z0-9_-]+$/;

    protected validate(value: string): void {
        if (!value || value.length < UsernameVO.MIN_LENGTH) {
            throw new ValidationError(
                `Username must be at least ${UsernameVO.MIN_LENGTH} characters`,
                { field: 'username' }
            );
        }

        if (value.length > UsernameVO.MAX_LENGTH) {
            throw new ValidationError(
                `Username cannot exceed ${UsernameVO.MAX_LENGTH} characters`,
                { field: 'username' }
            );
        }

        if (!UsernameVO.USERNAME_REGEX.test(value)) {
            throw new ValidationError(
                'Username can only contain letters, numbers, underscores, and hyphens',
                { field: 'username' }
            );
        }
    }

    static create(value: string): UsernameVO {
        return new UsernameVO(value.toLowerCase().trim());
    }
}

/**
 * Wallet Address Value Object
 */
export class WalletAddressVO extends ValueObject<{
    address: string;
    chain: ChainType;
    chainId: ChainId;
    isPrimary: boolean;
    label?: string;
    verifiedAt?: Date;
}> {
    private constructor(props: {
        address: string;
        chain: ChainType;
        chainId: ChainId;
        isPrimary: boolean;
        label?: string;
        verifiedAt?: Date;
    }) {
        super(props);
    }

    static create(props: {
        address: string;
        chain: ChainType;
        chainId: ChainId;
        isPrimary?: boolean;
        label?: string;
    }): WalletAddressVO {
        // Basic validation
        if (!props.address || props.address.trim().length === 0) {
            throw new ValidationError('Wallet address cannot be empty');
        }

        // Chain-specific validation
        if (props.chain === 'evm') {
            if (!/^0x[a-fA-F0-9]{40}$/.test(props.address)) {
                throw new ValidationError('Invalid EVM wallet address format');
            }
        }

        return new WalletAddressVO({
            address: props.address,
            chain: props.chain,
            chainId: props.chainId,
            isPrimary: props.isPrimary ?? false,
            label: props.label,
        });
    }

    get address(): string {
        return this.props.address;
    }

    get chain(): ChainType {
        return this.props.chain;
    }

    get chainId(): ChainId {
        return this.props.chainId;
    }

    get isPrimary(): boolean {
        return this.props.isPrimary;
    }

    get label(): string | undefined {
        return this.props.label;
    }

    get isVerified(): boolean {
        return !!this.props.verifiedAt;
    }

    /**
     * Get shortened address for display
     */
    get shortAddress(): string {
        return `${this.props.address.slice(0, 6)}...${this.props.address.slice(-4)}`;
    }

    /**
     * Mark as verified
     */
    verify(): WalletAddressVO {
        return new WalletAddressVO({
            ...this.props,
            verifiedAt: new Date(),
        });
    }

    /**
     * Set as primary
     */
    setAsPrimary(): WalletAddressVO {
        return new WalletAddressVO({
            ...this.props,
            isPrimary: true,
        });
    }
}
