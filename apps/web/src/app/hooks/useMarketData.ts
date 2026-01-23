
import { useState, useEffect } from 'react';
import { MOCK_MARKETS, MOCK_SIGNALS, Market, Signal } from '../utils/mockData';

// Simulated API delay for realism and to test loading states
const SIMULATED_DELAY = 600;

interface UseMarketDataOptions {
    category: string;
    searchQuery?: string;
}

interface UseMarketDataResult {
    markets: Market[];
    signals: Signal[];
    isLoading: boolean;
    error: Error | null;
}

export function useMarketData({ category, searchQuery = "" }: UseMarketDataOptions): UseMarketDataResult {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [data, setData] = useState<{ markets: Market[], signals: Signal[] }>({ markets: [], signals: [] });

    useEffect(() => {
        let isMounted = true;
        setIsLoading(true);
        setError(null);

        // Simulate secure API call with anti-throttling (debounce/delay can be handled by caller or here)
        const timer = setTimeout(() => {
            try {
                const query = searchQuery.toLowerCase();

                let filteredMarkets: Market[] = [];
                let filteredSignals: Signal[] = [];

                if (category === 'signals') {
                    filteredSignals = MOCK_SIGNALS.filter(s =>
                        s.title.toLowerCase().includes(query) ||
                        s.tags.some(tag => tag.toLowerCase().includes(query))
                    );
                } else {
                    filteredMarkets = MOCK_MARKETS.filter(m => {
                        // Category Filter
                        let matchesCategory = false;
                        if (category === 'top_pics') matchesCategory = !!m.isTopPick;
                        else if (category === 'for_you') matchesCategory = !!m.isForYou;
                        else if (category === 'latest') matchesCategory = true;
                        else matchesCategory = m.category === category;

                        // Search Filter
                        const matchesSearch = m.title.toLowerCase().includes(query);

                        return matchesCategory && matchesSearch;
                    });
                }

                if (isMounted) {
                    setData({ markets: filteredMarkets, signals: filteredSignals });
                    setIsLoading(false);
                }
            } catch (err) {
                if (isMounted) {
                    setError(err instanceof Error ? err : new Error('Failed to fetch market data'));
                    setIsLoading(false);
                }
            }
        }, SIMULATED_DELAY);

        return () => {
            isMounted = false;
            clearTimeout(timer);
        };
    }, [category, searchQuery]);

    return {
        markets: data.markets,
        signals: data.signals,
        isLoading,
        error
    };
}
