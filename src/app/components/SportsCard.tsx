import React from 'react';
import { PolymarketMarket } from '../../services/polymarket';
import { Button } from './ui/button';

interface SportsCardProps {
    market: PolymarketMarket;
}

export function SportsCard({ market }: SportsCardProps) {
    // Parse outcomes and prices. 
    // API usually returns outcomes as ["Yes", "No"] or team names, and prices as strings "0.45", etc.
    // We need to map them safely.

    const outcome1 = market.outcomes?.[0] || 'Yes';
    const outcome2 = market.outcomes?.[1] || 'No';

    const price1 = market.outcomePrices?.[0] ? parseFloat(market.outcomePrices[0]) : 0;
    const price2 = market.outcomePrices?.[1] ? parseFloat(market.outcomePrices[1]) : 0;

    const price1Display = (price1 * 100).toFixed(1) + '¢';
    const price2Display = (price2 * 100).toFixed(1) + '¢';

    return (
        <div className="bg-card border border-border/40 rounded-xl p-4 hover:border-border transition-colors group flex flex-col h-full bg-gradient-to-b from-card to-background/50">
            <div className="flex justify-between items-start mb-3 gap-3">
                {/* Logo / Image */}
                <div className="flex gap-3 items-start flex-1 min-w-0">
                    {market.image && (
                        <div className="w-10 h-10 rounded-full bg-accent/20 p-1 flex-shrink-0">
                            <img src={market.image} alt="Market" className="w-full h-full object-contain rounded-full" />
                        </div>
                    )}
                    <div>
                        <h3 className="font-semibold text-base leading-snug group-hover:text-primary transition-colors line-clamp-2">
                            {market.question}
                        </h3>
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-1.5">
                            {market.groupItemTitle && <span className="text-foreground/80 font-medium">{market.groupItemTitle}</span>}
                            <span>{market.volume ? `$${parseInt(market.volume).toLocaleString()} Vol.` : 'New Market'}</span>
                            {market.liquidity && <span>${parseInt(market.liquidity).toLocaleString()} Liq.</span>}
                        </div>
                    </div>
                </div>

                {/* Live Indicator (mock based on active) */}
                {market.active && (
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 text-[10px] font-bold uppercase tracking-wider animate-pulse flex-shrink-0">
                        <span className="w-1 h-1 rounded-full bg-red-500" />
                        LIVE
                    </div>
                )}
            </div>

            {/* Description Tooltip/Preview (optional, maybe too cluttered, sticking to clean card) */}

            {/* Outcomes Grid */}
            <div className="grid grid-cols-2 gap-2 mt-auto pt-2">
                <Button
                    variant="outline"
                    className="h-10 flex items-center justify-between px-3 border-border/40 hover:bg-green-500/5 hover:border-green-500/30 hover:text-green-500 transition-all font-normal"
                >
                    <span className="text-xs text-foreground/80 truncate pr-2">{outcome1}</span>
                    <span className="text-sm font-bold">{price1Display}</span>
                </Button>
                <Button
                    variant="outline"
                    className="h-10 flex items-center justify-between px-3 border-border/40 hover:bg-red-500/5 hover:border-red-500/30 hover:text-red-500 transition-all font-normal"
                >
                    <span className="text-xs text-foreground/80 truncate pr-2">{outcome2}</span>
                    <span className="text-sm font-bold">{price2Display}</span>
                </Button>
            </div>

            {/* Footer / Actions */}
            <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2">
                <div className="flex items-center gap-2">
                    {/* Sports Icon Mock */}
                    <div className="w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center text-[10px] text-blue-500">🏆</div>
                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{market.sport || 'Sports'}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">Ends {market.endDate ? new Date(market.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Soon'}</span>
            </div>
        </div>
    );
}
