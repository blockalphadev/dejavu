/**
 * Wallet-specific Errors
 */

import { BusinessRuleError, ExternalServiceError } from './domain-error';

/**
 * Wallet not connected error
 */
export class WalletNotConnectedError extends BusinessRuleError {
    constructor() {
        super(
            'WALLET_NOT_CONNECTED',
            'Wallet is not connected',
            { severity: 'low' },
        );
    }
}

/**
 * Unsupported chain error
 */
export class UnsupportedChainError extends BusinessRuleError {
    constructor(chainId: string | number) {
        super(
            'UNSUPPORTED_CHAIN',
            `Chain '${chainId}' is not supported`,
            { details: { chainId } },
        );
    }
}

/**
 * Insufficient balance error
 */
export class InsufficientBalanceError extends BusinessRuleError {
    constructor(required: string, available: string, currency: string) {
        super(
            'INSUFFICIENT_BALANCE',
            `Insufficient ${currency} balance: required ${required}, available ${available}`,
            { details: { required, available, currency } },
        );
    }
}

/**
 * Signature verification failed error
 */
export class SignatureVerificationError extends BusinessRuleError {
    constructor(reason?: string) {
        super(
            'SIGNATURE_VERIFICATION_FAILED',
            reason ?? 'Wallet signature verification failed',
        );
    }
}

/**
 * Transaction failed error
 */
export class TransactionFailedError extends ExternalServiceError {
    readonly txHash?: string;

    constructor(message: string, txHash?: string, cause?: Error) {
        super('blockchain', message, cause);
        this.txHash = txHash;
    }
}

/**
 * Chain switch required error
 */
export class ChainSwitchRequiredError extends BusinessRuleError {
    constructor(currentChain: string, requiredChain: string) {
        super(
            'CHAIN_SWITCH_REQUIRED',
            `Please switch from ${currentChain} to ${requiredChain}`,
            { details: { currentChain, requiredChain } },
        );
    }
}
