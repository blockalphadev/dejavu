/**
 * @dejavu/web3 - Solana Chain Adapter
 * 
 * Adapter for Solana blockchain using @solana/web3.js.
 */

import type { ChainId } from '@dejavu/core';
import type {
    ChainAdapter,
    TransactionRequest,
    TransactionReceipt
} from '../../types';

/**
 * Solana Chain Adapter
 * 
 * Implements the ChainAdapter interface for Solana.
 * Uses @solana/web3.js for blockchain interactions and
 * wallet-adapter for wallet connections.
 */
export class SolanaAdapter implements ChainAdapter {
    readonly chainType = 'solana' as const;
    readonly supportedChains: ChainId[] = ['solana'];

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
        // Implementation will use @solana/wallet-adapter
        console.log('Solana connect called');
        throw new Error('Solana adapter not yet implemented');
    }

    async disconnect(): Promise<void> {
        console.log('Solana disconnect called');
        this.listeners.disconnect.forEach(cb => cb());
    }

    async switchChain(chainId: ChainId): Promise<void> {
        if (chainId !== 'solana') {
            throw new Error(`Chain ${chainId} is not supported by Solana adapter`);
        }
        // Solana doesn't have chain switching like EVM
        console.log('Solana switchChain - no-op for mainnet');
    }

    async getAddress(): Promise<string | null> {
        return null;
    }

    async getChainId(): Promise<ChainId | null> {
        return 'solana';
    }

    async getBalance(address: string): Promise<bigint> {
        // Implementation will use @solana/web3.js getBalance
        console.log('Solana getBalance called for address:', address);
        return BigInt(0);
    }

    async signMessage(message: string): Promise<string> {
        console.log('Solana signMessage called with message:', message);
        throw new Error('Solana signMessage not yet implemented');
    }

    async signTypedData(_data: unknown): Promise<string> {
        // Solana doesn't have EIP-712 style typed data
        throw new Error('signTypedData is not supported on Solana');
    }

    async sendTransaction(tx: TransactionRequest): Promise<string> {
        console.log('Solana sendTransaction called with tx:', tx);
        throw new Error('Solana sendTransaction not yet implemented');
    }

    async waitForTransaction(
        hash: string,
        _confirmations: number = 1
    ): Promise<TransactionReceipt> {
        console.log('Solana waitForTransaction called:', hash);
        throw new Error('Solana waitForTransaction not yet implemented');
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
export const solanaAdapter = new SolanaAdapter();
