import React from "react";
import { House, Search, Zap, LayoutGrid, PieChart } from "lucide-react";
import { useAuth } from "./auth/AuthContext";


interface MobileBottomNavProps {
    currentTab: string;
    onNavigate: (tab: string) => void;
    onToggleMenu?: () => void;
}

export function MobileBottomNav({ currentTab, onNavigate, onToggleMenu }: MobileBottomNavProps) {
    const { isAuthenticated } = useAuth();

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[60] bg-[#0f141f]/90 backdrop-blur-xl border-t border-white/5 pb-safe">
            <div className="flex items-center justify-between px-6 h-[5rem]">

                <BottomNavItem
                    icon={<House className="w-6 h-6" />}
                    label="Home"
                    active={currentTab === 'markets'}
                    onClick={() => onNavigate('markets')}
                />

                <BottomNavItem
                    icon={<Search className="w-6 h-6" />}
                    label="Search"
                    active={currentTab === 'search'}
                    onClick={() => onNavigate('search')}
                />

                <BottomNavItem
                    icon={<Zap className="w-6 h-6" />}
                    label="Breaking"
                    active={currentTab === 'breaking'}
                    onClick={() => onNavigate('breaking')}
                />


                {isAuthenticated ? (
                    <BottomNavItem
                        icon={<PieChart className="w-6 h-6" />}
                        label="Portfolio"
                        active={currentTab === 'dashboards'}
                        onClick={() => onNavigate('dashboards')}
                    />
                ) : (
                    <BottomNavItem
                        icon={<LayoutGrid className="w-6 h-6" />}
                        label="More"
                        active={false}
                        onClick={() => onToggleMenu?.()}
                    />
                )}


            </div>
        </div>
    );
}

function BottomNavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center justify-center gap-1.5 transition-all duration-300 group ${active ? 'scale-105' : 'hover:scale-105'}`}
        >
            <div className={`
                relative p-1.5 rounded-xl transition-all duration-300
                ${active
                    ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                    : 'text-muted-foreground group-hover:text-white'
                }
            `}>
                {icon}
            </div>
            <span className={`
                text-[10px] font-medium tracking-wide transition-colors duration-300
                ${active ? 'text-blue-400' : 'text-muted-foreground group-hover:text-white'}
            `}>
                {label}
            </span>
        </button>
    );
}
