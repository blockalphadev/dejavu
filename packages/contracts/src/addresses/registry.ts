/**
 * Contract Addresses Registry
 * 
 * Centralized registry for all deployed contract addresses
 * across supported chains and environments.
 */

import type { EVMChainId, SolanaCluster, SuiNetwork } from '../types/chains.js';

/**
 * EVM Contract Addresses by Chain ID
 */
export const EVM_ADDRESSES: Record<EVMChainId, {
    predictionMarket?: `0x${string}`;
    usdc?: `0x${string}`;
    usdt?: `0x${string}`;
}> = {
    // Ethereum Mainnet
    1: {
        predictionMarket: undefined, // Not yet deployed
        usdc: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        usdt: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    },
    // Goerli Testnet (deprecated)
    5: {
        predictionMarket: undefined,
        usdc: undefined,
        usdt: undefined,
    },
    // Sepolia Testnet
    11155111: {
        predictionMarket: undefined, // Deploy and add address
        usdc: undefined,
        usdt: undefined,
    },
    // Base Mainnet
    8453: {
        predictionMarket: undefined,
        usdc: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        usdt: undefined,
    },
    // Base Sepolia
    84532: {
        predictionMarket: undefined,
        usdc: undefined,
        usdt: undefined,
    },
    // Arbitrum One
    42161: {
        predictionMarket: undefined,
        usdc: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
        usdt: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    },
    // Arbitrum Sepolia
    421614: {
        predictionMarket: undefined,
        usdc: undefined,
        usdt: undefined,
    },
    // Optimism
    10: {
        predictionMarket: undefined,
        usdc: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
        usdt: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
    },
    // Optimism Sepolia
    11155420: {
        predictionMarket: undefined,
        usdc: undefined,
        usdt: undefined,
    },
    // Polygon
    137: {
        predictionMarket: undefined,
        usdc: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
        usdt: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    },
    // Mumbai Testnet
    80001: {
        predictionMarket: undefined,
        usdc: undefined,
        usdt: undefined,
    },
};

/**
 * Solana Program Addresses by Cluster
 */
export const SOLANA_PROGRAMS: Record<SolanaCluster, {
    predictionMarket?: string;
}> = {
    'mainnet-beta': {
        predictionMarket: undefined,
    },
    devnet: {
        predictionMarket: undefined, // Deploy and add program ID
    },
    testnet: {
        predictionMarket: undefined,
    },
    localnet: {
        predictionMarket: undefined,
    },
};

/**
 * Sui Package Addresses by Network
 */
export const SUI_PACKAGES: Record<SuiNetwork, {
    predictionMarket?: string;
}> = {
    mainnet: {
        predictionMarket: undefined,
    },
    testnet: {
        predictionMarket: undefined, // Deploy and add package ID
    },
    devnet: {
        predictionMarket: undefined,
    },
    localnet: {
        predictionMarket: undefined,
    },
};

/**
 * Get EVM contract address
 */
export function getEVMAddress(
    chainId: EVMChainId,
    contract: 'predictionMarket' | 'usdc' | 'usdt',
): `0x${string}` | undefined {
    return EVM_ADDRESSES[chainId]?.[contract];
}

/**
 * Get Solana program ID
 */
export function getSolanaProgram(
    cluster: SolanaCluster,
    program: 'predictionMarket',
): string | undefined {
    return SOLANA_PROGRAMS[cluster]?.[program];
}

/**
 * Get Sui package ID
 */
export function getSuiPackage(
    network: SuiNetwork,
    pkg: 'predictionMarket',
): string | undefined {
    return SUI_PACKAGES[network]?.[pkg];
}

/**
 * Check if contracts are deployed on a chain
 */
export function isChainSupported(chainId: EVMChainId): boolean {
    const addresses = EVM_ADDRESSES[chainId];
    return addresses?.predictionMarket !== undefined;
}
