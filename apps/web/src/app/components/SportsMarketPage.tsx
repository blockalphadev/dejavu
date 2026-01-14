/**
 * Sports Market Page - Polymarket Style
 * 
 * Complete sports prediction market interface with:
 * - Sport category selection
 * - Live/upcoming event filtering
 * - Prediction cards with Yes/No buttons
 * - Integrated bet slip (desktop sidebar + mobile bottom sheet)
 * - Real-time updates
 * - Anti-throttling with optimistic updates
 */

import { useState, useMemo, useEffect } from 'react';
import { SportsSidebar, sportsCategories } from './SportsSidebar';
import { SportsTicker } from './SportsTicker';
import SportsMarketCard from './SportsMarketCard';
import { MobileBetSlip } from './MobileBetSlip';
import {
    Loader2,
    RefreshCcw,
    TrendingUp,
    Zap,
    Grid3X3,
    List
} from 'lucide-react';
import { cn } from './ui/utils';
import { Button } from './ui/button';
import { useSportsMarkets } from '../hooks/useSportsMarkets';
import { useSportsSocket } from '../hooks/useSportsSocket';
import { SportType } from '../../services/sports.service';

type ViewMode = 'grid' | 'list';

interface SportsMarketPageProps {
    onOpenAuth?: (mode?: 'login' | 'signup') => void;
}

export function SportsMarketPage({ onOpenAuth }: SportsMarketPageProps) {
    const [activeSport, setActiveSport] = useState<SportType | 'live'>('live');
    const [viewMode, setViewMode] = useState<ViewMode>('grid');

    const {
        markets,
        loading,
        error,
        refresh,
        lastUpdated
    } = useSportsMarkets({
        sport: activeSport === 'live' ? undefined : activeSport,
        // For live, we might want to filter by isActive=true as well, which is default
        isActive: true,
        autoRefresh: true,
        refreshInterval: 60000
    });

    // Real-time Updates
    const [realTimeMarkets, setRealTimeMarkets] = useState<typeof markets>([]);

    useEffect(() => {
        setRealTimeMarkets(markets);
    }, [markets]);

    const handleMarketUpdate = (update: any) => {
        setRealTimeMarkets(prev => {
            const index = prev.findIndex(m => m.id === update.id);
            if (index === -1) return prev; // Or append if new?

            const newMarkets = [...prev];
            newMarkets[index] = { ...newMarkets[index], ...update };
            return newMarkets;
        });
    };

    const { joinSport, leaveSport } = useSportsSocket({
        onMarketUpdate: handleMarketUpdate
    });

    useEffect(() => {
        const sportRoom = activeSport === 'live' ? 'live' : activeSport;
        joinSport(sportRoom);
        return () => leaveSport(sportRoom);
    }, [activeSport, joinSport, leaveSport]);

    // Group markets by league for list view
    const groupedMarkets = useMemo(() => {
        return realTimeMarkets.reduce((acc, market) => {
            const leagueName = market.event?.league?.name || market.event?.metadata?.leagueName || 'Other';
            if (!acc[leagueName]) acc[leagueName] = [];
            acc[leagueName].push(market);
            return acc;
        }, {} as Record<string, typeof markets>);
    }, [realTimeMarkets]);

    return (
        <div className="container mx-auto px-4 py-6 max-w-[1800px]">
            {/* Live Ticker */}
            <SportsTicker />

            <div className="flex gap-6">
                {/* Left Sidebar (Desktop) */}
                <SportsSidebar
                    activeSport={activeSport}
                    onSelectSport={(id) => setActiveSport(id as SportType | 'live')}
                />

                {/* Main Content */}
                <main className="flex-1 min-w-0">
                    {/* Mobile Sport Selector */}
                    <div className="md:hidden overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide flex gap-2 sticky top-[60px] z-20 bg-background/95 backdrop-blur py-2 mb-4">
                        {sportsCategories.map((sport) => {
                            const isActive = activeSport === sport.id;
                            return (
                                <button
                                    key={sport.id}
                                    onClick={() => setActiveSport(sport.id as SportType | 'live')}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap border",
                                        isActive
                                            ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                                            : "bg-card text-muted-foreground border-border/40 hover:bg-accent hover:text-foreground"
                                    )}
                                >
                                    <span className="text-lg">{sport.emoji}</span>
                                    {sport.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                                {activeSport === 'live' ? (
                                    <>
                                        <Zap className="w-6 h-6 text-yellow-500 fill-current" />
                                        Live Markets
                                    </>
                                ) : (
                                    <>
                                        <TrendingUp className="w-6 h-6 text-blue-500" />
                                        {activeSport.toUpperCase()} Markets
                                    </>
                                )}
                            </h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                {loading ? 'Updating odds...' : `Updated ${lastUpdated?.toLocaleTimeString()}`}
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="bg-card border border-border/40 p-1 rounded-lg flex items-center">
                                <Button
                                    variant={viewMode === 'grid' ? "secondary" : "ghost"}
                                    size="sm"
                                    onClick={() => setViewMode('grid')}
                                    className="p-2 h-8 w-8"
                                >
                                    <Grid3X3 className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant={viewMode === 'list' ? "secondary" : "ghost"}
                                    size="sm"
                                    onClick={() => setViewMode('list')}
                                    className="p-2 h-8 w-8"
                                >
                                    <List className="w-4 h-4" />
                                </Button>
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => refresh()}
                                className="h-10 gap-2 border-border/40"
                                disabled={loading}
                            >
                                <RefreshCcw className={cn("w-4 h-4", loading && "animate-spin")} />
                                Refresh
                            </Button>
                        </div>
                    </div>

                    {/* Content */}
                    {loading && markets.length === 0 ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-10 h-10 animate-spin text-primary" />
                        </div>
                    ) : error ? (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center text-red-500">
                            Failed to load markets. Please try again later.
                        </div>
                    ) : markets.length === 0 ? (
                        <div className="text-center py-20 text-muted-foreground">
                            No active markets found for this category.
                        </div>
                    ) : (
                        <div className={cn(
                            "grid gap-4",
                            viewMode === 'grid'
                                ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                                : "grid-cols-1"
                        )}>
                            {viewMode === 'list'
                                ? Object.entries(groupedMarkets).map(([league, leagueMarkets]) => (
                                    <div key={league} className="space-y-4">
                                        <h2 className="font-semibold text-lg sticky top-[125px] z-10 bg-background/95 backdrop-blur py-2 px-2 -mx-2">
                                            {league}
                                        </h2>
                                        <div className="grid gap-4 grid-cols-1">
                                            {leagueMarkets.map((market) => (
                                                <SportsMarketCard
                                                    key={market.id}
                                                    market={market}
                                                    onOpenAuth={onOpenAuth}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))
                                : realTimeMarkets.map((market) => (
                                    <SportsMarketCard
                                        key={market.id}
                                        market={market}
                                        onOpenAuth={onOpenAuth}
                                    />
                                ))
                            }
                        </div>
                    )}
                </main>
            </div>

            <MobileBetSlip
                selections={[]}
                onRemove={() => { }}
                onClearAll={() => { }}
                onPlaceBet={() => { }}
            />
        </div>
    );
}
