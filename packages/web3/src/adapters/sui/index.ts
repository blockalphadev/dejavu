/**
 * @dejavu/web3 - Sui Chain Adapter
 * 
 * Adapter for Sui blockchain using @mysten/sui.js.
 */

import type { ChainId } from '@dejavu/core';
import type {
    ChainAdapter,
    TransactionRequest,
    TransactionReceipt
} from '../../types';

/**
 * Sui Chain Adapter
 * 
 * Implements the ChainAdapter interface for Sui.
 * Uses @mysten/sui.js for blockchain interactions.
 */
export class SuiAdapter implements ChainAdapter {
    readonly chainType = 'sui' as const;
    readonly supportedChains: ChainId[] = ['sui'];

    private listeners: {
        account: Set<(address: string | null) => void>;
        chain: Set<(chainId: ChainId) => void>;
        disconnect: Set<() => void>;
    } = {
            account: new Set(),
            chain: new Set(),
            disconnect: new Set(),
        };

    async connect(_chainId?: ChainId): Promise<string> {
        // Implementation will use @mysten/wallet-standard
        console.log('Sui connect called');
        throw new Error('Sui adapter not yet implemented');
    }

    async disconnect(): Promise<void> {
        console.log('Sui disconnect called');
        this.listeners.disconnect.forEach(cb => cb());
    }

    async switchChain(chainId: ChainId): Promise<void> {
        if (chainId !== 'sui') {
            throw new Error(`Chain ${chainId} is not supported by Sui adapter`);
        }
        console.log('Sui switchChain - no-op for mainnet');
    }

    async getAddress(): Promise<string | null> {
        return null;
    }

    async getChainId(): Promise<ChainId | null> {
        return 'sui';
    }

    async getBalance(address: string): Promise<bigint> {
        // Implementation will use @mysten/sui.js getBalance
        console.log('Sui getBalance called for address:', address);
        return BigInt(0);
    }

    async signMessage(message: string): Promise<string> {
        console.log('Sui signMessage called with message:', message);
        throw new Error('Sui signMessage not yet implemented');
    }

    async signTypedData(_data: unknown): Promise<string> {
        // Sui doesn't have EIP-712 style typed data
        throw new Error('signTypedData is not supported on Sui');
    }

    async sendTransaction(tx: TransactionRequest): Promise<string> {
        console.log('Sui sendTransaction called with tx:', tx);
        throw new Error('Sui sendTransaction not yet implemented');
    }

    async waitForTransaction(
        hash: string,
        _confirmations: number = 1
    ): Promise<TransactionReceipt> {
        console.log('Sui waitForTransaction called:', hash);
        throw new Error('Sui waitForTransaction not yet implemented');
    }

    onAccountChange(callback: (address: string | null) => void): () => void {
        this.listeners.account.add(callback);
        return () => this.listeners.account.delete(callback);
    }

    onChainChange(callback: (chainId: ChainId) => void): () => void {
        this.listeners.chain.add(callback);
        return () => this.listeners.chain.delete(callback);
    }

    onDisconnect(callback: () => void): () => void {
        this.listeners.disconnect.add(callback);
        return () => this.listeners.disconnect.delete(callback);
    }
}

// Export singleton instance
export const suiAdapter = new SuiAdapter();
