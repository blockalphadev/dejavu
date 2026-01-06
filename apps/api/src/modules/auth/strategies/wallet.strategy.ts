import { Injectable, Logger } from '@nestjs/common';
import { ethers } from 'ethers';
import * as nacl from 'tweetnacl';
import bs58 from 'bs58';

export interface WalletVerificationResult {
    isValid: boolean;
    address: string;
    chain: 'ethereum' | 'solana' | 'sui' | 'base';
    error?: string;
}

/**
 * Wallet Strategy Service
 * Handles cryptographic verification for multiple blockchain wallets
 */
@Injectable()
export class WalletStrategy {
    private readonly logger = new Logger(WalletStrategy.name);

    /**
     * Generate a challenge message for wallet signing
     */
    generateChallenge(address: string, chain: string): string {
        const nonce = Math.random().toString(36).substring(2, 15);
        const timestamp = Date.now();
        const domain = 'dejavu.app';

        return `Welcome to DeJaVu!

Click to sign in and accept the DeJaVu Terms of Service.

This request will not trigger a blockchain transaction or cost any gas fees.

Wallet: ${address}
Chain: ${chain}
Nonce: ${nonce}
Timestamp: ${timestamp}
Domain: ${domain}`;
    }

    /**
     * Verify a wallet signature
     */
    async verify(
        address: string,
        signature: string,
        message: string,
        chain: 'ethereum' | 'solana' | 'sui' | 'base',
    ): Promise<WalletVerificationResult> {
        try {
            switch (chain) {
                case 'ethereum':
                case 'base':
                    return this.verifyEVM(address, signature, message, chain);
                case 'solana':
                    return this.verifySolana(address, signature, message);
                case 'sui':
                    return this.verifySui(address, signature, message);
                default:
                    return {
                        isValid: false,
                        address,
                        chain,
                        error: `Unsupported chain: ${chain}`,
                    };
            }
        } catch (error) {
            this.logger.error(`Wallet verification failed: ${error}`);
            return {
                isValid: false,
                address,
                chain,
                error: error instanceof Error ? error.message : 'Verification failed',
            };
        }
    }

    /**
     * Verify EVM-compatible signatures (Ethereum, Base, etc.)
     */
    private verifyEVM(
        address: string,
        signature: string,
        message: string,
        chain: 'ethereum' | 'base',
    ): WalletVerificationResult {
        try {
            // Recover signer address from signature
            const recoveredAddress = ethers.verifyMessage(message, signature);

            // Compare addresses (case-insensitive)
            const isValid = recoveredAddress.toLowerCase() === address.toLowerCase();

            return {
                isValid,
                address: recoveredAddress,
                chain,
                error: isValid ? undefined : 'Signature does not match address',
            };
        } catch (error) {
            return {
                isValid: false,
                address,
                chain,
                error: 'Invalid EVM signature format',
            };
        }
    }

    /**
     * Verify Solana signatures
     */
    private verifySolana(
        address: string,
        signature: string,
        message: string,
    ): WalletVerificationResult {
        try {
            // Decode base58 public key and signature
            const publicKeyBytes = bs58.decode(address);
            const signatureBytes = bs58.decode(signature);
            const messageBytes = new TextEncoder().encode(message);

            // Verify using nacl
            const isValid = nacl.sign.detached.verify(
                messageBytes,
                signatureBytes,
                publicKeyBytes,
            );

            return {
                isValid,
                address,
                chain: 'solana',
                error: isValid ? undefined : 'Invalid Solana signature',
            };
        } catch (error) {
            return {
                isValid: false,
                address,
                chain: 'solana',
                error: 'Invalid Solana signature format',
            };
        }
    }

    /**
     * Verify Sui signatures
     * Note: Sui uses Ed25519 similar to Solana
     */
    private verifySui(
        address: string,
        signature: string,
        message: string,
    ): WalletVerificationResult {
        try {
            // Sui addresses are different from public keys
            // For production, use @mysten/sui.js for proper verification
            // This is a simplified verification
            const signatureBytes = Buffer.from(signature, 'base64');
            const messageBytes = new TextEncoder().encode(message);

            // Extract public key from signature (last 32 bytes in Ed25519 scheme)
            // Sui signatures include scheme flag + signature + public key
            if (signatureBytes.length < 65) {
                return {
                    isValid: false,
                    address,
                    chain: 'sui',
                    error: 'Invalid Sui signature length',
                };
            }

            const publicKeyBytes = signatureBytes.slice(-32);
            const sigBytes = signatureBytes.slice(1, 65);

            const isValid = nacl.sign.detached.verify(
                messageBytes,
                sigBytes,
                publicKeyBytes,
            );

            return {
                isValid,
                address,
                chain: 'sui',
                error: isValid ? undefined : 'Invalid Sui signature',
            };
        } catch (error) {
            return {
                isValid: false,
                address,
                chain: 'sui',
                error: 'Invalid Sui signature format',
            };
        }
    }
}
