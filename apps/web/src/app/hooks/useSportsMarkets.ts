import { useState, useEffect, useCallback, useRef } from 'react';
import {
    SportsService,
    SportsMarket,
    SportType,
} from '../../services/sports.service';

export interface UseSportsMarketsOptions {
    sport?: SportType;
    eventId?: string;
    isActive?: boolean; // Defaults to true
    autoRefresh?: boolean;
    refreshInterval?: number;
    limit?: number;
}

export interface UseSportsMarketsReturn {
    markets: SportsMarket[];
    loading: boolean;
    error: string | null;
    isRateLimited: boolean;
    rateLimitReset: Date | null;
    refresh: () => Promise<void>;
    total: number;
    totalPages: number;
    lastUpdated: Date | null;
}

export function useSportsMarkets(options: UseSportsMarketsOptions = {}): UseSportsMarketsReturn {
    const {
        sport,
        eventId,
        isActive = true,
        autoRefresh = false,
        refreshInterval = 30000,
        limit = 50,
    } = options;

    const [markets, setMarkets] = useState<SportsMarket[]>([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    // Rate Limiting State
    const [isRateLimited, setIsRateLimited] = useState(false);
    const [rateLimitReset, setRateLimitReset] = useState<Date | null>(null);
    const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const fetchData = useCallback(async (silent = false) => {
        // If currently rate limited and reset time hasn't passed, skip fetch
        if (isRateLimited && rateLimitReset && new Date() < rateLimitReset) {
            return;
        }

        if (!silent) setLoading(true);
        setError(null);

        try {
            const response = await SportsService.getMarkets({
                sport,
                eventId,
                isActive,
                limit,
            });

            setMarkets(response.data);
            setTotal(response.total);
            setTotalPages(response.totalPages);
            setLastUpdated(new Date());

            // Clear rate limit state on success
            if (isRateLimited) {
                setIsRateLimited(false);
                setRateLimitReset(null);
            }

        } catch (err: any) {
            console.error('Failed to fetch sports markets:', err);

            // Handle 429 Too Many Requests
            if (err?.response?.status === 429 || err?.message?.includes('429')) {
                setIsRateLimited(true);
                // Default to 60s cooldown if no header, or parse retry-after
                const cooldown = 60000;
                setRateLimitReset(new Date(Date.now() + cooldown));
                setError('Simulating anti-throttling cooldown...'); // User friendly message handled in UI
            } else {
                setError(err instanceof Error ? err.message : 'Failed to load markets');
            }
        } finally {
            setLoading(false);
        }
    }, [sport, eventId, isActive, limit, isRateLimited, rateLimitReset]);

    useEffect(() => {
        fetchData();
        return () => {
            if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
        }
    }, [fetchData]);

    useEffect(() => {
        if (!autoRefresh) return;
        if (isRateLimited) return; // Pause auto-refresh if rate limited

        const interval = setInterval(() => {
            fetchData(true);
        }, refreshInterval);

        return () => clearInterval(interval);
    }, [autoRefresh, refreshInterval, fetchData, isRateLimited]);

    return {
        markets,
        loading,
        error,
        isRateLimited,
        rateLimitReset,
        refresh: () => fetchData(true),
        total,
        totalPages,
        lastUpdated,
    };
}
