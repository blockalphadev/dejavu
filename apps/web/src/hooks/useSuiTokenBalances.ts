import { useState, useEffect } from 'react';
import { useSuiClient } from '@mysten/dapp-kit';

export interface SuiTokenBalance {
    coinType: string;
    symbol: string;
    name: string;
    balance: number;
    decimals: number;
    coinObjectId?: string;
}

/**
 * Known coin types mapping for common tokens on Sui
 * These are the most common coin types on Sui mainnet
 */
const KNOWN_COIN_TYPES: Record<string, { symbol: string; name: string; decimals: number }> = {
    // Native SUI token
    '0x2::sui::SUI': { symbol: 'SUI', name: 'Sui', decimals: 9 },
    
    // USDC on Sui - multiple implementations exist
    // Native USDC (Celer)
    '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN': { 
        symbol: 'USDC', 
        name: 'USD Coin', 
        decimals: 6 
    },
    // Wormhole USDC
    '0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN': {
        symbol: 'USDC',
        name: 'USD Coin (Wormhole)',
        decimals: 6
    },
    
    // USDT on Sui
    '0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::usdt::USDT': {
        symbol: 'USDT',
        name: 'Tether',
        decimals: 6
    },
};

/**
 * Extract symbol from coin type
 * Format: 0x...::module::COIN or 0x...::module::SYMBOL
 */
function extractSymbolFromCoinType(coinType: string): string {
    const parts = coinType.split('::');
    if (parts.length >= 3) {
        // Try to get symbol from last part
        const lastPart = parts[parts.length - 1];
        if (lastPart !== 'COIN' && lastPart !== 'SUI') {
            return lastPart.toUpperCase();
        }
        // Otherwise use module name
        return parts[parts.length - 2].toUpperCase();
    }
    return 'UNKNOWN';
}

/**
 * Hook untuk membaca semua token balances dari Sui wallet
 * Termasuk SUI native dan semua coin lainnya (USDC, dll)
 */
export function useSuiTokenBalances(address: string | null) {
    const suiClient = useSuiClient();
    const [balances, setBalances] = useState<Record<string, SuiTokenBalance>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!address || !suiClient) {
            setBalances({});
            return;
        }

        const fetchAllBalances = async () => {
            setIsLoading(true);
            setError(null);

            try {
                console.log('[useSuiTokenBalances] Fetching balances for address:', address);
                
                // Get all balances from Sui wallet
                const allBalances = await suiClient.getAllBalances({
                    owner: address,
                });

                console.log('[useSuiTokenBalances] Raw balances:', allBalances);

                const balanceMap: Record<string, SuiTokenBalance> = {};

                for (const balance of allBalances) {
                    const coinType = balance.coinType;
                    const totalBalance = BigInt(balance.totalBalance);
                    
                    // Check if we know this coin type
                    const knownCoin = KNOWN_COIN_TYPES[coinType];
                    
                    let symbol: string;
                    let name: string;
                    let decimals: number;
                    
                    if (knownCoin) {
                        symbol = knownCoin.symbol;
                        name = knownCoin.name;
                        decimals = knownCoin.decimals;
                    } else {
                        // Try to extract from coin type
                        symbol = extractSymbolFromCoinType(coinType);
                        name = symbol;
                        decimals = 9; // Default to 9 (SUI decimals)
                    }

                    const balanceNumber = Number(totalBalance) / Math.pow(10, decimals);
                    
                    // Only include tokens with balance > 0
                    if (balanceNumber > 0) {
                        const key = `${symbol}-sui`;
                        balanceMap[key] = {
                            coinType,
                            symbol,
                            name,
                            balance: balanceNumber,
                            decimals,
                        };
                    }
                }

                console.log('[useSuiTokenBalances] Processed balances:', balanceMap);
                setBalances(balanceMap);
            } catch (err) {
                console.error('[useSuiTokenBalances] Failed to fetch Sui balances:', err);
                setError(err as Error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAllBalances();

        // Refresh every 15 seconds
        const interval = setInterval(fetchAllBalances, 15000);
        return () => clearInterval(interval);
    }, [address, suiClient]);

    return { balances, isLoading, error };
}

