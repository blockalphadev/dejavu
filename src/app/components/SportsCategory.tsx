import React, { useEffect, useState } from 'react';
import { PolymarketService, PolymarketTeam, PolymarketMarket } from '../../services/polymarket';
import { SportsMarketRow } from './SportsMarketRow';
import { SportsSidebar, sportsCategories } from './SportsSidebar';
import { SportsTicker } from './SportsTicker';
import { Loader2 } from 'lucide-react';
import { cn } from './ui/utils';

export default function SportsCategory() {
    const [teams, setTeams] = useState<PolymarketTeam[]>([]);
    const [markets, setMarkets] = useState<PolymarketMarket[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeSport, setActiveSport] = useState('live');

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                // Fetch basic data. In a real app, 'activeSport' would filter the API call
                const filter = activeSport === 'live' ? undefined : activeSport;

                const [teamsData, eventsData] = await Promise.all([
                    PolymarketService.fetchTeams(),
                    PolymarketService.fetchEvents({ limit: 20, sport: filter })
                ]);

                setTeams(teamsData);

                // Enrich markets with team logos
                const enrichedMarkets = PolymarketService.enrichMarketsWithTeams(eventsData, teamsData);
                setMarkets(enrichedMarkets);
            } catch (err) {
                setError('Failed to load sports data');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [activeSport]);

    return (
        <div className="container mx-auto px-4 py-6 max-w-[1600px]">
            {/* Ticker Section - Full Width */}
            <SportsTicker />

            <div className="flex gap-6">
                {/* Left Sidebar */}
                {/* Left Sidebar (Desktop) */}
                <SportsSidebar activeSport={activeSport} onSelectSport={setActiveSport} />

                {/* Main Content Area */}
                <main className="flex-1 min-w-0">
                    {/* Mobile Category Selector */}
                    <div className="md:hidden overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide flex gap-2 sticky top-[60px] z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-2 mb-4">
                        {sportsCategories.map((sport) => {
                            const Icon = sport.icon;
                            const isActive = activeSport === sport.id;
                            return (
                                <button
                                    key={sport.id}
                                    onClick={() => setActiveSport(sport.id)}
                                    className={cn(
                                        "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap border",
                                        isActive
                                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                            : "bg-secondary/50 text-muted-foreground border-transparent hover:bg-secondary hover:text-foreground"
                                    )}
                                >
                                    <Icon className={cn("w-3.5 h-3.5", isActive ? "text-primary-foreground" : sport.color)} />
                                    {sport.label}
                                </button>
                            );
                        })}
                    </div>
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold mb-2">Starting Soon</h1>
                        <p className="text-muted-foreground">{new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric' })}</p>
                    </div>

                    {loading ? (
                        <div className="flex h-[40vh] items-center justify-center">
                            <Loader2 className="w-10 h-10 animate-spin text-primary" />
                        </div>
                    ) : error ? (
                        <div className="text-red-500 text-center py-20">{error}</div>
                    ) : (
                        <div className="space-y-4">
                            {/* Group by league or sport if needed */}
                            <div className="flex items-center justify-between mb-4">
                                <span className="font-bold text-lg">NBA</span>
                            </div>

                            {markets.length > 0 ? markets.map(market => (
                                <SportsMarketRow key={market.id} market={market} />
                            )) : (
                                <div className="text-center py-20 text-muted-foreground">No events found for this category.</div>
                            )}
                        </div>
                    )}
                </main>

                {/* Right Sidebar (Bet Slip / Mini View) - Placeholder strictly based on image */}
                <aside className="w-80 hidden xl:block flex-shrink-0">
                    {/* Could be Bet Slip or "Trending" */}
                    <div className="rounded-xl border border-border/40 bg-card p-4 h-full min-h-[500px]">
                        <div className="flex items-center justify-between mb-4">
                            <span className="font-bold">Bet Slip</span>
                        </div>
                        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm border-2 border-dashed border-border/40 rounded-lg">
                            Select a market outcome
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
