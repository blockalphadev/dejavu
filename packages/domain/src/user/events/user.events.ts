/**
 * User Domain Events
 */

import { DomainEvent } from '../common/domain-event.base';
import type { AuthProvider, UserRole } from '@dejavu/shared/types';

/**
 * User Registered Event
 */
export class UserRegisteredEvent extends DomainEvent {
    readonly eventType = 'registered';
    readonly aggregateType = 'user';

    constructor(
        public readonly aggregateId: string,
        public readonly email: string | undefined,
        public readonly authProvider: AuthProvider,
        public readonly walletAddress?: string,
    ) {
        super();
    }

    protected getPayload() {
        return {
            email: this.email,
            authProvider: this.authProvider,
            walletAddress: this.walletAddress,
        };
    }
}

/**
 * User Logged In Event
 */
export class UserLoggedInEvent extends DomainEvent {
    readonly eventType = 'logged_in';
    readonly aggregateType = 'user';

    constructor(
        public readonly aggregateId: string,
        public readonly authProvider: AuthProvider,
        public readonly ipAddress?: string,
        public readonly userAgent?: string,
    ) {
        super();
    }

    protected getPayload() {
        return {
            authProvider: this.authProvider,
            ipAddress: this.ipAddress,
            userAgent: this.userAgent,
        };
    }
}

/**
 * Wallet Connected Event
 */
export class WalletConnectedEvent extends DomainEvent {
    readonly eventType = 'wallet_connected';
    readonly aggregateType = 'user';

    constructor(
        public readonly aggregateId: string,
        public readonly walletAddress: string,
        public readonly chain: string,
    ) {
        super();
    }

    protected getPayload() {
        return {
            walletAddress: this.walletAddress,
            chain: this.chain,
        };
    }
}

/**
 * User Role Changed Event
 */
export class UserRoleChangedEvent extends DomainEvent {
    readonly eventType = 'role_changed';
    readonly aggregateType = 'user';

    constructor(
        public readonly aggregateId: string,
        public readonly previousRole: UserRole,
        public readonly newRole: UserRole,
        public readonly changedBy: string,
    ) {
        super();
    }

    protected getPayload() {
        return {
            previousRole: this.previousRole,
            newRole: this.newRole,
            changedBy: this.changedBy,
        };
    }
}

/**
 * User Suspended Event
 */
export class UserSuspendedEvent extends DomainEvent {
    readonly eventType = 'suspended';
    readonly aggregateType = 'user';

    constructor(
        public readonly aggregateId: string,
        public readonly reason: string,
        public readonly suspendedBy: string,
        public readonly suspendedUntil?: Date,
    ) {
        super();
    }

    protected getPayload() {
        return {
            reason: this.reason,
            suspendedBy: this.suspendedBy,
            suspendedUntil: this.suspendedUntil?.toISOString(),
        };
    }
}
