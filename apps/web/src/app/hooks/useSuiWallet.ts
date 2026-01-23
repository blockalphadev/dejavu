import { useCallback, useMemo, useEffect, useState } from 'react';
import {
    useCurrentAccount,
    useCurrentWallet,
    useWallets,
    useConnectWallet,
    useDisconnectWallet,
    useSuiClient,
} from '@mysten/dapp-kit';
import { useTokenBalances } from '../../hooks/useTokenBalances';
import { useSuiTokenBalances, SuiTokenBalance } from '../../hooks/useSuiTokenBalances';

interface SuiWalletState {
    /** Connected wallet address */
    address: string | null;
    /** Whether wallet is connected */
    isConnected: boolean;
    /** Whether connection is in progress */
    isConnecting: boolean;
    /** SUI balance (native token) */
    suiBalance: number;
    /** All token balances from Sui wallet (SUI, USDC, etc.) */
    tokenBalances: Record<string, SuiTokenBalance>;
    /** Whether balance is loading */
    isBalanceLoading: boolean;
    /** Current connected wallet info */
    currentWallet: ReturnType<typeof useCurrentWallet>['currentWallet'];
    /** All available wallets installed in browser */
    availableWallets: ReturnType<typeof useWallets>;
    /** Connect to a specific wallet (by name or instance) */
    connectWallet: (walletNameOrInstance?: string | ReturnType<typeof useWallets>[0]) => void;
    /** Connect specifically to Slush wallet */
    connectSlush: () => void;
    /** Disconnect current wallet */
    disconnect: () => void;
    /** Error message if any */
    error: string | null;
}

/**
 * useSuiWallet - Hook for managing Sui wallet connection and balance
 * 
 * Features:
 * - Auto-detects all installed Sui wallets (Slush, Sui Wallet, Ethos, etc.)
 * - Fetches SUI balance automatically when connected
 * - Provides connect/disconnect functions
 * 
 * @example
 * ```tsx
 * const { address, suiBalance, connectSlush, isConnected } = useSuiWallet();
 * 
 * if (isConnected) {
 *   return <div>Balance: {suiBalance} SUI</div>;
 * }
 * 
 * return <button onClick={connectSlush}>Connect Slush</button>;
 * ```
 */
