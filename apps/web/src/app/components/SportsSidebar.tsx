import React from 'react';
import {
    Trophy, // Fallback
    Flame, // Trending/Live
    Zap, // Boosted/New
} from 'lucide-react';

export const sportsCategories = [
    { id: 'live', label: 'Live', icon: Flame, color: 'text-red-500' },
    { id: 'nfl', label: 'NFL', icon: Trophy, color: 'text-blue-500' },
    { id: 'nba', label: 'NBA', icon: Trophy, color: 'text-orange-500' },
    { id: 'nhl', label: 'NHL', icon: Trophy, color: 'text-gray-400' },
    { id: 'ufc', label: 'UFC', icon: Zap, color: 'text-red-600' },
    { id: 'football', label: 'Football', icon: Trophy, color: 'text-green-500' },
    { id: 'esports', label: 'Esports', icon: Zap, color: 'text-purple-500' },
    { id: 'cricket', label: 'Cricket', icon: Trophy, color: 'text-blue-400' },
    { id: 'tennis', label: 'Tennis', icon: Trophy, color: 'text-yellow-500' },
    { id: 'hockey', label: 'Hockey', icon: Trophy, color: 'text-blue-300' },
];

interface SportsSidebarProps {
    activeSport: string;
    onSelectSport: (id: string) => void;
}

export function SportsSidebar({ activeSport, onSelectSport }: SportsSidebarProps) {
    return (
        <aside className="w-56 flex-shrink-0 hidden md:flex flex-col gap-2 pr-4 border-r border-border/40 min-h-[calc(100vh-80px)]">
            <div className="font-bold text-xs text-muted-foreground uppercase tracking-wider mb-2 px-3 pt-2">Popular</div>
            {sportsCategories.map((sport) => {
                const Icon = sport.icon;
                const isActive = activeSport === sport.id;

                return (
                    <button
                        key={sport.id}
                        onClick={() => onSelectSport(sport.id)}
                        className={`
                            flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                            ${isActive
                                ? 'bg-accent text-accent-foreground'
                                : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                            }
                        `}
                    >
                        <Icon className={`w-4 h-4 ${sport.color}`} />
                        <span>{sport.label}</span>
                        {/* Optional counts/badges can go here */}
                    </button>
                );
            })}

            <div className="mt-4 font-bold text-xs text-muted-foreground uppercase tracking-wider mb-2 px-3">All Sports</div>
            {/* Can map more categories here if needed */}
            <button className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground">
                <span className="w-4 h-4 flex items-center justify-center text-[10px] opacity-70">🏈</span>
                American Football
            </button>
            <button className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground">
                <span className="w-4 h-4 flex items-center justify-center text-[10px] opacity-70">🏀</span>
                Basketball
            </button>
        </aside>
    );
}
