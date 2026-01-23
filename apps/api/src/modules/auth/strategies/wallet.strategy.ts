import { Injectable, Logger } from '@nestjs/common';
import { ethers } from 'ethers';
import * as nacl from 'tweetnacl';
import bs58 from 'bs58';
import { verifyPersonalMessageSignature } from '@mysten/sui/verify';

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
                    return await this.verifySui(address, signature, message);
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
     * Verify Sui signatures using @mysten/sui SDK
     * Handles both standard and BCS-serialized signature formats
     */
    private async verifySui(
        address: string,
        signature: string,
        message: string,
    ): Promise<WalletVerificationResult> {
        try {
            this.logger.debug(`Verifying Sui signature: address=${address}, sigLength=${signature.length}`);
            
            // Use @mysten/sui's built-in verification
            // This handles BCS-serialized signatures and proper address verification
            try {
                const messageBytes = new TextEncoder().encode(message);
                
                // verifyPersonalMessageSignature returns the PublicKey if valid, throws if invalid
                // We can also pass the address to verify it matches
                const publicKey = await verifyPersonalMessageSignature(
                    messageBytes,
                    signature,
                    { address }, // Verify that the signature matches the expected address
                );
                
                // If we get here, the signature is valid and matches the address
                const signerAddress = publicKey.toSuiAddress();
                
                this.logger.debug(`Signature verified successfully using @mysten/sui. Signer: ${signerAddress}, Expected: ${address}`);
                
                return {
                    isValid: true,
                    address: signerAddress,
                    chain: 'sui',
                };
            } catch (suiError) {
                this.logger.warn(`@mysten/sui verification failed: ${suiError instanceof Error ? suiError.message : String(suiError)}`);
                return {
                    isValid: false,
                    address,
                    chain: 'sui',
                    error: `Signature verification failed: ${suiError instanceof Error ? suiError.message : 'Unknown error'}`,
                };
            }
            
        } catch (error) {
            this.logger.error(`Sui signature verification error: ${error}`);
            return {
                isValid: false,
                address,
                chain: 'sui',
                error: `Invalid Sui signature format: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }
}
