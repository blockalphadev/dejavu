/**
 * Odds Mapper - API-Sports Bet Types to Internal Market Types
 * 
 * Maps various bet types from API-Sports to our internal market types
 * and handles the conversion of odds data to market outcomes.
 */

import { SportsMarketType } from './types/sports.types.js';

// ========================
// API-Sports Bet Type IDs
// ========================

/**
 * Common bet type IDs from API-Sports Football
 * @see https://api-sports.io/documentation/football/v3#tag/Odds/operation/get-odds
 */
export const API_SPORTS_BET_TYPES = {
    // Winner Markets
    MATCH_WINNER: 1,           // 1X2 (Home/Draw/Away)
    HOME_AWAY: 2,              // Home or Away (no draw)
    DOUBLE_CHANCE: 12,         // 1X, 12, X2
    
    // Goals Markets
    GOALS_OVER_UNDER: 5,       // Over/Under 2.5
    GOALS_OVER_UNDER_FIRST_HALF: 6, // First Half O/U
    BOTH_TEAMS_SCORE: 8,       // BTTS Yes/No
    EXACT_GOALS: 14,           // Exact number of goals
    
    // Handicap Markets
    ASIAN_HANDICAP: 3,         // Asian Handicap
    GOAL_HANDICAP: 4,          // European Handicap
    
    // Score Markets
    CORRECT_SCORE: 10,         // Exact final score
    CORRECT_SCORE_FIRST_HALF: 11, // Exact HT score
    HALFTIME_FULLTIME: 13,     // HT/FT result
    
    // Other Markets
    FIRST_HALF_WINNER: 15,     // First half result
    SECOND_HALF_WINNER: 16,    // Second half result
    ODD_EVEN: 18,              // Odd/Even total goals
    FIRST_GOAL_SCORER: 26,     // First goalscorer (player)
    LAST_GOAL_SCORER: 27,      // Last goalscorer
    ANYTIME_GOAL_SCORER: 28,   // Anytime goalscorer
} as const;

/**
 * Maps API-Sports bet type IDs to our internal SportsMarketType
 */
export const BET_TYPE_TO_MARKET_TYPE: Record<number, SportsMarketType> = {
    [API_SPORTS_BET_TYPES.MATCH_WINNER]: SportsMarketType.MATCH_WINNER,
    [API_SPORTS_BET_TYPES.HOME_AWAY]: SportsMarketType.MATCH_WINNER,
    [API_SPORTS_BET_TYPES.DOUBLE_CHANCE]: SportsMarketType.MATCH_WINNER,
    [API_SPORTS_BET_TYPES.GOALS_OVER_UNDER]: SportsMarketType.OVER_UNDER,
    [API_SPORTS_BET_TYPES.GOALS_OVER_UNDER_FIRST_HALF]: SportsMarketType.OVER_UNDER,
    [API_SPORTS_BET_TYPES.BOTH_TEAMS_SCORE]: SportsMarketType.BOTH_TEAMS_SCORE,
    [API_SPORTS_BET_TYPES.ASIAN_HANDICAP]: SportsMarketType.HANDICAP,
    [API_SPORTS_BET_TYPES.GOAL_HANDICAP]: SportsMarketType.HANDICAP,
    [API_SPORTS_BET_TYPES.CORRECT_SCORE]: SportsMarketType.CORRECT_SCORE,
    [API_SPORTS_BET_TYPES.CORRECT_SCORE_FIRST_HALF]: SportsMarketType.CORRECT_SCORE,
    [API_SPORTS_BET_TYPES.FIRST_GOAL_SCORER]: SportsMarketType.FIRST_SCORER,
    [API_SPORTS_BET_TYPES.LAST_GOAL_SCORER]: SportsMarketType.FIRST_SCORER,
    [API_SPORTS_BET_TYPES.ANYTIME_GOAL_SCORER]: SportsMarketType.FIRST_SCORER,
};

/**
 * Priority bet types to sync (most commonly used)
 * Higher priority = synced first
 */
export const PRIORITY_BET_TYPES = [
    API_SPORTS_BET_TYPES.MATCH_WINNER,       // 1X2
    API_SPORTS_BET_TYPES.GOALS_OVER_UNDER,   // O/U 2.5
    API_SPORTS_BET_TYPES.BOTH_TEAMS_SCORE,   // BTTS
    API_SPORTS_BET_TYPES.ASIAN_HANDICAP,     // Handicap
    API_SPORTS_BET_TYPES.DOUBLE_CHANCE,      // Double Chance
    API_SPORTS_BET_TYPES.CORRECT_SCORE,      // Correct Score
];

// ========================
// Bet Type Display Info
// ========================

