/**
 * Market Types and Constants
 * 
 * Shared constants for sports betting market types and display
 */

// ========================
// Market Type Enum
// ========================

export enum SportsMarketType {
    MATCH_WINNER = 'match_winner',
    OVER_UNDER = 'over_under',
    BOTH_TEAMS_SCORE = 'both_teams_score',
    CORRECT_SCORE = 'correct_score',
    FIRST_SCORER = 'first_scorer',
    HANDICAP = 'handicap',
    CUSTOM = 'custom',
}

// ========================
// Market Tab Configuration
// ========================

export interface MarketTab {
    id: string;
    label: string;
    shortLabel: string;
    icon: string;
    types: SportsMarketType[];
    description: string;
}

export const MARKET_TABS: MarketTab[] = [
    {
        id: 'winner',
        label: 'Winner',
        shortLabel: '1X2',
        icon: '🏆',
        types: [SportsMarketType.MATCH_WINNER],
        description: 'Match result: Win, Lose, or Draw',
    },
    {
        id: 'goals',
        label: 'Over/Under',
        shortLabel: 'O/U',
        icon: '📊',
        types: [SportsMarketType.OVER_UNDER],
        description: 'Total goals over or under a line',
    },
    {
        id: 'btts',
        label: 'BTTS',
        shortLabel: 'BTTS',
        icon: '⚽',
        types: [SportsMarketType.BOTH_TEAMS_SCORE],
        description: 'Will both teams score?',
    },
    {
        id: 'handicap',
        label: 'Handicap',
        shortLabel: 'HC',
        icon: '⚖️',
        types: [SportsMarketType.HANDICAP],
        description: 'Asian handicap betting',
    },
    {
        id: 'more',
        label: 'More',
        shortLabel: '+',
        icon: '✨',
        types: [SportsMarketType.CORRECT_SCORE, SportsMarketType.FIRST_SCORER, SportsMarketType.CUSTOM],
        description: 'Correct score, goalscorer, and specials',
    },
];

// ========================
// Market Type Display Info
// ========================

export interface MarketTypeDisplay {
    label: string;
    shortLabel: string;
    icon: string;
    color: string;
    bgColor: string;
}

export const MARKET_TYPE_DISPLAY: Record<SportsMarketType, MarketTypeDisplay> = {
    [SportsMarketType.MATCH_WINNER]: {
        label: 'Winner',
        shortLabel: '1X2',
        icon: '🏆',
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-500/10',
    },
    [SportsMarketType.OVER_UNDER]: {
        label: 'Over/Under',
        shortLabel: 'O/U',
        icon: '📊',
        color: 'text-purple-600 dark:text-purple-400',
        bgColor: 'bg-purple-500/10',
    },
    [SportsMarketType.BOTH_TEAMS_SCORE]: {
        label: 'Both Teams Score',
        shortLabel: 'BTTS',
        icon: '⚽',
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-500/10',
    },
    [SportsMarketType.HANDICAP]: {
        label: 'Handicap',
        shortLabel: 'HC',
        icon: '⚖️',
        color: 'text-orange-600 dark:text-orange-400',
        bgColor: 'bg-orange-500/10',
    },
    [SportsMarketType.CORRECT_SCORE]: {
        label: 'Correct Score',
        shortLabel: 'CS',
        icon: '🎯',
        color: 'text-pink-600 dark:text-pink-400',
        bgColor: 'bg-pink-500/10',
    },
    [SportsMarketType.FIRST_SCORER]: {
        label: 'First Scorer',
        shortLabel: 'FGS',
        icon: '👤',
        color: 'text-cyan-600 dark:text-cyan-400',
        bgColor: 'bg-cyan-500/10',
    },
    [SportsMarketType.CUSTOM]: {
        label: 'Special',
        shortLabel: 'SP',
        icon: '✨',
        color: 'text-amber-600 dark:text-amber-400',
        bgColor: 'bg-amber-500/10',
    },
};

/**
 * Get display info for a market type
 */
export function getMarketTypeDisplay(type: string): MarketTypeDisplay {
    return MARKET_TYPE_DISPLAY[type as SportsMarketType] || MARKET_TYPE_DISPLAY[SportsMarketType.CUSTOM];
}

/**
 * Get tab that contains a market type
 */
export function getTabForMarketType(type: string): MarketTab | undefined {
    return MARKET_TABS.find(tab => tab.types.includes(type as SportsMarketType));
}

/**
 * Group markets by tab
 */
