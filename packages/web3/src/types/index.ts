/**
 * @dejavu/web3 - Types
 * 
 * Chain-agnostic Web3 types for the wallet abstraction layer.
 */

import type { ChainId, ChainType } from '@dejavu/core';

// ============================================================================
// Wallet State Types
// ============================================================================

export type WalletStatus =
    | 'disconnected'
    | 'connecting'
    | 'connected'
    | 'error';

export interface WalletState {
    status: WalletStatus;
    address: string | null;
    chainId: ChainId | null;
    chainType: ChainType | null;
    balance: bigint | null;
    error: Error | null;
}

// ============================================================================
// Adapter Interface
// ============================================================================

export interface ChainAdapter {
    readonly chainType: ChainType;
    readonly supportedChains: ChainId[];

    // Connection
    connect(chainId?: ChainId): Promise<string>;
    disconnect(): Promise<void>;
    switchChain(chainId: ChainId): Promise<void>;

    // State
    getAddress(): Promise<string | null>;
    getChainId(): Promise<ChainId | null>;
    getBalance(address: string): Promise<bigint>;

    // Signing
    signMessage(message: string): Promise<string>;
    signTypedData(data: unknown): Promise<string>;

    // Transactions
    sendTransaction(tx: TransactionRequest): Promise<string>;
    waitForTransaction(hash: string, confirmations?: number): Promise<TransactionReceipt>;

    // Events
    onAccountChange(callback: (address: string | null) => void): () => void;
    onChainChange(callback: (chainId: ChainId) => void): () => void;
    onDisconnect(callback: () => void): () => void;
}

// ============================================================================
// Transaction Types
// ============================================================================

export interface TransactionRequest {
    to: string;
    value?: bigint;
    data?: string;
    gas?: bigint;
    gasPrice?: bigint;
    maxFeePerGas?: bigint;
    maxPriorityFeePerGas?: bigint;
    nonce?: number;
}

export type TransactionStatus = 'pending' | 'confirmed' | 'failed';

export interface TransactionReceipt {
    hash: string;
    status: TransactionStatus;
    blockNumber: number;
    blockHash: string;
    gasUsed: bigint;
    effectiveGasPrice: bigint;
    logs: TransactionLog[];
}

export interface TransactionLog {
    address: string;
    topics: string[];
    data: string;
    logIndex: number;
}

// ============================================================================
// Contract Types
// ============================================================================

export interface ContractCallOptions {
    chainId: ChainId;
    address: string;
    abi: unknown;
    functionName: string;
    args?: unknown[];
    value?: bigint;
}

export interface ContractReadResult<T = unknown> {
    data: T;
    isLoading: boolean;
    isError: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}

export interface ContractWriteResult {
    hash: string | null;
    isLoading: boolean;
    isError: boolean;
    error: Error | null;
    write: () => Promise<string>;
}

// ============================================================================
// Provider Types
// ============================================================================

export interface WalletProviderConfig {
    appName: string;
    appDescription?: string;
    appUrl?: string;
    appIcon?: string;
    projectId?: string; // WalletConnect
    chains: ChainId[];
}

export interface Web3ContextValue {
    // State
    wallet: WalletState;

    // Actions
    connect: (chainType: ChainType, chainId?: ChainId) => Promise<void>;
    disconnect: () => Promise<void>;
    switchChain: (chainId: ChainId) => Promise<void>;

    // Helpers
    isConnected: boolean;
    isConnecting: boolean;
    activeAdapter: ChainAdapter | null;
}
