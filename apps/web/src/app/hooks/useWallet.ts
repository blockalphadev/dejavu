import { useState, useEffect, useCallback } from 'react';
import { createWalletClient, custom, WalletClient, Address } from 'viem';
import { sepolia } from 'viem/chains';

export interface UseWalletReturn {
    address: Address | null;
    isConnected: boolean;
    isConnecting: boolean;
    error: string | null;
    walletClient: WalletClient | null;
    connect: () => Promise<void>;
    disconnect: () => void;
    chainId: number | null;
}

export function useWallet(): UseWalletReturn {
    const [address, setAddress] = useState<Address | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [walletClient, setWalletClient] = useState<WalletClient | null>(null);
    const [chainId, setChainId] = useState<number | null>(null);

    // Helper to safely get ethereum provider
    const getEthereumProvider = useCallback(() => {
        if (typeof window === 'undefined') return null;
        
        try {
            // Try to access window.ethereum safely
            return window.ethereum;
        } catch (err) {
            // If access fails, try alternative methods
            try {
                // Some wallets expose providers differently
                return (window as any).ethereum || (window as any).web3?.currentProvider;
            } catch {
                return null;
            }
        }
    }, []);

    // Initialize checking for existing connection
    useEffect(() => {
        const checkConnection = async () => {
            const provider = getEthereumProvider();
            if (provider) {
                try {
                    const client = createWalletClient({
                        chain: sepolia, // Defaulting to Sepolia for dev
                        transport: custom(provider)
                    });

                    const [connectedAddress] = await client.requestAddresses();
                    if (connectedAddress) {
                        setAddress(connectedAddress);
                        setWalletClient(client);
                        const id = await client.getChainId();
                        setChainId(id);
                    }
                } catch (err) {
                    // Start fresh if no permission
                    console.debug('No existing wallet permission');
                }
            }
        };

        checkConnection();
    }, [getEthereumProvider]);

    // Listen for account changes
    useEffect(() => {
        const provider = getEthereumProvider();
        if (provider && typeof provider.on === 'function') {
            const handleAccountsChanged = (accounts: string[]) => {
                if (accounts.length > 0) {
                    setAddress(accounts[0] as Address);
                } else {
                    setAddress(null);
                    setWalletClient(null);
                }
            };

            const handleChainChanged = (id: string) => {
                setChainId(parseInt(id, 16));
            };

            provider.on('accountsChanged', handleAccountsChanged);
            provider.on('chainChanged', handleChainChanged);

            return () => {
                if (typeof provider.removeListener === 'function') {
                    provider.removeListener('accountsChanged', handleAccountsChanged);
                    provider.removeListener('chainChanged', handleChainChanged);
                }
            };
        }
    }, [getEthereumProvider]);

    const connect = useCallback(async () => {
        setIsConnecting(true);
        setError(null);
        try {
            const provider = getEthereumProvider();
            if (!provider) {
                throw new Error('No crypto wallet found. Please install MetaMask.');
            }

            const client = createWalletClient({
                chain: sepolia,
                transport: custom(provider)
            });

            const [connectedAddress] = await client.requestAddresses();

            setAddress(connectedAddress);
            setWalletClient(client);
            const id = await client.getChainId();
            setChainId(id);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to connect wallet';
            setError(message);
            console.error(err);
        } finally {
            setIsConnecting(false);
        }
    }, [getEthereumProvider]);

    const disconnect = useCallback(() => {
        setAddress(null);
        setWalletClient(null);
        // Note: You can't programmatically disconnect from MetaMask, but we clear local state
    }, []);

    return {
        address,
        isConnected: !!address,
        isConnecting,
        error,
        walletClient,
        connect,
        disconnect,
        chainId
    };
}

// Add global type for window.ethereum
declare global {
    interface Window {
        ethereum?: {
            request: (args: { method: string; params?: any[] }) => Promise<any>;
            isMetaMask?: boolean;
            on?: (event: string, handler: (...args: any[]) => void) => void;
            removeListener?: (event: string, handler: (...args: any[]) => void) => void;
        };
    }
}