export function groupMarketsByTab(markets: Array<{ marketType: string }>): Record<string, typeof markets> {
    const grouped: Record<string, typeof markets> = {};
    
    for (const tab of MARKET_TABS) {
        grouped[tab.id] = markets.filter(m => tab.types.includes(m.marketType as SportsMarketType));
    }
    
    return grouped;
}

// ========================
// Outcome Color Helpers
// ========================

/**
 * Get color classes for an outcome based on index and total outcomes
 */
export function getOutcomeColors(index: number, total: number): {
    barColor: string;
    textColor: string;
    selectedBg: string;
    selectedBorder: string;
} {
    // For binary markets (2 outcomes)
    if (total === 2) {
        return index === 0
            ? {
                barColor: 'bg-emerald-500',
                textColor: 'text-emerald-600 dark:text-emerald-400',
                selectedBg: 'bg-emerald-50 dark:bg-emerald-900/20',
                selectedBorder: 'border-emerald-500',
            }
            : {
                barColor: 'bg-rose-500',
                textColor: 'text-rose-600 dark:text-rose-400',
                selectedBg: 'bg-rose-50 dark:bg-rose-900/20',
                selectedBorder: 'border-rose-500',
            };
    }
    
    // For 3-way markets (1X2)
    if (total === 3) {
        const colors = [
            { // Home/Yes
                barColor: 'bg-emerald-500',
                textColor: 'text-emerald-600 dark:text-emerald-400',
                selectedBg: 'bg-emerald-50 dark:bg-emerald-900/20',
                selectedBorder: 'border-emerald-500',
            },
            { // Draw
                barColor: 'bg-amber-500',
                textColor: 'text-amber-600 dark:text-amber-400',
                selectedBg: 'bg-amber-50 dark:bg-amber-900/20',
                selectedBorder: 'border-amber-500',
            },
            { // Away/No
                barColor: 'bg-rose-500',
                textColor: 'text-rose-600 dark:text-rose-400',
                selectedBg: 'bg-rose-50 dark:bg-rose-900/20',
                selectedBorder: 'border-rose-500',
            },
        ];
        return colors[index] || colors[0];
    }
    
    // For multi-outcome markets, use a color palette
    const palette = [
        { barColor: 'bg-blue-500', textColor: 'text-blue-600 dark:text-blue-400', selectedBg: 'bg-blue-50 dark:bg-blue-900/20', selectedBorder: 'border-blue-500' },
        { barColor: 'bg-purple-500', textColor: 'text-purple-600 dark:text-purple-400', selectedBg: 'bg-purple-50 dark:bg-purple-900/20', selectedBorder: 'border-purple-500' },
        { barColor: 'bg-cyan-500', textColor: 'text-cyan-600 dark:text-cyan-400', selectedBg: 'bg-cyan-50 dark:bg-cyan-900/20', selectedBorder: 'border-cyan-500' },
        { barColor: 'bg-pink-500', textColor: 'text-pink-600 dark:text-pink-400', selectedBg: 'bg-pink-50 dark:bg-pink-900/20', selectedBorder: 'border-pink-500' },
        { barColor: 'bg-orange-500', textColor: 'text-orange-600 dark:text-orange-400', selectedBg: 'bg-orange-50 dark:bg-orange-900/20', selectedBorder: 'border-orange-500' },
    ];
    
    return palette[index % palette.length];
}

// ========================
// Bet Slip Helpers
// ========================

export interface BetSelectionWithMarket {
    id: string;
    marketId: string;
    marketType: SportsMarketType;
    eventId?: string;
    eventName?: string;
    question: string;
    outcome: string;
    price: number;
    sport?: string;
}

/**
 * Check if selections are from the same event (for Same Game Parlay)
 */
export function isSameGameParlay(selections: BetSelectionWithMarket[]): boolean {
    if (selections.length < 2) return false;
    const eventIds = new Set(selections.map(s => s.eventId).filter(Boolean));
    return eventIds.size === 1;
}

/**
 * Get unique events from selections
 */
export function getUniqueEvents(selections: BetSelectionWithMarket[]): string[] {
    return [...new Set(selections.map(s => s.eventId).filter(Boolean))] as string[];
}

/**
 * Check for conflicting selections (same market, different outcomes)
 */
export function hasConflictingSelections(
    selections: BetSelectionWithMarket[],
    newSelection: BetSelectionWithMarket
): boolean {
    return selections.some(
        s => s.marketId === newSelection.marketId && s.outcome !== newSelection.outcome
    );
}

