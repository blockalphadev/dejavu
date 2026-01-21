"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
    Search,
    Sparkles,
    TrendingUp,
    Flame,
    Droplets,
    Timer,
    Trophy,
    X,
    SlidersHorizontal,
    Loader2,
    Filter,
    MessageSquare
} from "lucide-react";
import { MOCK_MARKETS } from "../../utils/mockData";
import { cn } from "../../components/ui/utils";
import { useDebounce } from "../../hooks/useDebounce";

// Secondary Navigation Links
const TOP_NAV_LINKS = [
    { id: "all", label: "All" },
    { id: "sports", label: "Sports" },
    { id: "politics", label: "Politics" },
    { id: "crypto", label: "Crypto" },
    { id: "entertainment", label: "Pop Culture" },
    { id: "science", label: "Science" },
    { id: "tech", label: "Tech" },
    { id: "world", label: "World" },
];

// Browse filter options (Pills)
const BROWSE_FILTERS = [
    { id: "trending", label: "Trending", icon: TrendingUp },
    { id: "new", label: "New", icon: Sparkles },
    { id: "liquid", label: "Liquidity", icon: Droplets },
    { id: "ending_soon", label: "Ending Soon", icon: Timer },
    { id: "competitive", label: "Competitive", icon: Trophy },
];

// Sort options for sidebar
const SORT_OPTIONS = [
    { id: "trending", label: "Trending", icon: TrendingUp },
    { id: "liquidity", label: "Liquidity", icon: Droplets },
    { id: "volume", label: "Volume", icon: Flame },
    { id: "newest", label: "Newest", icon: Sparkles },
    { id: "ending_soon", label: "Ending Soon", icon: Timer },
];

// Event status filters
const STATUS_FILTERS = [
    { id: "active", label: "Active" },
    { id: "resolved", label: "Resolved" },
    { id: "all", label: "All" },
];

