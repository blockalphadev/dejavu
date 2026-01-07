import { useState, useEffect } from "react";
import { Search, ArrowUpRight } from "lucide-react";
import { MOCK_MARKETS } from "../utils/mockData";
import { motion } from "motion/react";

interface SearchPageProps {
    onNavigate: (tab: string, category?: string) => void;
}

export function SearchPage({ onNavigate }: SearchPageProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState(MOCK_MARKETS);

    useEffect(() => {
        if (!query) {
            setResults(MOCK_MARKETS.slice(0, 5)); // Show some default "trending" or "recent" items
            return;
        }
        const lowerQuery = query.toLowerCase();
        const filtered = MOCK_MARKETS.filter(
            (m) =>
                m.title.toLowerCase().includes(lowerQuery) ||
                m.category.toLowerCase().includes(lowerQuery)
        );
        setResults(filtered);
    }, [query]);

    return (
        <div className="min-h-[80vh] w-full px-4 pt-6 pb-24">
            {/* Search Header */}
            <div className="relative mb-8">
                <h1 className="text-3xl font-rajdhani font-bold mb-6">Search</h1>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    </div>
                    <input
                        type="text"
                        className="w-full bg-secondary/50 border border-transparent focus:border-primary/50 focus:bg-background rounded-2xl py-4 pl-12 pr-4 text-lg outline-none transition-all shadow-sm focus:shadow-md"
                        placeholder="Search markets, categories..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        autoFocus
                    />
                </div>
            </div>

            {/* Results or Suggestions */}
            <div className="space-y-6">
                {!query && (
                    <div className="mb-6">
                        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Trending Searches</h2>
                        <div className="flex flex-wrap gap-2">
                            {['Bitcoin', 'Election', 'SpaceX', 'AI', 'Soccer'].map((tag) => (
                                <button
                                    key={tag}
                                    onClick={() => setQuery(tag)}
                                    className="px-4 py-2 bg-secondary/30 hover:bg-secondary rounded-full text-sm font-medium transition-colors border border-transparent hover:border-primary/20"
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    {query ? `Results (${results.length})` : "Suggested Markets"}
                </h2>

                <div className="space-y-3">
                    {results.map((market, index) => (
                        <motion.div
                            key={market.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => {
                                // For now, simple click feedback. Ideally navigates to details.
                                // We can also route to the category if we want.
                                onNavigate('markets', market.category);
                            }}
                            className="group flex items-center gap-4 p-4 rounded-xl bg-card/50 hover:bg-card border border-border/50 hover:border-primary/30 transition-all cursor-pointer"
                        >
                            <div className="flex-shrink-0 text-2xl bg-secondary/30 w-12 h-12 flex items-center justify-center rounded-lg group-hover:scale-110 transition-transform">
                                {market.emoji}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                                    {market.title}
                                </h3>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                    <span className="capitalize">{market.category}</span>
                                    <span>•</span>
                                    <span>Vol: {market.volume}</span>
                                </div>
                            </div>
                            <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-primary opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                        </motion.div>
                    ))}

                    {query && results.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                            <p>No results found for "{query}"</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
