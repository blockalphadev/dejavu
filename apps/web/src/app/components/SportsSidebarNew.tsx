/**
 * Sports Sidebar - New Design
 * 
 * Dark themed sidebar with sports categories
 * Matches the premium sports betting design
 */

import { cn } from './ui/utils';

// Extended sports categories with proper icons
export const sportsCategories = [
    { id: 'live', label: 'Live', emoji: '🔴', color: 'text-red-500' },
    { id: 'nfl', label: 'NFL', emoji: '🏈', color: 'text-amber-500' },
    { id: 'nba', label: 'NBA', emoji: '🏀', color: 'text-orange-500' },
    { id: 'nhl', label: 'NHL', emoji: '🏒', color: 'text-cyan-500' },
    { id: 'mma', label: 'UFC', emoji: '🥊', color: 'text-pink-500' },
    { id: 'football', label: 'Football', emoji: '⚽', color: 'text-emerald-500' },
    { id: 'esports', label: 'Esports', emoji: '🎮', color: 'text-purple-500' },
    { id: 'cricket', label: 'Cricket', emoji: '🏏', color: 'text-lime-500' },
    { id: 'tennis', label: 'Tennis', emoji: '🎾', color: 'text-yellow-500' },
    { id: 'hockey', label: 'Hockey', emoji: '🏒', color: 'text-blue-500' },
    { id: 'baseball', label: 'Baseball', emoji: '⚾', color: 'text-red-500' },
    { id: 'rugby', label: 'Rugby', emoji: '🏉', color: 'text-green-500' },
];

interface SportsSidebarNewProps {
    activeSport: string;
    onSelectSport: (id: string) => void;
    className?: string;
}

export function SportsSidebarNew({ activeSport, onSelectSport, className }: SportsSidebarNewProps) {
    return (
        <aside className={cn(
            "w-56 flex-shrink-0 hidden lg:flex flex-col sticky top-20",
            "h-[calc(100vh-100px)] overflow-y-auto scrollbar-hide",
            className
        )}>
            {/* Section Title */}
            <div className="mb-4">
                <h2 className="text-white/90 font-bold text-lg">Popular</h2>
            </div>

            {/* Sports List */}
            <nav className="space-y-1">
                {sportsCategories.map((sport) => {
                    const isActive = activeSport === sport.id;
                    const isLive = sport.id === 'live';

                    return (
                        <button
                            key={sport.id}
                            onClick={() => onSelectSport(sport.id)}
                            className={cn(
                                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group",
                                isActive
                                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                            )}
                        >
                            {/* Icon */}
                            <span className={cn(
                                "w-7 h-7 flex items-center justify-center text-lg transition-transform duration-200 group-hover:scale-110",
                                isActive && "scale-110"
                            )}>
                                {sport.emoji}
                            </span>

                            {/* Label */}
                            <span className="flex-1 text-left">{sport.label}</span>

                            {/* Live indicator */}
                            {isLive && (
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                                </span>
                            )}
                        </button>
                    );
                })}
            </nav>
        </aside>
    );
}

export default SportsSidebarNew;