export function SearchPage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const inputRef = useRef<HTMLInputElement>(null);

    // State
    const [inputValue, setInputValue] = useState(searchParams.get("q") || "");
    const debouncedQuery = useDebounce(inputValue, 300);
    const [activeCategory, setActiveCategory] = useState("all");
    const [activeSort, setActiveSort] = useState("trending");
    const [activeStatus, setActiveStatus] = useState("active");
    const [results, setResults] = useState(MOCK_MARKETS);
    const [isSearching, setIsSearching] = useState(false);
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    // Update URL
    useEffect(() => {
        const params = new URLSearchParams();
        if (debouncedQuery) params.set("q", debouncedQuery);
        if (activeCategory !== "all") params.set("category", activeCategory);
        setSearchParams(params, { replace: true });
    }, [debouncedQuery, activeCategory, setSearchParams]);

    // Initial load & Filter logic
    useEffect(() => {
        setIsSearching(true);
        const timer = setTimeout(() => {
            let filtered = MOCK_MARKETS;

            // Search Filter
            if (debouncedQuery) {
                const lowerQuery = debouncedQuery.toLowerCase();
                filtered = filtered.filter(m =>
                    (m.title?.toLowerCase().includes(lowerQuery) || false) ||
                    (m.category?.toLowerCase().includes(lowerQuery) || false)
                );
            }

            // Category Filter
            if (activeCategory !== "all") {
                filtered = filtered.filter(m => m.category?.toLowerCase() === activeCategory);
            }

            // Status Filter (Mock logic)
            if (activeStatus === "resolved") {
                filtered = filtered.filter(m => m.endDate && new Date(m.endDate) < new Date()); // Simplistic mock
            }

            setResults(filtered);
            setIsSearching(false);
        }, 300);
        return () => clearTimeout(timer);
    }, [debouncedQuery, activeCategory, activeStatus]);

    const handleMarketClick = (marketId: string) => navigate(`/market/${marketId}`);
    const clearSearch = () => { setInputValue(""); inputRef.current?.focus(); };

    return (
        <div className="min-h-screen w-full bg-background font-sans text-foreground pb-20 lg:pb-12">

            {/* Top Navigation Bar (Mobile & Desktop) */}
            <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/40">
                <div className="max-w-7xl mx-auto px-4 py-3">
                    <div className="flex items-center gap-4">
                        {/* Search Input */}
                        <div className="relative flex-1 group max-w-2xl">
                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                {isSearching ? (
                                    <Loader2 className="h-4 w-4 text-primary animate-spin" />
                                ) : (
                                    <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                )}
                            </div>
                            <input
                                ref={inputRef}
                                type="text"
                                className="w-full bg-secondary/50 hover:bg-secondary/70 border border-border/50 focus:border-primary/50 focus:bg-background rounded-lg py-2.5 pl-10 pr-10 text-sm outline-none transition-all shadow-sm focus:shadow-md"
                                placeholder="Search markets..."
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                            />
                            {inputValue && (
                                <button
                                    onClick={clearSearch}
                                    className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Secondary Navigation (Horizontal Scroll) */}
                    <div className="flex items-center gap-6 overflow-x-auto scrollbar-none mt-3 pb-1 -mx-4 px-4 lg:mx-0 lg:px-0 border-t border-transparent lg:border-none">
                        {TOP_NAV_LINKS.map((link) => (
                            <button
                                key={link.id}
                                onClick={() => setActiveCategory(link.id)}
                                className={cn(
                                    "text-sm font-semibold whitespace-nowrap transition-colors relative py-2",
                                    activeCategory === link.id
                                        ? "text-foreground"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {link.label}
                                {activeCategory === link.id && (
                                    <motion.div
                                        layoutId="activeNavIndicator"
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground"
                                    />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 lg:px-6 pt-6 grid grid-cols-1 lg:grid-cols-4 gap-8">

                {/* Main Content (Feed) */}
                <div className="lg:col-span-3 space-y-6">

                    {/* Header Filters (Pills) */}
                    <div className="flex items-center overflow-x-auto scrollbar-none gap-2 pb-2">
                        <div className="flex gap-2">
                            <button className={cn(
                                "px-3 py-1.5 rounded-lg text-sm font-bold bg-foreground text-background" // "All" active style
                            )}>
                                All
                            </button>
                            {BROWSE_FILTERS.map((filter) => {
                                const Icon = filter.icon;
                                const isActive = activeSort === filter.id; // Allow quick sort via pills too
                                return (
                                    <button
                                        key={filter.id}
                                        onClick={() => setActiveSort(filter.id)}
                                        className={cn(
                                            "group flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border whitespace-nowrap",
                                            isActive
                                                ? "bg-secondary text-foreground border-border"
                                                : "bg-background hover:bg-secondary/50 border-transparent text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        <Icon className="w-3.5 h-3.5" />
                                        {filter.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Markets List (Compact Row Style) */}
                    <div className="space-y-4">
                        <AnimatePresence mode="popLayout">
                            {results.map((market, index) => (
                                <motion.div
                                    key={market.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2, delay: index * 0.03 }}
                                    onClick={() => handleMarketClick(market.id)}
                                    className="group flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-border/30 bg-card/50 hover:bg-secondary/20 hover:border-border/80 transition-all cursor-pointer"
                                >
                                    {/* Market Image / Emoji */}
                                    <div className="flex-shrink-0">
                                        <div className="w-16 h-16 sm:w-14 sm:h-14 rounded-lg bg-secondary/50 flex items-center justify-center text-3xl sm:text-2xl shadow-sm">
                                            {market.emoji || "📊"}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5 flex items-center gap-1">
                                                    {market.category}
                                                    <span className="text-border">•</span>
                                                    <span>General</span>
                                                </div>
                                                <h3 className="text-base sm:text-lg font-bold text-foreground leading-tight group-hover:text-primary transition-colors pr-4">
                                                    {market.title}
                                                </h3>
                                            </div>

                                            {/* Desktop Chance (Right aligned) */}
                                            <div className="hidden sm:flex flex-col items-end flex-shrink-0 pl-4">
                                                <span className={cn(
                                                    "text-lg font-bold tabular-nums",
                                                    (market.questions?.[0]?.yesPercent || 0) > 50 ? "text-primary" : "text-foreground"
                                                )}>
                                                    {market.questions?.[0]?.yesPercent !== undefined ? `${market.questions?.[0]?.yesPercent}%` : "--"}
                                                </span>
                                                <span className="text-xs text-muted-foreground">Chance</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <span className="font-medium text-foreground">${market.volume || "0"}</span> Vol.
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <MessageSquare className="w-3 h-3" />
                                                <span>{Math.floor(Math.random() * 50) + 10}</span> {/* Mock comments */}
                                            </div>
                                            {market.endDate && (
                                                <div className="flex items-center gap-1 opacity-70">
                                                    <Timer className="w-3 h-3" />
                                                    <span>{market.endDate}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Mobile Chance (Bottom Row) */}
                                    <div className="sm:hidden flex items-center justify-between pt-2 border-t border-border/30 mt-1">
                                        <div className="flex items-center gap-2">
                                            <span className={cn(
                                                "text-lg font-bold",
                                                (market.questions?.[0]?.yesPercent || 0) > 50 ? "text-primary" : "text-foreground"
                                            )}>
                                                {market.questions?.[0]?.yesPercent !== undefined ? `${market.questions?.[0]?.yesPercent}%` : "--"}
                                            </span>
                                            <span className="text-xs text-muted-foreground uppercase font-medium">Chance</span>
                                        </div>
                                        <button className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold">
                                            Trade
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {results.length === 0 && (
                            <div className="text-center py-20">
                                <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Search className="w-8 h-8 text-muted-foreground" />
                                </div>
                                <h3 className="text-lg font-bold text-foreground">No markets found</h3>
                                <p className="text-muted-foreground mt-1">Try changing your filters or search terms.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Sidebar (Desktop Sticky) */}
                <div className="hidden lg:block lg:col-span-1">
                    <div className="sticky top-28 space-y-6">

                        {/* Filters Panel */}
                        <div className="bg-card/50 border border-border/50 rounded-xl p-4">
                            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                                <SlidersHorizontal className="w-4 h-4" />
                                Filters
                            </h3>

                            <div className="space-y-4">
                                {/* Sort By */}
                                <div>
                                    <label className="text-xs text-muted-foreground font-medium mb-2 block">Sort By</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {SORT_OPTIONS.slice(0, 4).map((sort) => (
                                            <button
                                                key={sort.id}
                                                onClick={() => setActiveSort(sort.id)}
                                                className={cn(
                                                    "px-3 py-2 rounded-lg text-xs font-medium text-left border transition-all flex items-center gap-1.5",
                                                    activeSort === sort.id
                                                        ? "bg-primary/10 text-primary border-primary/30"
                                                        : "bg-background text-muted-foreground border-transparent hover:bg-secondary"
                                                )}
                                            >
                                                <sort.icon className="w-3 h-3" />
                                                {sort.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Status */}
                                <div>
                                    <label className="text-xs text-muted-foreground font-medium mb-2 block">Event Status</label>
                                    <div className="flex p-1 bg-secondary rounded-lg">
                                        {STATUS_FILTERS.map((status) => (
                                            <button
                                                key={status.id}
                                                onClick={() => setActiveStatus(status.id)}
                                                className={cn(
                                                    "flex-1 py-1.5 rounded-md text-xs font-bold transition-all",
                                                    activeStatus === status.id
                                                        ? "bg-background text-foreground shadow-sm"
                                                        : "text-muted-foreground hover:text-foreground"
                                                )}
                                            >
                                                {status.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer / Links */}
                        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground px-2">
                            <a href="#" className="hover:text-foreground transition-colors">How it works</a>
                            <a href="#" className="hover:text-foreground transition-colors">Rules</a>
                            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
                            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Floating Action Button (FAB) */}
            <AnimatePresence>
                {!showMobileFilters && (
                    <motion.button
                        initial={{ scale: 0, rotate: 90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 90 }}
                        onClick={() => setShowMobileFilters(true)}
                        className="lg:hidden fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground rounded-full shadow-lg shadow-primary/25 font-bold text-sm tracking-wide active:scale-95 transition-transform"
                    >
                        <Filter className="w-4 h-4" />
                        Filters
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Mobile Filter Sheet */}
            <AnimatePresence>
                {showMobileFilters && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden"
                            onClick={() => setShowMobileFilters(false)}
                        />
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="fixed bottom-0 left-0 right-0 bg-card border-t border-border rounded-t-3xl z-50 p-6 pb-safe lg:hidden max-h-[85vh] overflow-y-auto"
                        >
                            <div className="flex items-center justify-between mb-8 sticky top-0 bg-card z-10 pb-2 border-b border-border/50">
                                <h3 className="text-xl font-bold font-rajdhani">Filter Markets</h3>
                                <button
                                    onClick={() => setShowMobileFilters(false)}
                                    className="p-2 bg-secondary rounded-full hover:bg-secondary/80 transition-colors"
                                >
                                    <X className="w-5 h-5 text-foreground" />
                                </button>
                            </div>

                            {/* Mobile Filters Content (Same as Desktop Sidebar) */}
                            <div className="space-y-8">
                                <div>
                                    <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Sort By</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        {SORT_OPTIONS.map((sort) => (
                                            <button
                                                key={sort.id}
                                                onClick={() => setActiveSort(sort.id)}
                                                className={cn(
                                                    "flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all border",
                                                    activeSort === sort.id
                                                        ? "bg-primary/10 text-primary border-primary/30"
                                                        : "bg-secondary/30 text-foreground border-transparent"
                                                )}
                                            >
                                                <sort.icon className="w-4 h-4" />
                                                {sort.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Market Status</h4>
                                    <div className="flex p-1 bg-secondary rounded-xl">
                                        {STATUS_FILTERS.map((status) => (
                                            <button
                                                key={status.id}
                                                onClick={() => setActiveStatus(status.id)}
                                                className={cn(
                                                    "flex-1 py-3 text-xs font-bold rounded-lg transition-all",
                                                    activeStatus === status.id
                                                        ? "bg-background text-primary shadow-sm"
                                                        : "text-muted-foreground hover:text-foreground"
                                                )}
                                            >
                                                {status.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowMobileFilters(false)}
                                className="w-full mt-8 py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-base shadow-lg shadow-primary/25 active:scale-95 transition-all"
                            >
                                Show {results.length} Results
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
