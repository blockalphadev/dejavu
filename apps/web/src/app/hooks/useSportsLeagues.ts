/**
 * useSportsLeagues Hook
 * 
 * Fetches leagues from backend with their event counts
 */

import { useState, useEffect, useCallback } from 'react';
import {
    SportsService,
    SportsLeague,
    SportsEvent,
    SportType,
} from '../../services/sports.service';

export interface LeagueWithEvents extends SportsLeague {
    eventCount: number;
    liveEventCount: number;
    events?: SportsEvent[];
}

export interface UseSportsLeaguesOptions {
    sport?: SportType;
    autoRefresh?: boolean;
    refreshInterval?: number;
    includeLiveOnly?: boolean;
}

export interface UseSportsLeaguesReturn {
    leagues: LeagueWithEvents[];
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
    lastUpdated: Date | null;
}

export function useSportsLeagues(options: UseSportsLeaguesOptions = {}): UseSportsLeaguesReturn {
    const {
        sport,
        autoRefresh = false,
        refreshInterval = 60000,
        includeLiveOnly = false,
    } = options;

    const [leagues, setLeagues] = useState<LeagueWithEvents[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const fetchData = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        setError(null);

        try {
            // Fetch leagues and events in parallel
            const [leaguesResponse, eventsResponse, liveEventsResponse] = await Promise.all([
                SportsService.getLeagues({ sport, limit: 50 }),
                SportsService.getEvents({ sport, hasMarket: true, limit: 100 }),
                SportsService.getLiveEvents(sport),
            ]);

            // Group events by league
            const eventsByLeague = new Map<string, SportsEvent[]>();
            const liveEventsByLeague = new Map<string, SportsEvent[]>();

            eventsResponse.data.forEach(event => {
                const leagueId = event.leagueId || 'unknown';
                if (!eventsByLeague.has(leagueId)) {
                    eventsByLeague.set(leagueId, []);
                }
                eventsByLeague.get(leagueId)!.push(event);
            });

            liveEventsResponse.forEach(event => {
                const leagueId = event.leagueId || 'unknown';
                if (!liveEventsByLeague.has(leagueId)) {
                    liveEventsByLeague.set(leagueId, []);
                }
                liveEventsByLeague.get(leagueId)!.push(event);
            });

            // Combine leagues with event counts
            const leaguesWithEvents: LeagueWithEvents[] = leaguesResponse.data
                .map(league => ({
                    ...league,
                    eventCount: eventsByLeague.get(league.id)?.length || 0,
                    liveEventCount: liveEventsByLeague.get(league.id)?.length || 0,
                    events: eventsByLeague.get(league.id),
                }))
                .filter(league => {
                    // Only show leagues with events
                    if (includeLiveOnly) {
                        return league.liveEventCount > 0;
                    }
                    return league.eventCount > 0 || league.isFeatured;
                })
                .sort((a, b) => {
                    // Prioritize leagues with live events
                    if (a.liveEventCount > 0 && b.liveEventCount === 0) return -1;
                    if (b.liveEventCount > 0 && a.liveEventCount === 0) return 1;
                    // Then by event count
                    return b.eventCount - a.eventCount;
                });

            setLeagues(leaguesWithEvents);
            setLastUpdated(new Date());
        } catch (err) {
            console.error('Failed to fetch sports leagues:', err);
            setError(err instanceof Error ? err.message : 'Failed to load leagues');
        } finally {
            setLoading(false);
        }
    }, [sport, includeLiveOnly]);

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
        leagues,
        loading,
        error,
        refresh: () => fetchData(true),
        lastUpdated,
    };
}

/**
 * Get category display name based on sport type
 */
export function getSportCategory(sport: SportType): 'Football' | 'Basketball' | 'Esport' {
    switch (sport) {
        case 'football':
            return 'Football';
        case 'basketball':
        case 'nba':
            return 'Basketball';
        default:
            return 'Esport'; // Default for esports and others
    }
}

