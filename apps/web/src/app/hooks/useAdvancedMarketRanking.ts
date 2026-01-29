import { useState, useEffect, useCallback, useRef } from 'react';
import { useMarketSocket, MarketMessage } from '../../hooks/useMarketSocket';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

// Unified item type matching backend
interface RecommendedItem {
    id: string;
    type: 'news' | 'market' | 'signal' | 'sports';
    title: string;
    description: string;
    category: string;
    source: string;
    publishedAt: string;
    impact: string;
    sentiment: string;
    sentimentScore: number;
    relevanceScore: number;
    confidenceScore: number;
    imageUrl: string | null;
    url: string | null;
    tags: string[];
    volume: number;
    trendScore: number;
    _score?: number;
}

interface UseAdvancedMarketRankingResult {
    topMarkets: RecommendedItem[];
    forYouMarkets: RecommendedItem[];
    isLoading: boolean;
    error: Error | null;
    refresh: () => void;
}

/**
 * Advanced Market Ranking Hook
 * 
 * Fetches Top Markets (weighted algorithm) and For You (K-Means clustering)
 * from the backend recommendation engine with real-time updates.
 */
export function useAdvancedMarketRanking(): UseAdvancedMarketRankingResult {
    const [topMarkets, setTopMarkets] = useState<RecommendedItem[]>([]);
    const [forYouMarkets, setForYouMarkets] = useState<RecommendedItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Handle real-time socket updates
    const handleSocketMessage = useCallback((message: MarketMessage) => {
        if (message.type === 'new_item' || message.type === 'market_update') {
            const newItem = message.data?.item || message.data;
            if (!newItem?.id) return;

            // Add to appropriate list if high-scoring
            // This provides instant feedback while cache refreshes
            setTopMarkets(prev => {
                if (prev.some(m => m.id === newItem.id)) return prev;
                // Insert at appropriate position based on impact
                const formatted: RecommendedItem = {
                    id: newItem.id,
                    type: newItem.type || 'news',
                    title: newItem.title || '',
                    description: newItem.description || '',
                    category: message.category || newItem.category || 'latest',
                    source: newItem.source_name || newItem.source || 'unknown',
                    publishedAt: newItem.published_at || new Date().toISOString(),
                    impact: newItem.impact || 'medium',
                    sentiment: newItem.sentiment || 'neutral',
                    sentimentScore: newItem.sentiment_score || 0,
                    relevanceScore: newItem.relevance_score || 0.5,
                    confidenceScore: newItem.confidence_score || 0.5,
                    imageUrl: newItem.image_url || null,
                    url: newItem.url || null,
                    tags: newItem.tags || [],
                    volume: newItem.volume || 0,
                    trendScore: 0,
                };
                return [formatted, ...prev.slice(0, 19)]; // Keep max 20
            });
        }
    }, []);

    // Setup socket for real-time updates
    const { subscribe, unsubscribe, isConnected } = useMarketSocket({
        autoConnect: true,
        onMessage: handleSocketMessage
    });

    // Subscribe to trending/signals channel for updates
    useEffect(() => {
        if (isConnected) {
            subscribe('signals' as any);
        }
        return () => {
            unsubscribe('signals' as any);
        };
    }, [isConnected, subscribe, unsubscribe]);

    // Fetch data function
    const fetchData = useCallback(async () => {
        // Abort previous request if still pending
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        setIsLoading(true);
        setError(null);

        try {
            // Fetch both endpoints in parallel
            const [topResponse, forYouResponse] = await Promise.all([
                fetch(`${API_URL}/recommendations/top-markets?limit=20`, {
                    signal: abortControllerRef.current.signal,
                    headers: {
                        'Accept': 'application/json',
                        'Cache-Control': 'no-cache',
                    },
                }),
                fetch(`${API_URL}/recommendations/for-you?limit=20`, {
                    signal: abortControllerRef.current.signal,
                    headers: {
                        'Accept': 'application/json',
                        'Cache-Control': 'no-cache',
                    },
                }),
            ]);

            if (!topResponse.ok) {
                throw new Error(`Top Markets fetch failed: ${topResponse.status}`);
            }
            if (!forYouResponse.ok) {
                throw new Error(`For You fetch failed: ${forYouResponse.status}`);
            }

            const [topData, forYouData] = await Promise.all([
                topResponse.json(),
                forYouResponse.json(),
            ]);

            setTopMarkets(Array.isArray(topData) ? topData : []);
            setForYouMarkets(Array.isArray(forYouData) ? forYouData : []);

        } catch (err) {
            if ((err as Error).name === 'AbortError') {
                // Request was aborted, ignore
                return;
            }
            console.error('Advanced Market Ranking fetch error:', err);
            setError(err instanceof Error ? err : new Error('Failed to fetch recommendations'));
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Initial fetch and periodic refresh
    useEffect(() => {
        fetchData();

        // Refresh every 2 minutes (backend cache is 1 minute)
        const refreshInterval = setInterval(fetchData, 120000);

        return () => {
            clearInterval(refreshInterval);
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [fetchData]);

    // Manual refresh function
    const refresh = useCallback(() => {
        fetchData();
    }, [fetchData]);

    return {
        topMarkets,
        forYouMarkets,
        isLoading,
        error,
        refresh,
    };
}
