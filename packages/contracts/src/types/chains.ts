/**
 * Supported Blockchain Networks
 * 
 * Comprehensive type definitions for multi-chain support
 */

export type EVMChainId =
    | 1          // Ethereum Mainnet
    | 5          // Goerli Testnet
    | 11155111   // Sepolia Testnet
    | 8453       // Base Mainnet
    | 84532      // Base Sepolia
    | 42161      // Arbitrum One
    | 421614     // Arbitrum Sepolia
    | 10         // Optimism
    | 11155420   // Optimism Sepolia
    | 137        // Polygon
    | 80001;     // Mumbai

export type SolanaCluster = 'mainnet-beta' | 'devnet' | 'testnet' | 'localnet';
export type SuiNetwork = 'mainnet' | 'testnet' | 'devnet' | 'localnet';

export type ChainType = 'evm' | 'solana' | 'sui';

/**
 * Chain Configuration
 */
export interface ChainConfig {
    id: string;
    name: string;
    type: ChainType;
    isTestnet: boolean;
    nativeCurrency: {
        name: string;
        symbol: string;
        decimals: number;
    };
    rpcUrls: string[];
    blockExplorerUrls?: string[];
    iconUrl?: string;
}

/**
 * EVM Chain Configuration
 */
export interface EVMChainConfig extends ChainConfig {
    type: 'evm';
    chainId: EVMChainId;
    contracts: {
        predictionMarket?: `0x${string}`;
        usdc?: `0x${string}`;
        usdt?: `0x${string}`;
    };
}

/**
 * Solana Chain Configuration
 */
export interface SolanaChainConfig extends ChainConfig {
    type: 'solana';
    cluster: SolanaCluster;
    programs: {
        predictionMarket?: string;
    };
}

/**
 * Sui Chain Configuration
 */
export interface SuiChainConfig extends ChainConfig {
    type: 'sui';
    network: SuiNetwork;
    packages: {
        predictionMarket?: string;
    };
}

export type SupportedChainConfig = EVMChainConfig | SolanaChainConfig | SuiChainConfig;

/**
 * Market Types
 */
export interface OnChainMarket {
    id: string;
    creator: string;
    title: string;
    description: string;
    endTime: bigint;
    resolutionTime: bigint;
    totalYesShares: bigint;
    totalNoShares: bigint;
    resolved: boolean;
    outcome: boolean | null;
    collateralToken: string;
    chain: ChainType;
    chainId: string;
}

export interface Position {
    marketId: string;
    user: string;
    yesShares: bigint;
    noShares: bigint;
    chain: ChainType;
}

/**
 * Transaction Types
 */
export interface TransactionRequest {
    type: 'createMarket' | 'buyShares' | 'sellShares' | 'addLiquidity' | 'removeLiquidity' | 'resolveMarket' | 'claimWinnings';
    chainType: ChainType;
    params: Record<string, unknown>;
}

export interface TransactionResult {
    hash: string;
    chainType: ChainType;
    status: 'pending' | 'confirmed' | 'failed';
    blockNumber?: number;
    gasUsed?: bigint;
    error?: string;
}

/**
 * Price Quote
 */
export interface PriceQuote {
    marketId: string;
    yesPrice: number; // 0-1
    noPrice: number;  // 0-1
    timestamp: number;
    source: 'chain' | 'cache';
}

/**
 * Liquidity Info
 */
export interface LiquidityInfo {
    marketId: string;
    totalLiquidity: bigint;
    userLpTokens?: bigint;
    userShare?: number;
}