export interface BetTypeInfo {
    id: number;
    name: string;
    shortName: string;
    description: string;
    marketType: SportsMarketType;
    category: 'winner' | 'goals' | 'handicap' | 'score' | 'player' | 'other';
    maxOutcomes?: number; // Limit outcomes for UI (e.g., correct score has many)
}

export const BET_TYPE_INFO: Record<number, BetTypeInfo> = {
    [API_SPORTS_BET_TYPES.MATCH_WINNER]: {
        id: 1,
        name: 'Match Winner',
        shortName: '1X2',
        description: 'Predict the match result: Home Win, Draw, or Away Win',
        marketType: SportsMarketType.MATCH_WINNER,
        category: 'winner',
    },
    [API_SPORTS_BET_TYPES.DOUBLE_CHANCE]: {
        id: 12,
        name: 'Double Chance',
        shortName: 'DC',
        description: 'Win if either of two outcomes happens',
        marketType: SportsMarketType.MATCH_WINNER,
        category: 'winner',
    },
    [API_SPORTS_BET_TYPES.GOALS_OVER_UNDER]: {
        id: 5,
        name: 'Goals Over/Under',
        shortName: 'O/U',
        description: 'Predict if total goals will be over or under a line',
        marketType: SportsMarketType.OVER_UNDER,
        category: 'goals',
    },
    [API_SPORTS_BET_TYPES.BOTH_TEAMS_SCORE]: {
        id: 8,
        name: 'Both Teams to Score',
        shortName: 'BTTS',
        description: 'Will both teams score at least one goal?',
        marketType: SportsMarketType.BOTH_TEAMS_SCORE,
        category: 'goals',
    },
    [API_SPORTS_BET_TYPES.ASIAN_HANDICAP]: {
        id: 3,
        name: 'Asian Handicap',
        shortName: 'AH',
        description: 'Handicap betting with goal advantages',
        marketType: SportsMarketType.HANDICAP,
        category: 'handicap',
    },
    [API_SPORTS_BET_TYPES.GOAL_HANDICAP]: {
        id: 4,
        name: 'Goal Handicap',
        shortName: 'HC',
        description: 'European handicap with goal advantages',
        marketType: SportsMarketType.HANDICAP,
        category: 'handicap',
    },
    [API_SPORTS_BET_TYPES.CORRECT_SCORE]: {
        id: 10,
        name: 'Correct Score',
        shortName: 'CS',
        description: 'Predict the exact final score',
        marketType: SportsMarketType.CORRECT_SCORE,
        category: 'score',
        maxOutcomes: 12, // Limit to most likely scores
    },
    [API_SPORTS_BET_TYPES.FIRST_GOAL_SCORER]: {
        id: 26,
        name: 'First Goal Scorer',
        shortName: 'FGS',
        description: 'Predict who will score the first goal',
        marketType: SportsMarketType.FIRST_SCORER,
        category: 'player',
        maxOutcomes: 20,
    },
};

// ========================
// Conversion Functions
// ========================

export interface OddsValue {
    value: string;
    odd: string;
}

export interface BookmakerBet {
    id: number;
    name: string;
    values: OddsValue[];
}

export interface ConvertedMarket {
    marketType: SportsMarketType;
    betTypeId: number;
    title: string;
    description: string;
    question: string;
    outcomes: string[];
    outcomePrices: number[];
    line?: number; // For O/U and handicap markets
    metadata: Record<string, unknown>;
}

/**
 * Convert decimal odds to probability (0-1)
 * e.g., 2.0 → 0.5 (50%)
 */
export function oddsToProb(odds: string | number): number {
    const decimal = typeof odds === 'string' ? parseFloat(odds) : odds;
    if (decimal <= 1) return 0;
    return 1 / decimal;
}

/**
 * Normalize probabilities to sum to 1
 */
export function normalizeProbabilities(probs: number[]): number[] {
    const sum = probs.reduce((a, b) => a + b, 0);
    if (sum === 0) return probs;
    return probs.map(p => Number((p / sum).toFixed(4)));
}

/**
 * Convert a bookmaker bet to our market format
 */
