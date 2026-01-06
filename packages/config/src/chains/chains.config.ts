/**
 * Chain Configurations
 * 
 * Comprehensive configuration for all supported blockchain networks.
 * Includes RPC endpoints, block explorers, and native currencies.
 */

export interface ChainInfo {
    id: number | string;
    name: string;
    shortName: string;
    type: 'evm' | 'solana' | 'sui';
    isTestnet: boolean;
    nativeCurrency: {
        name: string;
        symbol: string;
        decimals: number;
    };
    rpcUrls: {
        public: string[];
        private?: string[];
    };
    blockExplorer?: {
        name: string;
        url: string;
        apiUrl?: string;
    };
    iconUrl?: string;
    averageBlockTime?: number; // in milliseconds
}

/**
 * EVM Chains Configuration
 */
export const EVM_CHAINS: Record<number, ChainInfo> = {
    // ==================
    // Mainnets
    // ==================
    1: {
        id: 1,
        name: 'Ethereum',
        shortName: 'eth',
        type: 'evm',
        isTestnet: false,
        nativeCurrency: {
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18,
        },
        rpcUrls: {
            public: [
                'https://eth.llamarpc.com',
                'https://rpc.ankr.com/eth',
                'https://ethereum.publicnode.com',
            ],
        },
        blockExplorer: {
            name: 'Etherscan',
            url: 'https://etherscan.io',
            apiUrl: 'https://api.etherscan.io/api',
        },
        iconUrl: 'https://icons.llamao.fi/icons/chains/rsz_ethereum.jpg',
        averageBlockTime: 12000,
    },
    8453: {
        id: 8453,
        name: 'Base',
        shortName: 'base',
        type: 'evm',
        isTestnet: false,
        nativeCurrency: {
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18,
        },
        rpcUrls: {
            public: [
                'https://mainnet.base.org',
                'https://base.llamarpc.com',
                'https://base.publicnode.com',
            ],
        },
        blockExplorer: {
            name: 'Basescan',
            url: 'https://basescan.org',
            apiUrl: 'https://api.basescan.org/api',
        },
        iconUrl: 'https://icons.llamao.fi/icons/chains/rsz_base.jpg',
        averageBlockTime: 2000,
    },
    42161: {
        id: 42161,
        name: 'Arbitrum One',
        shortName: 'arb1',
        type: 'evm',
        isTestnet: false,
        nativeCurrency: {
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18,
        },
        rpcUrls: {
            public: [
                'https://arb1.arbitrum.io/rpc',
                'https://arbitrum.llamarpc.com',
            ],
        },
        blockExplorer: {
            name: 'Arbiscan',
            url: 'https://arbiscan.io',
            apiUrl: 'https://api.arbiscan.io/api',
        },
        iconUrl: 'https://icons.llamao.fi/icons/chains/rsz_arbitrum.jpg',
        averageBlockTime: 250,
    },
    10: {
        id: 10,
        name: 'Optimism',
        shortName: 'oeth',
        type: 'evm',
        isTestnet: false,
        nativeCurrency: {
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18,
        },
        rpcUrls: {
            public: [
                'https://mainnet.optimism.io',
                'https://optimism.llamarpc.com',
            ],
        },
        blockExplorer: {
            name: 'Optimistic Etherscan',
            url: 'https://optimistic.etherscan.io',
        },
        iconUrl: 'https://icons.llamao.fi/icons/chains/rsz_optimism.jpg',
        averageBlockTime: 2000,
    },
    137: {
        id: 137,
        name: 'Polygon',
        shortName: 'matic',
        type: 'evm',
        isTestnet: false,
        nativeCurrency: {
            name: 'MATIC',
            symbol: 'MATIC',
            decimals: 18,
        },
        rpcUrls: {
            public: [
                'https://polygon-rpc.com',
                'https://polygon.llamarpc.com',
            ],
        },
        blockExplorer: {
            name: 'Polygonscan',
            url: 'https://polygonscan.com',
        },
        iconUrl: 'https://icons.llamao.fi/icons/chains/rsz_polygon.jpg',
        averageBlockTime: 2000,
    },

    // ==================
    // Testnets
    // ==================
    11155111: {
        id: 11155111,
        name: 'Sepolia',
        shortName: 'sep',
        type: 'evm',
        isTestnet: true,
        nativeCurrency: {
            name: 'Sepolia Ether',
            symbol: 'ETH',
            decimals: 18,
        },
        rpcUrls: {
            public: [
                'https://rpc.sepolia.org',
                'https://sepolia.drpc.org',
            ],
        },
        blockExplorer: {
            name: 'Sepolia Etherscan',
            url: 'https://sepolia.etherscan.io',
        },
        averageBlockTime: 12000,
    },
    84532: {
        id: 84532,
        name: 'Base Sepolia',
        shortName: 'basesep',
        type: 'evm',
        isTestnet: true,
        nativeCurrency: {
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18,
        },
        rpcUrls: {
            public: ['https://sepolia.base.org'],
        },
        blockExplorer: {
            name: 'Base Sepolia Explorer',
            url: 'https://sepolia-explorer.base.org',
        },
        averageBlockTime: 2000,
    },
};

