/**
 * @dejavu/web3 - React Hooks
 * 
 * Chain-agnostic React hooks for Web3 interactions.
 */

import { useCallback, useEffect, useState } from 'react';
import type { ChainId, ChainType } from '@dejavu/core';
import type { WalletState, ChainAdapter } from '../types';
import { evmAdapter } from '../adapters/evm';
import { solanaAdapter } from '../adapters/solana';
import { suiAdapter } from '../adapters/sui';

// ============================================================================
// Adapter Registry
// ============================================================================

const adapters: Record<ChainType, ChainAdapter> = {
    evm: evmAdapter,
    solana: solanaAdapter,
    sui: suiAdapter,
};

function getAdapter(chainType: ChainType): ChainAdapter {
    const adapter = adapters[chainType];
    if (!adapter) {
        throw new Error(`No adapter found for chain type: ${chainType}`);
    }
    return adapter;
}

// ============================================================================
// useWallet Hook
// ============================================================================

const initialWalletState: WalletState = {
    status: 'disconnected',
    address: null,
    chainId: null,
    chainType: null,
    balance: null,
    error: null,
};

/**
 * Hook for wallet connection and state management
 */
export function useWallet() {
    const [wallet, setWallet] = useState<WalletState>(initialWalletState);
    const [activeAdapter, setActiveAdapter] = useState<ChainAdapter | null>(null);

    const connect = useCallback(async (chainType: ChainType, chainId?: ChainId) => {
        setWallet(prev => ({ ...prev, status: 'connecting', error: null }));

        try {
            const adapter = getAdapter(chainType);
            const address = await adapter.connect(chainId);
            const currentChainId = await adapter.getChainId();
            const balance = address ? await adapter.getBalance(address) : null;

            setActiveAdapter(adapter);
            setWallet({
                status: 'connected',
                address,
                chainId: currentChainId,
                chainType,
                balance,
                error: null,
            });
        } catch (error) {
            setWallet(prev => ({
                ...prev,
                status: 'error',
                error: error as Error,
            }));
            throw error;
        }
    }, []);

    const disconnect = useCallback(async () => {
        if (activeAdapter) {
            await activeAdapter.disconnect();
        }
        setActiveAdapter(null);
        setWallet(initialWalletState);
    }, [activeAdapter]);

    const switchChain = useCallback(async (chainId: ChainId) => {
        if (!activeAdapter) {
            throw new Error('No wallet connected');
        }
        await activeAdapter.switchChain(chainId);
        setWallet(prev => ({ ...prev, chainId }));
    }, [activeAdapter]);

    // Setup event listeners
    useEffect(() => {
        if (!activeAdapter) return;

        const unsubAccount = activeAdapter.onAccountChange((address) => {
            setWallet(prev => ({ ...prev, address }));
        });

        const unsubChain = activeAdapter.onChainChange((chainId) => {
            setWallet(prev => ({ ...prev, chainId }));
        });

        const unsubDisconnect = activeAdapter.onDisconnect(() => {
            setActiveAdapter(null);
            setWallet(initialWalletState);
        });

        return () => {
            unsubAccount();
            unsubChain();
            unsubDisconnect();
        };
    }, [activeAdapter]);

    return {
        wallet,
        connect,
        disconnect,
        switchChain,
        isConnected: wallet.status === 'connected',
        isConnecting: wallet.status === 'connecting',
        activeAdapter,
    };
}

// ============================================================================
// useBalance Hook
// ============================================================================

/**
 * Hook for fetching and tracking wallet balance
 */
export function useBalance(address: string | null, chainType: ChainType | null) {
    const [balance, setBalance] = useState<bigint | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const refetch = useCallback(async () => {
        if (!address || !chainType) {
            setBalance(null);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const adapter = getAdapter(chainType);
            const newBalance = await adapter.getBalance(address);
            setBalance(newBalance);
        } catch (err) {
            setError(err as Error);
        } finally {
            setIsLoading(false);
        }
    }, [address, chainType]);

    useEffect(() => {
        refetch();
    }, [refetch]);

    return { balance, isLoading, error, refetch };
}

// ============================================================================
// useSignMessage Hook
// ============================================================================

/**
 * Hook for signing messages
 */
export function useSignMessage(chainType: ChainType | null) {
    const [signature, setSignature] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const signMessage = useCallback(async (message: string) => {
        if (!chainType) {
            throw new Error('No wallet connected');
        }

        setIsLoading(true);
        setError(null);

        try {
            const adapter = getAdapter(chainType);
            const sig = await adapter.signMessage(message);
            setSignature(sig);
            return sig;
        } catch (err) {
            setError(err as Error);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [chainType]);

    return { signature, signMessage, isLoading, error };
}
