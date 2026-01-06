/**
 * Blockchain Chain Types
 *
 * Type definitions for supported blockchains
 */

/**
 * Supported chain identifiers
 */
export type ChainId =
    | 'ethereum'
    | 'base'
    | 'solana'
    | 'sui'
    | 'polygon'
    | 'arbitrum'
    | 'optimism';

/**
 * Chain family types
 */
export type ChainType = 'evm' | 'solana' | 'sui';

/**
 * Network type
 */
export type NetworkType = 'mainnet' | 'testnet' | 'devnet';

/**
 * Native currency configuration
 */
export interface NativeCurrency {
    name: string;
    symbol: string;
    decimals: number;
}

/**
 * Chain configuration
 */
export interface ChainConfig {
    id: ChainId;
    chainId: number | string; // Numeric for EVM, string for others
    type: ChainType;
    name: string;
    shortName: string;
    network: NetworkType;
    nativeCurrency: NativeCurrency;
    rpcUrls: {
        default: string;
        public?: string;
        websocket?: string;
    };
    blockExplorers: {
        default: {
            name: string;
            url: string;
        };
    };
    contracts?: {
        multicall3?: string;
        predictionMarket?: string;
    };
    isTestnet: boolean;
    iconUrl?: string;
}

/**
 * Wallet address with chain context
 */
export interface WalletAddress {
    address: string;
    chain: ChainType;
    chainId: ChainId;
    isPrimary: boolean;
    label?: string;
    verifiedAt?: Date;
}

/**
 * Transaction hash with chain context
 */
export interface ChainTransaction {
    hash: string;
    chainId: ChainId;
    blockNumber?: number;
    timestamp?: Date;
}

/**
 * Signature types
 */
export type SignatureType = 'personal_sign' | 'eth_signTypedData_v4' | 'solana_sign' | 'sui_sign';

/**
 * Signed message
 */
export interface SignedMessage {
    message: string;
    signature: string;
    signatureType: SignatureType;
    signer: string;
    chainId: ChainId;
}