export function useSuiWallet(): SuiWalletState {
    const currentAccount = useCurrentAccount();
    const { currentWallet } = useCurrentWallet();
    const wallets = useWallets();
    const { mutate: connect, isPending: isConnecting, error: connectError } = useConnectWallet();
    const { mutate: disconnectWallet } = useDisconnectWallet();
    const suiClient = useSuiClient();

    const [error, setError] = useState<string | null>(null);

    // Get address from current account
    const address = currentAccount?.address ?? null;
    const isConnected = !!currentAccount;

    // Fetch all token balances from Sui wallet (SUI, USDC, etc.)
    const { balances: suiTokenBalances, isLoading: isSuiBalanceLoading } = useSuiTokenBalances(address);
    
    // Also fetch from legacy hook for compatibility
    const { balances: legacyBalances, isLoading: isLegacyBalanceLoading } = useTokenBalances({
        suiAddress: address ?? undefined,
    });

    // SUI balance (native token) - prefer from new hook, fallback to legacy
    const suiBalance = suiTokenBalances['SUI-sui']?.balance ?? legacyBalances['SUI-sui'] ?? 0;
    
    // Combined loading state
    const isBalanceLoading = isSuiBalanceLoading || isLegacyBalanceLoading;

    // Debug: Log when wallets are detected
    useEffect(() => {
        console.log('[SuiWallet] Wallets detected:', wallets.length, wallets.map(w => w.name));
    }, [wallets]);

    // Debug: Log connection status changes
    useEffect(() => {
        console.log('[SuiWallet] Connection status:', { isConnected, address, isConnecting });
    }, [isConnected, address, isConnecting]);

    // Clear error when connected
    useEffect(() => {
        if (isConnected) {
            setError(null);
            console.log('[SuiWallet] Successfully connected to:', address);
        }
    }, [isConnected, address]);

    // Set error from connect mutation
    useEffect(() => {
        if (connectError) {
            const errorMessage = connectError instanceof Error ? connectError.message : 'Failed to connect wallet';
            console.error('[SuiWallet] Connection error:', errorMessage);
            setError(errorMessage);
        }
    }, [connectError]);

    /**
     * Connect to a specific wallet
     * Can pass wallet name (string) or wallet instance
     */
    const connectWallet = useCallback((walletNameOrInstance?: string | ReturnType<typeof useWallets>[0]) => {
        setError(null);

        // If no argument, let user choose from available wallets
        if (!walletNameOrInstance) {
            if (wallets.length === 0) {
                setError('No Sui wallets found. Please install Slush Wallet or Sui Wallet.');
                return;
            }
            // Connect to first available wallet
            connect({ wallet: wallets[0] });
            return;
        }

        // If it's a string (wallet name), find the wallet
        if (typeof walletNameOrInstance === 'string') {
            const wallet = wallets.find(w =>
                w.name.toLowerCase().includes(walletNameOrInstance.toLowerCase())
            );

            if (!wallet) {
                setError(`${walletNameOrInstance} wallet not found. Please install it first.`);
                return;
            }

            connect({ wallet });
            return;
        }

        // If it's a wallet instance, connect directly
        connect({ wallet: walletNameOrInstance });
    }, [wallets, connect]);

    /**
     * Connect specifically to Slush wallet
     * Forces wallet to show account selection UI by using wallet features directly
     */
    const connectSlush = useCallback(async () => {
        setError(null);

        // Debug: log available wallets
        console.log('[SuiWallet] Available wallets:', wallets.map(w => w.name));
        console.log('[SuiWallet] Wallet features:', wallets.map(w => ({ name: w.name, features: Object.keys(w.features) })));

        if (wallets.length === 0) {
            console.log('[SuiWallet] No wallets detected yet. Opening install prompt...');
            setError('No Sui wallets found. Please install Slush Wallet from https://slush.app');
            window.open('https://slush.app', '_blank');
            return;
        }

        // Find Slush wallet
        const slushWallet = wallets.find(w =>
            w.name.toLowerCase().includes('slush')
        );

        const targetWallet = slushWallet || wallets.find(w =>
            w.name.toLowerCase().includes('sui') ||
            w.name.toLowerCase().includes('ethos') ||
            w.name.toLowerCase().includes('martian')
        ) || wallets[0];

        if (!targetWallet) {
            setError('No compatible wallet found');
            return;
        }

        console.log('[SuiWallet] Target wallet:', targetWallet.name);

        // First, FULLY disconnect to clear any cached permissions
        if (currentWallet) {
            console.log('[SuiWallet] Disconnecting current wallet...');
            disconnectWallet();
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        // Use dapp-kit connect directly - it handles wallet connection properly
        // Direct wallet connect can cause state sync issues, so we use dapp-kit's connect
        console.log('[SuiWallet] Using dapp-kit connect...');
        connect({ wallet: targetWallet });
    }, [wallets, connect, currentWallet, disconnectWallet]);

    /**
     * Disconnect current wallet
     */
    const disconnect = useCallback(() => {
        disconnectWallet();
        setError(null);
    }, [disconnectWallet]);

    // Memoize available wallets to show in UI
    const availableWallets = useMemo(() => wallets, [wallets]);

    return {
        address,
        isConnected,
        isConnecting,
        suiBalance,
        tokenBalances: suiTokenBalances,
        isBalanceLoading,
        currentWallet,
        availableWallets,
        connectWallet,
        connectSlush,
        disconnect,
        error,
    };
}

/**
 * Format SUI balance for display
 */
export function formatSuiBalance(balance: number, decimals: number = 4): string {
    if (balance === 0) return '0';
    if (balance < 0.0001) return '< 0.0001';
    return balance.toFixed(decimals);
}

/**
 * Shorten address for display
 */
export function shortenAddress(address: string, chars: number = 4): string {
    if (!address) return '';
    return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

