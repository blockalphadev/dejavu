/**
 * Sports Home Page - Premium Design
 * 
 * Main sports betting hub showing:
 * - Sports category sidebar
 * - League cards in grid layout
 * - Clean, modern dark theme
 */

import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SportsSidebarNew, sportsCategories } from './SportsSidebarNew';
import { SportsLeagueCard } from './SportsLeagueCard';
import { Loader2, RefreshCcw, Search } from 'lucide-react';
import { cn } from './ui/utils';
import { Button } from './ui/button';
import useSportsData from '../hooks/useSportsData';
import { SportType, SportsLeague, SportsEvent } from '../../services/sports.service';
import { motion, AnimatePresence } from 'motion/react';

interface SportsHomePageProps {
    onSelectLeague?: (leagueId: string, sport: string) => void;
}

export function SportsHomePage({ onSelectLeague }: SportsHomePageProps) {
    const navigate = useNavigate();
    const [activeSport, setActiveSport] = useState<SportType | 'live' | 'esports'>('live');
    const [searchQuery, setSearchQuery] = useState('');

    const {
        events,
        liveEvents,
        loading,
        error,
        refresh,
    } = useSportsData({
        sport: activeSport === 'live' || activeSport === 'esports' ? undefined : activeSport as SportType,
        autoRefresh: true,
        refreshInterval: 60000
    });

    // Determine which events to use
    const displayEvents = activeSport === 'live' ? liveEvents : events;

    // Group events by league and count matches
    const leagueData = useMemo(() => {
        const leagueMap = new Map<string, {
            id: string;
            name: string;
            logoUrl?: string;
            sport: string;
            matchCount: number;
            isLive: boolean;
        }>();

        displayEvents.forEach(event => {
            const leagueId = event.league?.id || event.leagueId || 'unknown';
            const leagueName = event.league?.name || event.metadata?.leagueName || 'Unknown League';
            const logoUrl = event.league?.logoUrl;
            const sport = event.sport || 'football';
            const isLive = event.status === 'live' || event.status === 'halftime';

            if (leagueMap.has(leagueId)) {
                const existing = leagueMap.get(leagueId)!;
                existing.matchCount++;
                if (isLive) existing.isLive = true;
            } else {
                leagueMap.set(leagueId, {
                    id: leagueId,
                    name: leagueName,
                    logoUrl,
                    sport,
                    matchCount: 1,
                    isLive,
                });
            }
        });

        return Array.from(leagueMap.values());
    }, [displayEvents]);

    // Filter leagues by search
    const filteredLeagues = useMemo(() => {
        if (!searchQuery) return leagueData;
        const query = searchQuery.toLowerCase();
        return leagueData.filter(league => 
            league.name.toLowerCase().includes(query) ||
            league.sport.toLowerCase().includes(query)
        );
    }, [leagueData, searchQuery]);

    // Group leagues by sport category
    const groupedLeagues = useMemo(() => {
        const groups: Record<string, typeof leagueData> = {};
        
        filteredLeagues.forEach(league => {
            const sportKey = league.sport.toLowerCase();
            if (!groups[sportKey]) {
                groups[sportKey] = [];
            }
            groups[sportKey].push(league);
        });

        return groups;
    }, [filteredLeagues]);

    const handleLeagueClick = (leagueId: string, sport: string) => {
        if (onSelectLeague) {
            onSelectLeague(leagueId, sport);
        } else {
            // Navigate to league detail page
            navigate(`/sports/${sport}/${leagueId}`);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            <div className="container mx-auto px-4 py-6 max-w-[1600px]">
                <div className="flex gap-8">
                    {/* Left Sidebar */}
                    <SportsSidebarNew
                        activeSport={activeSport}
                        onSelectSport={(id) => setActiveSport(id as SportType | 'live' | 'esports')}
                    />

                    {/* Main Content */}
                    <main className="flex-1 min-w-0">
                        {/* Header with Search */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                            <div>
                                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                                    {activeSport === 'live' && (
                                        <span className="flex h-3 w-3 relative">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                                        </span>
                                    )}
                                    {activeSport === 'live' ? 'Live Events' : 
                                     sportsCategories.find(s => s.id === activeSport)?.label || 'All Sports'}
                                </h1>
                                <p className="text-gray-400 mt-1">
                                    {filteredLeagues.length} league{filteredLeagues.length !== 1 ? 's' : ''} • {displayEvents.length} match{displayEvents.length !== 1 ? 'es' : ''}
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                {/* Search */}
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                    <input
                                        type="text"
                                        placeholder="Search leagues..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-64 h-10 pl-10 pr-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                                    />
                                </div>

                                {/* Refresh */}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => refresh()}
                                    className="text-gray-400 hover:text-white hover:bg-white/10"
                                >
                                    <RefreshCcw className={cn("w-4 h-4", loading && "animate-spin")} />
                                </Button>
                            </div>
                        </div>

                        {/* Mobile Sport Selector */}
                        <div className="lg:hidden overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide flex gap-2 mb-6">
                            {sportsCategories.map((sport) => {
                                const isActive = activeSport === sport.id;
                                return (
                                    <button
                                        key={sport.id}
                                        onClick={() => setActiveSport(sport.id as SportType | 'live' | 'esports')}
                                        className={cn(
                                            "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                                            isActive
                                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                                : "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10"
                                        )}
                                    >
                                        <span className="text-lg">{sport.emoji}</span>
                                        {sport.label}
                                        {sport.id === 'live' && (
                                            <span className="flex h-2 w-2 ml-1">
                                                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-red-500 opacity-75" />
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Content */}
                        {loading && displayEvents.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-32">
                                <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mb-4" />
                                <p className="text-gray-400">Loading sports data...</p>
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-red-500/5 rounded-2xl border border-red-500/20">
                                <p className="text-red-400 mb-4">Failed to load sports data</p>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => refresh()}
                                    className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                                >
                                    Try Again
                                </Button>
                            </div>
                        ) : filteredLeagues.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-white/5 rounded-2xl border border-white/10">
                                <span className="text-4xl mb-4">🏟️</span>
                                <p className="text-gray-400 text-lg mb-2">No leagues found</p>
                                <p className="text-gray-500 text-sm">
                                    {searchQuery ? 'Try a different search term' : 'Check back later for events'}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {/* Display leagues grouped by sport or all together */}
                                {activeSport === 'live' || activeSport === 'esports' ? (
                                    // Group by sport for live/esports view
                                    Object.entries(groupedLeagues).map(([sport, leagues]) => (
                                        <div key={sport}>
                                            <h2 className="text-white/80 font-semibold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                                                <span>{sportsCategories.find(s => s.id === sport)?.emoji || '🏆'}</span>
                                                {sport}
                                            </h2>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                                <AnimatePresence>
                                                    {leagues.map((league, index) => (
                                                        <motion.div
                                                            key={league.id}
                                                            initial={{ opacity: 0, y: 20 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, scale: 0.95 }}
                                                            transition={{ delay: index * 0.05 }}
                                                        >
                                                            <SportsLeagueCard
                                                                {...league}
                                                                onClick={() => handleLeagueClick(league.id, league.sport)}
                                                            />
                                                        </motion.div>
                                                    ))}
                                                </AnimatePresence>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    // Single grid for specific sport
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        <AnimatePresence>
                                            {filteredLeagues.map((league, index) => (
                                                <motion.div
                                                    key={league.id}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                    transition={{ delay: index * 0.05 }}
                                                >
                                                    <SportsLeagueCard
                                                        {...league}
                                                        onClick={() => handleLeagueClick(league.id, league.sport)}
                                                    />
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                )}
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}

export default SportsHomePage;

