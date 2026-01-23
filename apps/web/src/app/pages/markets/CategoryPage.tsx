
import { useState } from "react";
import { FilterSection } from "../../components/FilterSection";
import { MarketCard } from "../../components/MarketCard";
import { useMarketData } from "../../hooks/useMarketData";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { motion } from "motion/react";

interface CategoryPageProps {
    category: string;
    title?: string;
    showFilter?: boolean;
}

export function CategoryPage({ category, title, showFilter = true }: CategoryPageProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const { markets, isLoading, error } = useMarketData({ category, searchQuery });

    return (
        <div className="flex flex-col space-y-6 pb-12">
            {showFilter && (
                <FilterSection
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                />
            )}

            <div className="container mx-auto px-4">
                {title && <h2 className="text-2xl font-bold mb-4">{title}</h2>}

                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <LoadingSpinner />
                    </div>
                ) : error ? (
                    <div className="text-center py-20 text-red-500">
                        Error loading markets: {error.message}
                    </div>
                ) : markets.length === 0 ? (
                    <div className="text-center py-20 text-muted-foreground">
                        <p className="text-xl">No markets found for this category</p>
                        {searchQuery && <p className="text-sm mt-2">Try adjusting your search</p>}
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                    >
                        {markets.map((market) => (
                            <MarketCard
                                key={market.id}
                                title={market.title}
                                emoji={market.emoji}
                                questions={market.questions}
                                volume={market.volume}
                                comments={market.comments}
                                badge={market.badge}
                            />
                        ))}
                    </motion.div>
                )}
            </div>
        </div>
    );
}
