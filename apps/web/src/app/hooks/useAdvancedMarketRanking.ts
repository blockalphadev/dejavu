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

interface UseAdvancedMarketRankingOptions {
    target?: 'top_markets' | 'for_you' | 'both';
}

interface UseAdvancedMarketRankingResult {
    topMarkets: RecommendedItem[];
    forYouMarkets: RecommendedItem[];
    isLoading: boolean;
    error: Error | null;
    refresh: () => void;
    loadMore: () => void;
    hasMore: boolean;
}

/**
 * Advanced Market Ranking Hook
 * 
 * Fetches Top Markets (weighted algorithm) and For You (K-Means clustering)
 * from the backend recommendation engine with real-time updates and pagination.
 */
export function useAdvancedMarketRanking({ target = 'both' }: UseAdvancedMarketRankingOptions = {}): UseAdvancedMarketRankingResult {
    const [topMarkets, setTopMarkets] = useState<RecommendedItem[]>([]);
    const [forYouMarkets, setForYouMarkets] = useState<RecommendedItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const LIMIT = 20;

    // Handle real-time socket updates
    const handleSocketMessage = useCallback((message: MarketMessage) => {
        if (message.type === 'new_item' || message.type === 'market_update') {
            const newItem = message.data?.item || message.data;
            if (!newItem?.id) return;

            // Helper to format item
            const formatItem = (item: any): RecommendedItem => ({
                id: item.id,
                type: item.type || 'news',
                title: item.title || '',
                description: item.description || '',
                category: message.category || item.category || 'latest',
                source: item.source_name || item.source || 'unknown',
                publishedAt: item.published_at || new Date().toISOString(),
                impact: item.impact || 'medium',
                sentiment: item.sentiment || 'neutral',
                sentimentScore: item.sentiment_score || 0,
                relevanceScore: item.relevance_score || 0.5,
                confidenceScore: item.confidence_score || 0.5,
                imageUrl: item.image_url || null,
                url: item.url || null,
                tags: item.tags || [],
                volume: item.volume || 0,
                trendScore: 0,
            });

            const formatted = formatItem(newItem);

            // Update topMarkets if relevant
            if (target === 'top_markets' || target === 'both') {
                setTopMarkets(prev => {
                    if (prev.some(m => m.id === newItem.id)) return prev;
                    return [formatted, ...prev];
                });
            }

            // Update forYouMarkets if relevant
            if (target === 'for_you' || target === 'both') {
                setForYouMarkets(prev => {
                    if (prev.some(m => m.id === newItem.id)) return prev;
                    return [formatted, ...prev];
                });
            }
        }
    }, [target]);

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
    const fetchData = useCallback(async (pageNum: number) => {
        // Only abort if it's a NEW search/refresh (page 0), not pagination
        // Actually we want to properly manage aborts per fetch call
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        setIsLoading(true);
        setError(null);

        try {
            const offset = pageNum * LIMIT;
            const promises = [];

            if (target === 'top_markets' || target === 'both') {
                promises.push(fetch(`${API_URL}/recommendations/top-markets?limit=${LIMIT}&offset=${offset}`, {
                    signal: abortControllerRef.current.signal,
                    headers: { 'Accept': 'application/json' },
                }).then(res => res.json().then(data => ({ type: 'top', data, ok: res.ok }))));
            }

            if (target === 'for_you' || target === 'both') {
                promises.push(fetch(`${API_URL}/recommendations/for-you?limit=${LIMIT}&offset=${offset}`, {
                    signal: abortControllerRef.current.signal,
                    headers: { 'Accept': 'application/json' },
                }).then(res => res.json().then(data => ({ type: 'forYou', data, ok: res.ok }))));
            }

            const results = await Promise.all(promises);

            let newItemsCount = 0;

            results.forEach(result => {
                if (!result.ok) throw new Error(`Fetch failed for ${result.type}`);

                const items = Array.isArray(result.data) ? result.data : (result.data.data || []);
                newItemsCount = Math.max(newItemsCount, items.length);

                if (result.type === 'top') {
                    setTopMarkets(prev => pageNum === 0 ? items : [...prev, ...items]);
                } else if (result.type === 'forYou') {
                    setForYouMarkets(prev => pageNum === 0 ? items : [...prev, ...items]);
                }
            });

            // Check if we have more pages
            if (newItemsCount < LIMIT) {
                setHasMore(false);
            } else {
                setHasMore(true);
            }

        } catch (err) {
            if ((err as Error).name === 'AbortError') return;
            console.error('Advanced Market Ranking fetch error:', err);
            setError(err instanceof Error ? err : new Error('Failed to fetch recommendations'));
        } finally {
            setIsLoading(false);
        }
    }, [target]);

    // Initial fetch
    useEffect(() => {
        setPage(0);
        setHasMore(true);
        fetchData(0);

        // Refresh every 2 minutes (only if on page 0 to avoid jitter)
        const refreshInterval = setInterval(() => {
            if (page === 0) fetchData(0);
        }, 120000);

        return () => {
            clearInterval(refreshInterval);
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [fetchData]); // Dependency on fetchData which depends on target

    // Pagination handler
    const loadMore = useCallback(() => {
        if (!isLoading && hasMore) {
            const nextPage = page + 1;
            setPage(nextPage); // Update state
            fetchData(nextPage); // Fetch next page
        }
    }, [isLoading, hasMore, page, fetchData]);

    // Manual refresh function
    const refresh = useCallback(() => {
        setPage(0);
        setHasMore(true);
        fetchData(0);
    }, [fetchData]);

    return {
        topMarkets,
        forYouMarkets,
        isLoading,
        error,
        refresh,
        loadMore,
        hasMore
    };
}
