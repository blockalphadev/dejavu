import { ChevronRight } from 'lucide-react';
import { useState } from 'react';

export interface League {
    id: string;
    name: string;
    category: 'Football' | 'Basketball' | 'Esport';
    matchCount: number;
    logo: string;
    isLive?: boolean;
    fallbackEmoji?: string;
}

interface LeagueCardProps {
    league: League;
    onClick?: () => void;
}

const categoryColors: Record<string, string> = {
    'Football': 'bg-[#e91e63]',
    'Basketball': 'bg-[#e91e63]',
    'Esport': 'bg-[#e91e63]',
};

// Live broadcast icon SVG
function LiveIcon() {
    return (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="text-[#e91e63]">
            <circle cx="14" cy="14" r="4" fill="currentColor" />
            <path d="M8 14a6 6 0 0 1 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
            <path d="M20 14a6 6 0 0 0-6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
            <path d="M4 14a10 10 0 0 1 10-10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
            <path d="M24 14a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
        </svg>
    );
}

export function LeagueCard({ league, onClick }: LeagueCardProps) {
    const [imageError, setImageError] = useState(false);
    const showFallback = !league.logo || imageError;

    return (
        <div
            onClick={onClick}
            className="relative overflow-hidden rounded-2xl cursor-pointer group transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl min-h-[280px]"
            style={{
                background: 'linear-gradient(145deg, #0d5c5c 0%, #0a4a4a 30%, #073838 70%, #052a2a 100%)',
            }}
        >
            {/* Category Badge */}
            <div className="absolute top-4 left-4 z-10">
                <span className={`${categoryColors[league.category]} text-white text-xs font-bold px-3 py-1.5 rounded-md tracking-wide`}>
                    {league.category}
                </span>
            </div>

            {/* Live Indicator */}
            {league.isLive && (
                <div className="absolute top-14 left-4 z-10">
                    <LiveIcon />
                </div>
            )}

            {/* Right Arrow */}
            <div className="absolute top-4 right-4 z-10">
                <ChevronRight className="w-7 h-7 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </div>

            {/* League Logo */}
            <div className="flex items-center justify-center pt-20 pb-6 px-8">
                <div className="w-36 h-36 flex items-center justify-center relative">
                    {showFallback ? (
                        <span className="text-7xl drop-shadow-lg">
                            {league.fallbackEmoji || '🏆'}
                        </span>
                    ) : (
                        <img
                            src={league.logo}
                            alt={league.name}
                            className="max-w-full max-h-full object-contain drop-shadow-2xl"
                            onError={() => setImageError(true)}
                        />
                    )}
                </div>
            </div>

            {/* League Name */}
            <div className="text-center pb-3 px-4">
                <h3 className="text-white font-bold text-xl tracking-wider uppercase drop-shadow-lg line-clamp-2">
                    {league.name}
                </h3>
            </div>

            {/* Match Count Badge */}
            <div className="flex justify-center pb-6">
                <span className="bg-[#0d8a8a] text-white text-sm font-semibold px-8 py-2 rounded-full shadow-lg">
                    {league.matchCount} Match{league.matchCount !== 1 ? 'es' : ''}
                </span>
            </div>

            {/* Gradient overlay for depth */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
            
            {/* Hover glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-teal-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        </div>
    );
}
