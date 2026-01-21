
import { useState } from "react";
import { FilterSection } from "../../components/FilterSection";
import { SignalsCard } from "../../components/SignalsCard";
import { HeroSection } from "../../components/HeroSection";
import { useMarketData } from "../../hooks/useMarketData";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { motion } from "motion/react";

export function SignalsPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const { signals, isLoading, error } = useMarketData({ category: "signals", searchQuery });

    return (
        <div className="flex flex-col space-y-6 pb-12">
            <HeroSection />
            <FilterSection
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
            />

            <div className="container mx-auto px-4">
                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <LoadingSpinner />
                    </div>
                ) : error ? (
                    <div className="text-center py-20 text-red-500">
                        Error loading signals: {error.message}
                    </div>
                ) : signals.length === 0 ? (
                    <div className="text-center py-20 text-muted-foreground">
                        <p className="text-xl">No signals found</p>
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                    >
                        {signals.map((signal) => (
                            <SignalsCard key={signal.id} signal={signal} />
                        ))}
                    </motion.div>
                )}
            </div>
        </div>
    );
}