/**
 * Solana Cluster Configuration
 */
export const SOLANA_CLUSTERS: Record<string, ChainInfo> = {
    'mainnet-beta': {
        id: 'mainnet-beta',
        name: 'Solana Mainnet',
        shortName: 'sol',
        type: 'solana',
        isTestnet: false,
        nativeCurrency: {
            name: 'Solana',
            symbol: 'SOL',
            decimals: 9,
        },
        rpcUrls: {
            public: ['https://api.mainnet-beta.solana.com'],
        },
        blockExplorer: {
            name: 'Solscan',
            url: 'https://solscan.io',
        },
        iconUrl: 'https://icons.llamao.fi/icons/chains/rsz_solana.jpg',
        averageBlockTime: 400,
    },
    devnet: {
        id: 'devnet',
        name: 'Solana Devnet',
        shortName: 'soldev',
        type: 'solana',
        isTestnet: true,
        nativeCurrency: {
            name: 'Solana',
            symbol: 'SOL',
            decimals: 9,
        },
        rpcUrls: {
            public: ['https://api.devnet.solana.com'],
        },
        blockExplorer: {
            name: 'Solscan Devnet',
            url: 'https://solscan.io?cluster=devnet',
        },
        averageBlockTime: 400,
    },
};

/**
 * Sui Network Configuration
 */
export const SUI_NETWORKS: Record<string, ChainInfo> = {
    mainnet: {
        id: 'mainnet',
        name: 'Sui Mainnet',
        shortName: 'sui',
        type: 'sui',
        isTestnet: false,
        nativeCurrency: {
            name: 'Sui',
            symbol: 'SUI',
            decimals: 9,
        },
        rpcUrls: {
            public: ['https://fullnode.mainnet.sui.io:443'],
        },
        blockExplorer: {
            name: 'Suiscan',
            url: 'https://suiscan.xyz',
        },
        iconUrl: 'https://icons.llamao.fi/icons/chains/rsz_sui.jpg',
        averageBlockTime: 500,
    },
    testnet: {
        id: 'testnet',
        name: 'Sui Testnet',
        shortName: 'suitest',
        type: 'sui',
        isTestnet: true,
        nativeCurrency: {
            name: 'Sui',
            symbol: 'SUI',
            decimals: 9,
        },
        rpcUrls: {
            public: ['https://fullnode.testnet.sui.io:443'],
        },
        blockExplorer: {
            name: 'Suiscan Testnet',
            url: 'https://testnet.suiscan.xyz',
        },
        averageBlockTime: 500,
    },
};

/**
 * Get chain info by ID
 */
export function getChainById(chainId: number | string): ChainInfo | undefined {
    if (typeof chainId === 'number') {
        return EVM_CHAINS[chainId];
    }
    return SOLANA_CLUSTERS[chainId] || SUI_NETWORKS[chainId];
}

/**
 * Get all supported chains
 */
export function getAllChains(options?: { includeTestnets?: boolean }): ChainInfo[] {
    const { includeTestnets = false } = options || {};

    const allChains = [
        ...Object.values(EVM_CHAINS),
        ...Object.values(SOLANA_CLUSTERS),
        ...Object.values(SUI_NETWORKS),
    ];

    if (includeTestnets) {
        return allChains;
    }

    return allChains.filter(chain => !chain.isTestnet);
}

/**
 * Get mainnet chains only
 */
export function getMainnetChains(): ChainInfo[] {
    return getAllChains({ includeTestnets: false });
}

/**
 * Get EVM chains by type
 */
export function getEVMChains(options?: { includeTestnets?: boolean }): ChainInfo[] {
    const { includeTestnets = false } = options || {};
    return Object.values(EVM_CHAINS).filter(
        chain => includeTestnets || !chain.isTestnet
    );
}
