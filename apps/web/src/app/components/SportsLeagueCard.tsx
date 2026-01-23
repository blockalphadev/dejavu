/**
 * Sports League Card
 * 
 * Beautiful card showing a league with:
 * - Sport category badge
 * - Live indicator
 * - League logo (large)
 * - League name
 * - Match count
 */

import { motion } from 'motion/react';
import { ChevronRight, Radio } from 'lucide-react';
import { cn } from './ui/utils';

// Sport category colors
const SPORT_COLORS: Record<string, { badge: string; gradient: string }> = {
    'football': {
        badge: 'bg-emerald-500',
        gradient: 'from-emerald-600/90 via-teal-600/80 to-cyan-700/90',
    },
    'basketball': {
        badge: 'bg-orange-500',
        gradient: 'from-orange-600/90 via-amber-600/80 to-yellow-700/90',
    },
    'esports': {
        badge: 'bg-pink-500',
        gradient: 'from-pink-600/90 via-purple-600/80 to-violet-700/90',
    },
    'nba': {
        badge: 'bg-orange-500',
        gradient: 'from-orange-600/90 via-red-600/80 to-rose-700/90',
    },
    'nfl': {
        badge: 'bg-blue-500',
        gradient: 'from-blue-600/90 via-indigo-600/80 to-violet-700/90',
    },
    'nhl': {
        badge: 'bg-cyan-500',
        gradient: 'from-cyan-600/90 via-blue-600/80 to-indigo-700/90',
    },
    'mma': {
        badge: 'bg-red-500',
        gradient: 'from-red-600/90 via-rose-600/80 to-pink-700/90',
    },
    'hockey': {
        badge: 'bg-sky-500',
        gradient: 'from-sky-600/90 via-blue-600/80 to-indigo-700/90',
    },
    'cricket': {
        badge: 'bg-lime-500',
        gradient: 'from-lime-600/90 via-green-600/80 to-emerald-700/90',
    },
    'tennis': {
        badge: 'bg-yellow-500',
        gradient: 'from-yellow-500/90 via-lime-500/80 to-green-600/90',
    },
    'default': {
        badge: 'bg-emerald-500',
        gradient: 'from-emerald-600/90 via-teal-600/80 to-cyan-700/90',
    },
};

interface SportsLeagueCardProps {
    id: string;
    name: string;
    logoUrl?: string;
    sport: string;
    matchCount: number;
    isLive?: boolean;
    onClick?: () => void;
}

export function SportsLeagueCard({
    id,
    name,
    logoUrl,
    sport,
    matchCount,
    isLive = false,
    onClick,
}: SportsLeagueCardProps) {
    const sportKey = sport.toLowerCase();
    const colors = SPORT_COLORS[sportKey] || SPORT_COLORS['default'];
    
    // Capitalize sport name for display
    const sportDisplay = sport.charAt(0).toUpperCase() + sport.slice(1);

    return (
        <motion.div
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={cn(
                "relative overflow-hidden rounded-2xl cursor-pointer group",
                "bg-gradient-to-br",
                colors.gradient,
                "min-h-[220px] flex flex-col"
            )}
        >
            {/* Decorative background pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2" />
            </div>

            {/* Header - Sport Badge & Live Indicator */}
            <div className="relative z-10 flex items-center justify-between p-4">
                <span className={cn(
                    "text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md text-white shadow-lg",
                    colors.badge
                )}>
                    {sportDisplay}
                </span>
                
                <div className="flex items-center gap-2">
                    {isLive && (
                        <div className="flex items-center gap-1.5 text-white/90">
                            <Radio className="w-4 h-4 animate-pulse" />
                        </div>
                    )}
                    <ChevronRight className="w-5 h-5 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </div>
            </div>

            {/* Logo Section */}
            <div className="flex-1 flex items-center justify-center p-4 relative z-10">
                {logoUrl ? (
                    <img
                        src={logoUrl}
                        alt={name}
                        className="w-24 h-24 object-contain drop-shadow-2xl group-hover:scale-110 transition-transform duration-300"
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                        }}
                    />
                ) : (
                    <div className="w-24 h-24 rounded-2xl bg-white/20 flex items-center justify-center text-4xl backdrop-blur-sm">
                        🏆
                    </div>
                )}
            </div>

            {/* Footer - League Name & Match Count */}
            <div className="relative z-10 p-4 pt-0 text-center">
                <h3 className="text-white font-bold text-lg uppercase tracking-wide mb-2 drop-shadow-lg line-clamp-1">
                    {name}
                </h3>
                <span className="inline-block bg-emerald-400/90 text-emerald-950 text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                    {matchCount} Match{matchCount !== 1 ? 'es' : ''}
                </span>
            </div>
        </motion.div>
    );
}

export default SportsLeagueCard;

