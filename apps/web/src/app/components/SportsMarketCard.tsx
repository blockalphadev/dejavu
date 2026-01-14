import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from './auth/AuthContext';
import { usePredictionMarket } from '../hooks/usePredictionMarket';
import { useWallet } from '../hooks/useWallet';

// Define Interface for Market Data
interface SportsMarket {
    id: string;
    eventId: string;
    title: string;
    subtitle?: string; // e.g. "English Premier League"
    outcomes: string[];
    outcomePrices: number[];
    volume: number;
    liquidity?: number;
    image?: string;
    isLive?: boolean;
}

interface SportsMarketCardProps {
    market: SportsMarket;
    onClick?: (marketId: string) => void;
    onOpenAuth?: (mode?: 'login' | 'signup') => void;
}

const SportsMarketCard: React.FC<SportsMarketCardProps> = ({ market, onClick, onOpenAuth }) => {
    const { isAuthenticated } = useAuth();

    const { isConnected, connect } = useWallet();
    const { buyShares, isTransacting } = usePredictionMarket();

    const handleMarketClick = () => {
        if (onClick) {
            onClick(market.id);
        } else {
            console.log('Navigate to market:', market.id);
        }
    };

    const handleOutcomeClick = async (e: React.MouseEvent, outcome: string, price: number) => {
        e.stopPropagation();

        if (!isAuthenticated) {
            if (onOpenAuth) {
                onOpenAuth('login');
            } else {
                console.warn('Auth modal requested but handler not provided');
            }
            return;
        }

        // Blockchain Integration
        if (!isConnected) {
            try {
                await connect();
            } catch (err) {
                console.error("Failed to connect wallet:", err);
                return;
            }
        }

        try {
            console.log(`Predicting ${outcome} @ ${price}`);
            // Mocking cost/shares for list view interaction
            const numericMarketId = 1; // Placeholder
            const outcomeId = market.outcomes.indexOf(outcome);
            const mockShares = 10;
            const mockCost = "0.01";

            if (outcomeId === -1) throw new Error("Invalid outcome");

            await buyShares(numericMarketId, outcomeId, mockShares, mockCost);
            // On success, maybe show a toast or optimistically update UI?
            console.log("Transaction submitted successfully");
        } catch (err) {
            console.error("Prediction failed:", err);
        }
    };

    // Calculate probability percentages from prices (if prices are decimal odds or probabilities)
    // Assuming prices are probabilities (0.0 - 1.0) as per simulator
    const formatProbability = (price: number) => `${Math.round(price * 100)}%`;

    return (
        <motion.div
            whileHover={{ y: -2 }}
            className="group relative flex flex-col bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 cursor-pointer h-full"
            onClick={handleMarketClick}
        >
            {/* Header Section */}
            <div className="p-4 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-xl overflow-hidden">
                        {market.image ? (
                            <img src={market.image} alt="Market" className="w-full h-full object-cover" />
                        ) : (
                            <span>⚽</span> // Default icon
                        )}
                    </div>
                    <div className="flex flex-col">
                        <h3 className="font-semibold text-gray-900 dark:text-white leading-tight line-clamp-2 text-sm sm:text-base">
                            {market.title}
                        </h3>
                        {market.subtitle && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {market.subtitle}
                            </span>
                        )}
                    </div>
                </div>
                {market.isLive && (
                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                        <span className="text-[10px] font-bold text-red-500 uppercase tracking-wide">Live</span>
                    </span>
                )}
            </div>

            {/* Outcomes Section */}
            <div className="px-4 pb-4 flex-1 flex flex-col gap-2">
                {market.outcomes.map((outcome, index) => {
                    const price = market.outcomePrices[index] || 0;
                    const isWinner = false; // Logic for resolved markets could go here

                    return (
                        <button
                            key={index}
                            disabled={isTransacting}
                            className={`
                                relative flex items-center justify-between p-2 rounded-lg text-sm font-medium transition-colors
                                ${isWinner
                                    ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                                    : 'bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10'
                                }
                                ${isTransacting ? 'opacity-50 cursor-not-allowed' : ''}
                            `}
                            onClick={(e) => handleOutcomeClick(e, outcome, price)}
                        >
                            <span className="truncate pr-2">{outcome}</span>
                            <span className={`
                                px-2 py-0.5 rounded text-xs font-semibold
                                ${isWinner ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-white/10 text-gray-900 dark:text-white'}
                            `}>
                                {formatProbability(price)}
                            </span>

                            {/* Progress bar background for visual probability */}
                            <div
                                className="absolute left-0 top-0 bottom-0 bg-blue-500/5 rounded-lg -z-10 transition-all"
                                style={{ width: `${price * 100}%` }}
                            />
                        </button>
                    );
                })}
            </div>

            {/* Footer / Stats */}
            <div className="px-4 py-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <span>${market.volume.toLocaleString()} Vol.</span>
                </div>
                <div className="flex items-center gap-2">
                    {/* Placeholder for comments or other interactions */}
                    <span className="hover:text-blue-500 transition-colors">Details &rarr;</span>
                </div>
            </div>
        </motion.div>
    );
};

export default SportsMarketCard;
