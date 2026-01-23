import { ReactNode } from 'react';
import { createNetworkConfig, SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Config untuk network (mainnet/testnet/devnet)
const { networkConfig } = createNetworkConfig({
    mainnet: { url: getFullnodeUrl('mainnet') },
    testnet: { url: getFullnodeUrl('testnet') },
    devnet: { url: getFullnodeUrl('devnet') },
});

// Get default network from environment variable, fallback to mainnet
const getDefaultNetwork = (): 'mainnet' | 'testnet' | 'devnet' => {
    const envNetwork = import.meta.env.VITE_SUI_NETWORK;
    if (envNetwork === 'testnet' || envNetwork === 'devnet' || envNetwork === 'mainnet') {
        return envNetwork;
    }
    return 'mainnet';
};

// Create a separate QueryClient for Sui to avoid conflicts
const suiQueryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
        },
    },
});

interface SuiWalletProviderProps {
    children: ReactNode;
}

/**
 * SuiWalletProvider - Wraps the app with Sui wallet context
 * This enables connection to Sui wallets like Slush, Sui Wallet, etc.
 */
export function SuiWalletProvider({ children }: SuiWalletProviderProps) {
    const defaultNetwork = getDefaultNetwork();
    
    return (
        <QueryClientProvider client={suiQueryClient}>
            <SuiClientProvider networks={networkConfig} defaultNetwork={defaultNetwork}>
                <WalletProvider
                    autoConnect={false}
                    preferredWallets={['Slush', 'Sui Wallet']}
                >
                    {children}
                </WalletProvider>
            </SuiClientProvider>
        </QueryClientProvider>
    );
}

// Re-export hooks from dapp-kit for convenience
export {
    useCurrentAccount,
    useCurrentWallet,
    useWallets,
    useConnectWallet,
    useDisconnectWallet,
    useSignAndExecuteTransaction,
    useSuiClient,
} from '@mysten/dapp-kit';

