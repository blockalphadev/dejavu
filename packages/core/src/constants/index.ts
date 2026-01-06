/**
 * @dejavu/core - Constants
 * 
 * Application-wide constants and configuration values.
 */

import type { Chain, ChainId } from '../types';

// ============================================================================
// Chain Configurations
// ============================================================================

export const CHAINS: Record<ChainId, Chain> = {
    ethereum: {
        id: 'ethereum',
        type: 'evm',
        name: 'Ethereum',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: ['https://eth.llamarpc.com', 'https://rpc.ankr.com/eth'],
        blockExplorers: ['https://etherscan.io'],
        testnet: false,
    },
    base: {
        id: 'base',
        type: 'evm',
        name: 'Base',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: ['https://mainnet.base.org', 'https://base.llamarpc.com'],
        blockExplorers: ['https://basescan.org'],
        testnet: false,
    },
    polygon: {
        id: 'polygon',
        type: 'evm',
        name: 'Polygon',
        nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
        rpcUrls: ['https://polygon-rpc.com', 'https://rpc.ankr.com/polygon'],
        blockExplorers: ['https://polygonscan.com'],
        testnet: false,
    },
    arbitrum: {
        id: 'arbitrum',
        type: 'evm',
        name: 'Arbitrum One',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: ['https://arb1.arbitrum.io/rpc', 'https://rpc.ankr.com/arbitrum'],
        blockExplorers: ['https://arbiscan.io'],
        testnet: false,
    },
    optimism: {
        id: 'optimism',
        type: 'evm',
        name: 'Optimism',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: ['https://mainnet.optimism.io', 'https://rpc.ankr.com/optimism'],
        blockExplorers: ['https://optimistic.etherscan.io'],
        testnet: false,
    },
    solana: {
        id: 'solana',
        type: 'solana',
        name: 'Solana',
        nativeCurrency: { name: 'Solana', symbol: 'SOL', decimals: 9 },
        rpcUrls: ['https://api.mainnet-beta.solana.com'],
        blockExplorers: ['https://explorer.solana.com'],
        testnet: false,
    },
    sui: {
        id: 'sui',
        type: 'sui',
        name: 'Sui',
        nativeCurrency: { name: 'Sui', symbol: 'SUI', decimals: 9 },
        rpcUrls: ['https://fullnode.mainnet.sui.io:443'],
        blockExplorers: ['https://suiscan.xyz'],
        testnet: false,
    },
};

// ============================================================================
// API Configuration
// ============================================================================

export const API_CONFIG = {
    baseUrl: import.meta.env?.VITE_API_URL || 'http://localhost:3001',
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
} as const;

export const EXTERNAL_APIS = {
    polymarket: {
        baseUrl: 'https://gamma-api.polymarket.com',
        proxyPath: '/api/polymarket',
    },
    coingecko: {
        baseUrl: 'https://api.coingecko.com/api/v3',
    },
} as const;

// ============================================================================
// Application Constants
// ============================================================================

export const APP_CONFIG = {
    name: 'DeJaVu',
    version: '0.0.1',
    description: 'Next-generation prediction market platform',
    supportedChains: ['ethereum', 'base', 'polygon', 'solana', 'sui'] as ChainId[],
    defaultChain: 'base' as ChainId,
} as const;

// ============================================================================
// UI Constants
// ============================================================================

export const PAGINATION = {
    defaultPageSize: 20,
    maxPageSize: 100,
} as const;

export const TOAST_DURATION = {
    short: 3000,
    medium: 5000,
    long: 8000,
} as const;

export const ANIMATION = {
    fast: 150,
    normal: 300,
    slow: 500,
} as const;

// ============================================================================
// Market Constants
// ============================================================================

export const MARKET_CATEGORIES = [
    { id: 'crypto', label: 'Crypto', icon: '₿' },
    { id: 'sports', label: 'Sports', icon: '⚽' },
    { id: 'politics', label: 'Politics', icon: '🏛️' },
    { id: 'entertainment', label: 'Entertainment', icon: '🎬' },
    { id: 'science', label: 'Science', icon: '🔬' },
    { id: 'economics', label: 'Economics', icon: '📈' },
    { id: 'other', label: 'Other', icon: '📦' },
] as const;

export const SPORT_TYPES = [
    { id: 'football', label: 'Football', icon: '🏈' },
    { id: 'basketball', label: 'Basketball', icon: '🏀' },
    { id: 'baseball', label: 'Baseball', icon: '⚾' },
    { id: 'hockey', label: 'Hockey', icon: '🏒' },
    { id: 'soccer', label: 'Soccer', icon: '⚽' },
    { id: 'tennis', label: 'Tennis', icon: '🎾' },
    { id: 'mma', label: 'MMA', icon: '🥊' },
] as const;

// ============================================================================
// Wallet Constants
// ============================================================================

export const WALLET_CONNECT_PROJECT_ID =
    import.meta.env?.VITE_WALLET_CONNECT_PROJECT_ID || '';

export const SUPPORTED_WALLETS = {
    evm: ['metamask', 'walletconnect', 'coinbase', 'rainbow'],
    solana: ['phantom', 'solflare', 'backpack'],
    sui: ['sui-wallet', 'ethos', 'martian'],
} as const;
