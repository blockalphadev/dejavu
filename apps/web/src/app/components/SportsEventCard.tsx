/**
 * Sports Event Card - Multi-Market Betting Card
 * 
 * Enhanced card showing an event with multiple market types:
 * - Market type tabs (Winner, O/U, BTTS, Handicap, More)
 * - Multiple outcomes per market
 * - Same Game Parlay support
 * - Live updates indicator
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, Clock, Check, ChevronDown, Zap } from 'lucide-react';
import { useBetSlip } from './BetSlipContext';
import { cn } from './ui/utils';
import {
    SportsMarketType,
    MARKET_TABS,
    getMarketTypeDisplay,
    getOutcomeColors,
    groupMarketsByTab,
} from '../../constants/markets';

// Sport-specific emoji mapping
const SPORT_EMOJIS: Record<string, string> = {
    'afl': '🏉',
    'mma': '🥊',
    'football': '⚽',
    'basketball': '🏀',
    'nba': '🏀',
    'nfl': '🏈',
    'hockey': '🏒',
    'baseball': '⚾',
    'formula1': '🏎️',
    'handball': '🤾',
    'rugby': '🏉',
    'volleyball': '🏐',
};

// ========================
// Types
// ========================

interface SportsMarket {
    id: string;
    eventId: string;
    marketType: string;
    title: string;
    question?: string;
    description?: string;
    outcomes: string[];
    outcomePrices: number[];
    volume: number;
    liquidity?: number;
    metadata?: {
        category?: string;
        betTypeId?: number;
        line?: number;
    };
}

interface SportsEvent {
    id: string;
    name?: string;
    sport?: string;
    status?: string;
    statusDetail?: string;
    startTime?: string | Date;
    homeTeam?: { name: string; logo?: string };
    awayTeam?: { name: string; logo?: string };
    homeScore?: number;
    awayScore?: number;
    league?: { name: string; logo?: string };
    thumbnailUrl?: string;
    metadata?: any;
}

interface SportsEventCardProps {
    event: SportsEvent;
    markets: SportsMarket[];
    onClick?: (eventId: string) => void;
    onOpenAuth?: (mode?: 'login' | 'signup') => void;
    compact?: boolean;
}

// ========================
// Component
// ========================

export function SportsEventCard({
    event,
    markets,
    onClick,
    onOpenAuth,
    compact = false,
}: SportsEventCardProps) {
    const { addToBetSlip, selections, removeFromBetSlip } = useBetSlip();
    const [activeTab, setActiveTab] = useState('winner');
    const [showAllMarkets, setShowAllMarkets] = useState(false);

    // Group markets by tab
    const groupedMarkets = useMemo(() => groupMarketsByTab(markets), [markets]);
    
    // Get available tabs (only show tabs that have markets)
    const availableTabs = useMemo(() => {
        return MARKET_TABS.filter(tab => groupedMarkets[tab.id]?.length > 0);
    }, [groupedMarkets]);

    // Current markets to display
    const currentMarkets = groupedMarkets[activeTab] || [];
    const displayMarkets = showAllMarkets ? currentMarkets : currentMarkets.slice(0, 2);

    // Event info
    const sportKey = (event.sport || 'football').toLowerCase();
    const sportEmoji = SPORT_EMOJIS[sportKey] || '⚽';
    const isLive = event.status === 'live' || event.status === 'halftime';
    const eventName = event.name || `${event.homeTeam?.name || 'Home'} vs ${event.awayTeam?.name || 'Away'}`;

    const handleEventClick = () => {
        if (onClick) {
            onClick(event.id);
        }
    };

    const handleOutcomeClick = (
        e: React.MouseEvent,
        market: SportsMarket,
        outcome: string,
        price: number,
        outcomeIndex: number
    ) => {
        e.stopPropagation();

        const selectionId = `${market.id}-${outcomeIndex}`;
        const isSelected = selections.some(s => s.id === selectionId);

        if (isSelected) {
            removeFromBetSlip(selectionId);
        } else {
            addToBetSlip({
                id: selectionId,
                marketId: market.id,
                eventId: event.id,
                question: market.title,
                outcome: outcome,
                price: price,
                sport: event.sport,
                homeTeam: event.homeTeam?.name,
                awayTeam: event.awayTeam?.name,
                eventName: eventName,
                marketType: market.marketType,
                line: market.metadata?.line,
            });
        }
    };

    const formatProbability = (price: number) => `${Math.round(price * 100)}%`;

    // Count total selections from this event
    const eventSelectionCount = selections.filter(s => 
        markets.some(m => s.id.startsWith(m.id))
    ).length;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -2 }}
            className="group relative flex flex-col bg-white/90 dark:bg-zinc-900/90 backdrop-blur-lg border border-zinc-200/80 dark:border-white/10 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-black/20 hover:border-blue-500/30"
            onClick={handleEventClick}
        >
            {/* Header Section */}
            <div className="p-4 pb-3 flex items-start gap-3">
                {/* Event Image/Icon */}
                <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 dark:from-white/10 dark:to-white/5 flex items-center justify-center text-2xl overflow-hidden border border-black/5 dark:border-white/10">
                        {event.thumbnailUrl ? (
                            <img 
                                src={event.thumbnailUrl} 
                                alt="Event" 
                                className="w-full h-full object-cover"
                                onError={(e) => (e.currentTarget.style.display = 'none')} 
                            />
                        ) : (
                            <span>{sportEmoji}</span>
                        )}
                    </div>
                    {isLive && (
                        <div className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 ring-2 ring-white dark:ring-zinc-900" />
                        </div>
                    )}
                </div>

                {/* Event Info */}
                <div className="flex flex-col flex-1 min-w-0">
                    {/* League Badge */}
                    <div className="flex items-center gap-2 mb-1">
                        {event.league?.name && (
                            <span className="text-[10px] font-bold tracking-wider text-blue-600 dark:text-blue-400 uppercase bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-100 dark:border-blue-500/20 truncate">
                                {event.league.name}
                            </span>
                        )}
                        {isLive && (
                            <span className="text-[10px] font-bold tracking-wider text-red-600 dark:text-red-400 uppercase bg-red-50 dark:bg-red-500/10 px-2 py-0.5 rounded-full border border-red-100 dark:border-red-500/20 flex items-center gap-1">
                                <Zap className="w-2.5 h-2.5 fill-current" />
                                LIVE
                            </span>
                        )}
                        {eventSelectionCount > 0 && (
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-500/20">
                                {eventSelectionCount} pick{eventSelectionCount > 1 ? 's' : ''}
                            </span>
                        )}
                    </div>

                    {/* Event Name / Teams */}
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 leading-tight text-base group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                        {eventName}
                    </h3>

                    {/* Score (if live) */}
                    {isLive && event.homeScore !== undefined && event.awayScore !== undefined && (
                        <div className="flex items-center gap-2 mt-1 text-sm font-bold">
                            <span className="text-gray-900 dark:text-white">{event.homeScore}</span>
                            <span className="text-gray-400">-</span>
                            <span className="text-gray-900 dark:text-white">{event.awayScore}</span>
                            {event.statusDetail && (
                                <span className="text-xs font-normal text-red-500 animate-pulse">
                                    {event.statusDetail}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Market Tabs */}
            {availableTabs.length > 1 && (
                <div className="px-4 pb-2">
                    <div className="flex gap-1 overflow-x-auto scrollbar-hide -mx-1 px-1">
                        {availableTabs.map(tab => {
                            const isActive = activeTab === tab.id;
                            const marketCount = groupedMarkets[tab.id]?.length || 0;
                            
                            return (
                                <button
                                    key={tab.id}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveTab(tab.id);
                                        setShowAllMarkets(false);
                                    }}
                                    className={cn(
                                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
                                        isActive
                                            ? "bg-blue-600 text-white shadow-sm"
                                            : "bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10"
                                    )}
                                >
                                    <span>{tab.icon}</span>
                                    <span>{tab.shortLabel}</span>
                                    {marketCount > 1 && (
                                        <span className={cn(
                                            "text-[10px] px-1 rounded",
                                            isActive ? "bg-white/20" : "bg-gray-200 dark:bg-white/10"
                                        )}>
                                            {marketCount}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Markets Section */}
            <div className="px-4 pb-4 space-y-3">
                <AnimatePresence mode="wait">
                    {displayMarkets.map((market, marketIndex) => (
                        <motion.div
                            key={market.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ delay: marketIndex * 0.05 }}
                            className="space-y-2"
                        >
                            {/* Market Title (only if multiple markets) */}
                            {displayMarkets.length > 1 && (
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        {market.title}
                                    </span>
                                    {market.metadata?.line && (
                                        <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 px-1.5 py-0.5 rounded">
                                            {market.metadata.line > 0 ? '+' : ''}{market.metadata.line}
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* Outcomes Grid */}
                            <div className={cn(
                                "grid gap-2",
                                market.outcomes.length === 2 ? "grid-cols-2" : 
                                market.outcomes.length === 3 ? "grid-cols-3" : 
                                "grid-cols-2 sm:grid-cols-3"
                            )}>
                                {market.outcomes.slice(0, 6).map((outcome, index) => {
                                    const price = market.outcomePrices[index] || 0;
                                    const colors = getOutcomeColors(index, market.outcomes.length);
                                    const selectionId = `${market.id}-${index}`;
                                    const isSelected = selections.some(s => s.id === selectionId);

                                    return (
                                        <button
                                            key={index}
                                            onClick={(e) => handleOutcomeClick(e, market, outcome, price, index)}
                                            className={cn(
                                                "relative flex flex-col items-center justify-center p-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                                                "border-2 overflow-hidden",
                                                isSelected
                                                    ? `${colors.selectedBorder} ${colors.selectedBg}`
                                                    : "border-transparent bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10"
                                            )}
                                        >
                                            {/* Probability Bar Background */}
                                            <div
                                                className={cn(
                                                    "absolute inset-0 opacity-10 dark:opacity-20 transition-all duration-500",
                                                    colors.barColor
                                                )}
                                                style={{ 
                                                    clipPath: `inset(0 ${100 - price * 100}% 0 0)` 
                                                }}
                                            />

                                            {/* Content */}
                                            <div className="relative z-10 flex flex-col items-center gap-0.5">
                                                {isSelected && (
                                                    <Check className={cn("w-3 h-3 mb-0.5", colors.textColor)} />
                                                )}
                                                <span className="text-gray-700 dark:text-gray-200 text-xs font-medium text-center line-clamp-2 leading-tight">
                                                    {outcome}
                                                </span>
                                                <span className={cn("text-sm font-bold", colors.textColor)}>
                                                    {formatProbability(price)}
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Show More Markets Button */}
                {currentMarkets.length > 2 && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowAllMarkets(!showAllMarkets);
                        }}
                        className="w-full py-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors flex items-center justify-center gap-1"
                    >
                        {showAllMarkets ? 'Show Less' : `+${currentMarkets.length - 2} More Markets`}
                        <ChevronDown className={cn(
                            "w-3.5 h-3.5 transition-transform",
                            showAllMarkets && "rotate-180"
                        )} />
                    </button>
                )}
            </div>

            {/* Footer / Stats */}
            <div className="px-4 py-2.5 border-t border-gray-100 dark:border-white/5 flex items-center justify-between bg-gray-50/50 dark:bg-white/[0.02]">
                <div className="flex items-center gap-4 text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                    <div className="flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5" />
                        <span>${markets.reduce((sum, m) => sum + (m.volume || 0), 0).toLocaleString()} Vol.</span>
                    </div>
                    {event.startTime && !isLive && (
                        <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{new Date(event.startTime).toLocaleDateString()}</span>
                        </div>
                    )}
                </div>
                <div className="text-[10px] text-gray-400 dark:text-gray-500">
                    {markets.length} market{markets.length > 1 ? 's' : ''}
                </div>
            </div>
        </motion.div>
    );
}

export default SportsEventCard;

