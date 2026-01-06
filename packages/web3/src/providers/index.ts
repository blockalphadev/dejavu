/**
 * @dejavu/web3 - React Providers
 * 
 * Context providers for Web3 functionality.
 */

import React, { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { ChainType, ChainId } from '@dejavu/core';
import type { Web3ContextValue, WalletProviderConfig } from '../types';
import { useWallet } from '../hooks';

// ============================================================================
// Web3 Context
// ============================================================================

const Web3Context = createContext<Web3ContextValue | null>(null);

/**
 * Hook to access Web3 context
 */
export function useWeb3(): Web3ContextValue {
    const context = useContext(Web3Context);
    if (!context) {
        throw new Error('useWeb3 must be used within a Web3Provider');
    }
    return context;
}

// ============================================================================
// Web3 Provider
// ============================================================================

interface Web3ProviderProps {
    config: WalletProviderConfig;
    children: ReactNode;
}

/**
 * Web3 Provider Component
 * 
 * Wraps the application with Web3 functionality including
 * wallet connection and chain management.
 */
export function Web3Provider({ config, children }: Web3ProviderProps): React.JSX.Element {
    const {
        wallet,
        connect,
        disconnect,
        switchChain,
        isConnected,
        isConnecting,
        activeAdapter,
    } = useWallet();

    // Log config for future use (will be used for wallet initialization)
    console.debug('Web3Provider initialized with config:', config.appName);

    const value = useMemo<Web3ContextValue>(() => ({
        wallet,
        connect: async (chainType: ChainType, chainId?: ChainId) => {
            await connect(chainType, chainId);
        },
        disconnect,
        switchChain,
        isConnected,
        isConnecting,
        activeAdapter,
    }), [wallet, connect, disconnect, switchChain, isConnected, isConnecting, activeAdapter]);

    return (
        <Web3Context.Provider value= { value } >
        { children }
        </Web3Context.Provider>
  );
}
