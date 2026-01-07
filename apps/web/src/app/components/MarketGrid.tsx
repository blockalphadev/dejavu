import { MarketCard } from "./MarketCard";
import { SignalsCard } from "./SignalsCard";
import { MOCK_MARKETS, MOCK_SIGNALS, CategoryId } from "../utils/mockData";
import { useMemo } from "react";

interface MarketGridProps {
    activeCategory: string;
    searchQuery?: string;
}

export function MarketGrid({ activeCategory, searchQuery = "" }: MarketGridProps) {

    // Filter logic
    const filteredContent = useMemo(() => {
        const query = searchQuery.toLowerCase();

        // SIGNALS
        if (activeCategory === 'signals') {
            return MOCK_SIGNALS.filter(s =>
                s.title.toLowerCase().includes(query) ||
                s.tags.some(tag => tag.toLowerCase().includes(query))
            );
        }

        // MARKETS
        return MOCK_MARKETS.filter(m => {
            // Category Filter
            let matchesCategory = false;
            if (activeCategory === 'top_pics') matchesCategory = !!m.isTopPick;
            else if (activeCategory === 'for_you') matchesCategory = !!m.isForYou;
            else if (activeCategory === 'latest') matchesCategory = true; // Show all or sort by date (simulated)
            else matchesCategory = m.category === activeCategory;

            // Search Filter
            const matchesSearch = m.title.toLowerCase().includes(query);

            return matchesCategory && matchesSearch;
        });
    }, [activeCategory, searchQuery]);

    if (filteredContent.length === 0) {
        return (
            <div className="container mx-auto px-4 py-12 text-center text-muted-foreground">
                <p className="text-xl">No results found for "{activeCategory}"</p>
                {searchQuery && <p className="text-sm mt-2">Try adjusting your search query</p>}
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {activeCategory === 'signals' ? (
                    // Render Signals
                    (filteredContent as typeof MOCK_SIGNALS).map(signal => (
                        <SignalsCard key={signal.id} signal={signal} />
                    ))
                ) : (
                    // Render Markets
                    (filteredContent as typeof MOCK_MARKETS).map(market => (
                        <MarketCard
                            key={market.id}
                            title={market.title}
                            emoji={market.emoji}
                            questions={market.questions}
                            volume={market.volume}
                            comments={market.comments}
                            badge={market.badge}
                        />
                    ))
                )}
            </div>

            {/* Load More (Visual only) */}
            <div className="flex justify-center mt-8">
                <button className="px-8 py-3 bg-accent hover:bg-accent/80 rounded-full transition-colors text-sm font-medium">
                    Load More
                </button>
            </div>
        </div>
    );
}
