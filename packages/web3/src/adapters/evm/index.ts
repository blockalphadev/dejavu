/**
 * @dejavu/web3 - EVM Chain Adapter
 * 
 * Adapter for EVM-compatible chains (Ethereum, Base, Polygon, Arbitrum, Optimism)
 * using wagmi and viem under the hood.
 */

import type { ChainId } from '@dejavu/core';
import type {
    ChainAdapter,
    TransactionRequest,
    TransactionReceipt
} from '../../types';

/**
 * EVM Chain Adapter
 * 
 * Implements the ChainAdapter interface for all EVM-compatible chains.
 * This adapter uses wagmi for React hooks and viem for low-level operations.
 */
export class EvmAdapter implements ChainAdapter {
    readonly chainType = 'evm' as const;
    readonly supportedChains: ChainId[] = [
        'ethereum',
        'base',
        'polygon',
        'arbitrum',
        'optimism',
    ];

    private listeners: {
        account: Set<(address: string | null) => void>;
        chain: Set<(chainId: ChainId) => void>;
        disconnect: Set<() => void>;
    } = {
            account: new Set(),
            chain: new Set(),
            disconnect: new Set(),
        };

    async connect(chainId?: ChainId): Promise<string> {
        // Implementation will use wagmi's connect function
        // Placeholder for now - will be implemented with wagmi integration
        console.log('EVM connect called with chainId:', chainId);
        throw new Error('EVM adapter not yet implemented - requires wagmi setup');
    }

    async disconnect(): Promise<void> {
        // Implementation will use wagmi's disconnect function
        console.log('EVM disconnect called');
        this.listeners.disconnect.forEach(cb => cb());
    }

    async switchChain(chainId: ChainId): Promise<void> {
        if (!this.supportedChains.includes(chainId)) {
            throw new Error(`Chain ${chainId} is not supported by EVM adapter`);
        }
        // Implementation will use wagmi's switchChain function
        console.log('EVM switchChain called with chainId:', chainId);
    }

    async getAddress(): Promise<string | null> {
        // Implementation will use wagmi's useAccount hook
        return null;
    }

    async getChainId(): Promise<ChainId | null> {
        // Implementation will use wagmi's useChainId hook
        return null;
    }

    async getBalance(address: string): Promise<bigint> {
        // Implementation will use viem's getBalance function
        console.log('EVM getBalance called for address:', address);
        return BigInt(0);
    }

    async signMessage(message: string): Promise<string> {
        // Implementation will use wagmi's signMessage function
        console.log('EVM signMessage called with message:', message);
        throw new Error('EVM signMessage not yet implemented');
    }

    async signTypedData(data: unknown): Promise<string> {
        // Implementation will use wagmi's signTypedData function
        console.log('EVM signTypedData called with data:', data);
        throw new Error('EVM signTypedData not yet implemented');
    }

    async sendTransaction(tx: TransactionRequest): Promise<string> {
        // Implementation will use wagmi's sendTransaction function
        console.log('EVM sendTransaction called with tx:', tx);
        throw new Error('EVM sendTransaction not yet implemented');
    }

    async waitForTransaction(
        hash: string,
        confirmations: number = 1
    ): Promise<TransactionReceipt> {
        // Implementation will use viem's waitForTransactionReceipt function
        console.log('EVM waitForTransaction called:', hash, confirmations);
        throw new Error('EVM waitForTransaction not yet implemented');
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
export const evmAdapter = new EvmAdapter();
