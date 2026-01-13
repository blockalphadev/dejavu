/**
 * Bet Slip Component - Polymarket Style
 * 
 * Sticky sidebar/bottom sheet for managing predictions:
 * - Add/remove selections
 * - Set bet amounts
 * - Calculate potential payouts
 * - Responsive (sidebar on desktop, bottom sheet on mobile)
 */

import { useState, useMemo } from 'react';
import { Button } from './ui/button';
import { cn } from './ui/utils';
import {
    X,
    Trash2,
    ChevronUp,
    ChevronDown,
    TrendingUp,
    Wallet,
    AlertCircle
} from 'lucide-react';

export interface BetSelection {
    id: string;
    marketId: string;
    question: string;
    outcome: 'yes' | 'no';
    price: number;
    homeTeam?: string;
    awayTeam?: string;
    sport?: string;
}

interface BetSlipProps {
    selections: BetSelection[];
    onRemove: (id: string) => void;
    onClearAll: () => void;
    onPlaceBet: (selections: BetSelection[], amounts: Record<string, number>) => void;
    balance?: number;
    className?: string;
    isExpanded?: boolean;
    onToggleExpand?: () => void;
}

export function BetSlip({
    selections,
    onRemove,
    onClearAll,
    onPlaceBet,
    balance = 0,
    className,
    isExpanded = true,
    onToggleExpand
}: BetSlipProps) {
    const [amounts, setAmounts] = useState<Record<string, number>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Calculate totals
    const calculations = useMemo(() => {
        let totalStake = 0;
        let potentialPayout = 0;

        selections.forEach(sel => {
            const amount = amounts[sel.id] || 0;
            totalStake += amount;
            // Payout = amount / price (e.g., $10 at 0.6 = $16.67)
            if (sel.price > 0) {
                potentialPayout += amount / sel.price;
            }
        });

        const potentialProfit = potentialPayout - totalStake;

        return { totalStake, potentialPayout, potentialProfit };
    }, [selections, amounts]);

    const handleAmountChange = (id: string, value: string) => {
        const numValue = parseFloat(value) || 0;
        setAmounts(prev => ({ ...prev, [id]: numValue }));
    };

    const handleQuickAmount = (id: string, amount: number) => {
        setAmounts(prev => ({ ...prev, [id]: (prev[id] || 0) + amount }));
    };

    const handleSubmit = async () => {
        if (selections.length === 0 || calculations.totalStake === 0) return;

        setIsSubmitting(true);
        try {
            await onPlaceBet(selections, amounts);
            setAmounts({});
        } finally {
            setIsSubmitting(false);
        }
    };

    const canSubmit = selections.length > 0 &&
        calculations.totalStake > 0 &&
        calculations.totalStake <= balance;

    return (
        <div className={cn(
            "flex flex-col bg-card border border-border/40 rounded-2xl overflow-hidden transition-all duration-300",
            "shadow-xl backdrop-blur-xl",
            className
        )}>
            {/* Header */}
            <div
                className="flex items-center justify-between p-4 border-b border-border/30 bg-gradient-to-r from-primary/5 to-secondary/5 cursor-pointer"
                onClick={onToggleExpand}
            >
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Wallet className="w-5 h-5 text-primary" />
                        {selections.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground rounded-full text-[10px] font-bold flex items-center justify-center">
                                {selections.length}
                            </span>
                        )}
                    </div>
                    <span className="font-bold">Bet Slip</span>
                </div>
                <div className="flex items-center gap-2">
                    {selections.length > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); onClearAll(); }}
                            className="text-xs text-muted-foreground hover:text-destructive h-7 px-2"
                        >
                            <Trash2 className="w-3.5 h-3.5 mr-1" />
                            Clear
                        </Button>
                    )}
                    {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    ) : (
                        <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    )}
                </div>
            </div>

            {/* Content */}
            {isExpanded && (
                <>
                    {/* Selections List */}
                    <div className="flex-1 overflow-y-auto max-h-[400px]">
                        {selections.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                                <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                                    <TrendingUp className="w-8 h-8 text-muted-foreground/50" />
                                </div>
                                <p className="text-muted-foreground font-medium">No selections yet</p>
                                <p className="text-xs text-muted-foreground/60 mt-1">
                                    Click Yes or No on a market to add
                                </p>
                            </div>
                        ) : (
                            <div className="p-3 space-y-3">
                                {selections.map(sel => (
                                    <div
                                        key={sel.id}
                                        className="relative bg-background/50 rounded-xl p-3 border border-border/30"
                                    >
                                        {/* Remove button */}
                                        <button
                                            onClick={() => onRemove(sel.id)}
                                            className="absolute top-2 right-2 p-1 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>

                                        {/* Market Info */}
                                        <div className="pr-6 mb-3">
                                            <p className="text-sm font-medium line-clamp-2 leading-snug">
                                                {sel.question}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={cn(
                                                    "text-xs font-bold px-2 py-0.5 rounded-full uppercase",
                                                    sel.outcome === 'yes'
                                                        ? "bg-green-500/10 text-green-500"
                                                        : "bg-red-500/10 text-red-500"
                                                )}>
                                                    {sel.outcome}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    @ {Math.round(sel.price * 100)}¢
                                                </span>
                                            </div>
                                        </div>

                                        {/* Amount Input */}
                                        <div className="flex items-center gap-2">
                                            <div className="relative flex-1">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                                                <input
                                                    type="number"
                                                    value={amounts[sel.id] || ''}
                                                    onChange={(e) => handleAmountChange(sel.id, e.target.value)}
                                                    placeholder="0.00"
                                                    className="w-full h-10 pl-7 pr-3 rounded-lg bg-background border border-border/50 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none text-sm font-medium"
                                                />
                                            </div>
                                            <div className="flex gap-1">
                                                {[5, 10, 25].map(amt => (
                                                    <button
                                                        key={amt}
                                                        onClick={() => handleQuickAmount(sel.id, amt)}
                                                        className="h-10 px-2.5 text-xs font-medium rounded-lg bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                                                    >
                                                        +${amt}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Potential Payout */}
                                        {(amounts[sel.id] || 0) > 0 && (
                                            <div className="flex justify-between mt-2 text-xs">
                                                <span className="text-muted-foreground">Potential payout</span>
                                                <span className="font-bold text-green-500">
                                                    ${((amounts[sel.id] || 0) / sel.price).toFixed(2)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer Summary */}
                    {selections.length > 0 && (
                        <div className="p-4 border-t border-border/30 bg-gradient-to-t from-background/50 to-transparent space-y-3">
                            {/* Summary */}
                            <div className="space-y-1.5 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Total stake</span>
                                    <span className="font-medium">${calculations.totalStake.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Potential payout</span>
                                    <span className="font-bold text-green-500">${calculations.potentialPayout.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between border-t border-border/30 pt-1.5">
                                    <span className="text-muted-foreground">Potential profit</span>
                                    <span className="font-bold text-primary">${calculations.potentialProfit.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Balance warning */}
                            {calculations.totalStake > balance && (
                                <div className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10 text-destructive text-xs">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    <span>Insufficient balance. You have ${balance.toFixed(2)}</span>
                                </div>
                            )}

                            {/* Submit Button */}
                            <Button
                                className="w-full h-12 text-base font-bold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20"
                                disabled={!canSubmit || isSubmitting}
                                onClick={handleSubmit}
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center gap-2">
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Placing Bet...
                                    </span>
                                ) : (
                                    `Place Bet • $${calculations.totalStake.toFixed(2)}`
                                )}
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default BetSlip;