export function convertBetToMarket(
    bet: BookmakerBet,
    eventName: string,
    homeTeam?: string,
    awayTeam?: string
): ConvertedMarket | null {
    const info = BET_TYPE_INFO[bet.id];
    const marketType = BET_TYPE_TO_MARKET_TYPE[bet.id];
    
    if (!marketType) {
        return null; // Unsupported bet type
    }

    let outcomes = bet.values.map(v => v.value);
    let prices = bet.values.map(v => oddsToProb(v.odd));
    
    // Apply outcome limit if specified
    if (info?.maxOutcomes && outcomes.length > info.maxOutcomes) {
        // Sort by probability and take top N
        const sorted = outcomes
            .map((o, i) => ({ outcome: o, price: prices[i] }))
            .sort((a, b) => b.price - a.price)
            .slice(0, info.maxOutcomes);
        
        outcomes = sorted.map(s => s.outcome);
        prices = sorted.map(s => s.price);
    }
    
    // Normalize probabilities
    prices = normalizeProbabilities(prices);

    // Generate title and question based on bet type
    let title = bet.name;
    let question = bet.name;
    let line: number | undefined;

    switch (bet.id) {
        case API_SPORTS_BET_TYPES.MATCH_WINNER:
            title = 'Match Winner';
            question = `Who will win ${eventName}?`;
            // Replace generic outcomes with team names
            outcomes = outcomes.map(o => {
                if (o === 'Home' && homeTeam) return homeTeam;
                if (o === 'Away' && awayTeam) return awayTeam;
                return o;
            });
            break;
            
        case API_SPORTS_BET_TYPES.GOALS_OVER_UNDER:
            // Extract line from outcome (e.g., "Over 2.5" → 2.5)
            const overMatch = outcomes.find(o => o.toLowerCase().includes('over'));
            if (overMatch) {
                const lineMatch = overMatch.match(/[\d.]+/);
                if (lineMatch) {
                    line = parseFloat(lineMatch[0]);
                    title = `Goals Over/Under ${line}`;
                    question = `Will there be over or under ${line} goals?`;
                }
            }
            break;
            
        case API_SPORTS_BET_TYPES.BOTH_TEAMS_SCORE:
            title = 'Both Teams to Score';
            question = 'Will both teams score at least one goal?';
            break;
            
        case API_SPORTS_BET_TYPES.ASIAN_HANDICAP:
        case API_SPORTS_BET_TYPES.GOAL_HANDICAP:
            title = 'Handicap';
            question = `${eventName} with handicap`;
            break;
            
        case API_SPORTS_BET_TYPES.CORRECT_SCORE:
            title = 'Correct Score';
            question = `What will be the final score of ${eventName}?`;
            break;
            
        case API_SPORTS_BET_TYPES.DOUBLE_CHANCE:
            title = 'Double Chance';
            question = 'Which two outcomes will win?';
            // Replace with team names
            outcomes = outcomes.map(o => {
                if (o === 'Home/Draw' && homeTeam) return `${homeTeam} or Draw`;
                if (o === 'Home/Away' && homeTeam && awayTeam) return `${homeTeam} or ${awayTeam}`;
                if (o === 'Draw/Away' && awayTeam) return `Draw or ${awayTeam}`;
                return o;
            });
            break;
    }

    return {
        marketType,
        betTypeId: bet.id,
        title,
        description: info?.description || bet.name,
        question,
        outcomes,
        outcomePrices: prices,
        line,
        metadata: {
            originalBetName: bet.name,
            betTypeId: bet.id,
            category: info?.category || 'other',
        },
    };
}

/**
 * Process all bets from a bookmaker and return converted markets
 */
export function processBookmakerBets(
    bets: BookmakerBet[],
    eventName: string,
    homeTeam?: string,
    awayTeam?: string,
    priorityOnly: boolean = true
): ConvertedMarket[] {
    const markets: ConvertedMarket[] = [];
    const targetBetTypes = priorityOnly ? PRIORITY_BET_TYPES : Object.keys(BET_TYPE_TO_MARKET_TYPE).map(Number);
    
    for (const bet of bets) {
        if (!targetBetTypes.includes(bet.id)) continue;
        
        const market = convertBetToMarket(bet, eventName, homeTeam, awayTeam);
        if (market) {
            markets.push(market);
        }
    }
    
    return markets;
}

// ========================
// Market Type Helpers
// ========================

export const MARKET_TYPE_DISPLAY: Record<SportsMarketType, { label: string; shortLabel: string; icon: string }> = {
    [SportsMarketType.MATCH_WINNER]: { label: 'Winner', shortLabel: '1X2', icon: '🏆' },
    [SportsMarketType.OVER_UNDER]: { label: 'Over/Under', shortLabel: 'O/U', icon: '📊' },
    [SportsMarketType.BOTH_TEAMS_SCORE]: { label: 'Both Teams Score', shortLabel: 'BTTS', icon: '⚽' },
    [SportsMarketType.HANDICAP]: { label: 'Handicap', shortLabel: 'HC', icon: '⚖️' },
    [SportsMarketType.CORRECT_SCORE]: { label: 'Correct Score', shortLabel: 'CS', icon: '🎯' },
    [SportsMarketType.FIRST_SCORER]: { label: 'First Scorer', shortLabel: 'FGS', icon: '👤' },
    [SportsMarketType.CUSTOM]: { label: 'Special', shortLabel: 'SP', icon: '✨' },
};

/**
 * Get display info for a market type
 */
export function getMarketTypeDisplay(type: SportsMarketType) {
    return MARKET_TYPE_DISPLAY[type] || { label: type, shortLabel: type, icon: '📌' };
}

