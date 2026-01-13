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

    const fetchData = useCallback(async (silent = false) => {
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
        } catch (err) {
            console.error('Failed to fetch sports markets:', err);
            setError(err instanceof Error ? err.message : 'Failed to load markets');
        } finally {
            setLoading(false);
        }
    }, [sport, eventId, isActive, limit]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (!autoRefresh) return;

        const interval = setInterval(() => {
            fetchData(true);
        }, refreshInterval);

        return () => clearInterval(interval);
    }, [autoRefresh, refreshInterval, fetchData]);

    return {
        markets,
        loading,
        error,
        refresh: () => fetchData(true),
        total,
        totalPages,
        lastUpdated,
    };
}
