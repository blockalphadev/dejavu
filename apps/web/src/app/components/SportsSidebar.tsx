import {
    Trophy,
    Flame,
    Bike,
    CircleDot,
} from 'lucide-react';

// All 12 supported sports matching the backend
export const sportsCategories = [
    { id: 'live', label: 'Live', icon: Flame, color: 'text-red-500', emoji: '🔴' },
    { id: 'afl', label: 'AFL', icon: Trophy, color: 'text-yellow-600', emoji: '🏉' },
    { id: 'baseball', label: 'Baseball', icon: CircleDot, color: 'text-red-600', emoji: '⚾' },
    { id: 'basketball', label: 'Basketball', icon: CircleDot, color: 'text-orange-500', emoji: '🏀' },
    { id: 'football', label: 'Football', icon: CircleDot, color: 'text-green-500', emoji: '⚽' },
    { id: 'formula1', label: 'Formula 1', icon: Bike, color: 'text-red-500', emoji: '🏎️' },
    { id: 'handball', label: 'Handball', icon: CircleDot, color: 'text-blue-500', emoji: '🤾' },
    { id: 'hockey', label: 'Hockey', icon: Trophy, color: 'text-blue-300', emoji: '🏒' },
    { id: 'mma', label: 'MMA', icon: Trophy, color: 'text-red-600', emoji: '🥊' },
    { id: 'nba', label: 'NBA', icon: Trophy, color: 'text-orange-500', emoji: '🏀' },
    { id: 'nfl', label: 'NFL', icon: Trophy, color: 'text-blue-500', emoji: '🏈' },
    { id: 'rugby', label: 'Rugby', icon: Trophy, color: 'text-green-600', emoji: '🏉' },
    { id: 'volleyball', label: 'Volleyball', icon: CircleDot, color: 'text-yellow-500', emoji: '🏐' },
];

interface SportsSidebarProps {
    activeSport: string;
    onSelectSport: (id: string) => void;
}

export function SportsSidebar({ activeSport, onSelectSport }: SportsSidebarProps) {
    const popularSports = sportsCategories.slice(0, 7); // Live + first 6 sports
    const allSports = sportsCategories.slice(7); // Remaining sports

    return (
        <aside className="w-56 flex-shrink-0 hidden md:flex flex-col gap-1 pr-4 border-r border-border/40 min-h-[calc(100vh-80px)] overflow-y-auto scrollbar-hide">
            <div className="font-bold text-xs text-muted-foreground uppercase tracking-wider mb-2 px-3 pt-2">
                Popular
            </div>
            {popularSports.map((sport) => {
                const isActive = activeSport === sport.id;

                return (
                    <button
                        key={sport.id}
                        onClick={() => onSelectSport(sport.id)}
                        className={`
                            flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                            ${isActive
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                            }
                        `}
                    >
                        <span className="w-5 h-5 flex items-center justify-center text-base">
                            {sport.emoji}
                        </span>
                        <span>{sport.label}</span>
                        {sport.id === 'live' && (
                            <span className="ml-auto w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        )}
                    </button>
                );
            })}

            <div className="mt-4 font-bold text-xs text-muted-foreground uppercase tracking-wider mb-2 px-3">
                All Sports
            </div>
            {allSports.map((sport) => {
                const isActive = activeSport === sport.id;

                return (
                    <button
                        key={sport.id}
                        onClick={() => onSelectSport(sport.id)}
                        className={`
                            flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all
                            ${isActive
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                            }
                        `}
                    >
                        <span className="w-5 h-5 flex items-center justify-center text-base">
                            {sport.emoji}
                        </span>
                        <span>{sport.label}</span>
                    </button>
                );
            })}
        </aside>
    );
}

