import { Search, Bell, Sun, Moon, Laptop, Menu } from "lucide-react";
import React from "react";
import { useTheme } from "./ThemeProvider";
import { Button } from "./ui/button";
import { Logo3D } from "./Logo3D";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

import { NavIcons } from "./NavIcons";
import { useAuth } from "./auth/AuthContext";
import { ProfileDropdown } from "./ProfileDropdown";

interface HeaderProps {
  currentTab?: string;
  onNavigate?: (tab: string) => void;
  activeCategory?: string;
  onSelectCategory?: (category: string) => void;
  onOpenAuth: () => void;
  onToggleMenu?: () => void;
}

export function Header({ currentTab = 'markets', onNavigate, activeCategory = 'Live', onSelectCategory, onOpenAuth, onToggleMenu }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const { user, isAuthenticated, isLoading } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      {/* Main Navigation */}
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Main Nav */}
          <div className="flex items-center gap-6">

            {/* Mobile Menu Toggle */}
            <button
              onClick={onToggleMenu}
              className="lg:hidden p-2 hover:bg-accent rounded-lg transition-colors"
              aria-label="Open Menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-2">
              <div className="w-10 h-10">
                <Logo3D className="w-full h-full" />
              </div>
              <span className="font-rajdhani font-bold text-2xl tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-gray-600 via-gray-500 to-gray-700 dark:from-gray-100 dark:via-gray-300 dark:to-gray-100 drop-shadow-sm">
                DeJaVu
              </span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              <NavLink
                icon={<NavIcons.Markets active={currentTab === 'markets'} />}
                active={currentTab === 'markets'}
                onClick={() => onNavigate?.('markets')}
              >
                Markets
              </NavLink>
              <NavLink
                icon={<NavIcons.Dashboards active={currentTab === 'dashboards'} />}
                active={currentTab === 'dashboards'}
                onClick={() => onNavigate?.('dashboards')}
              >
                Dashboards
              </NavLink>
              <NavLink
                icon={<NavIcons.Activity active={currentTab === 'activity'} />}
                active={currentTab === 'activity'}
                onClick={() => onNavigate?.('activity')}
              >
                Activity
              </NavLink>
              <NavLink
                icon={<NavIcons.Ranks active={currentTab === 'ranks'} />}
                active={currentTab === 'ranks'}
                onClick={() => onNavigate?.('ranks')}
              >
                Ranks
              </NavLink>
              <NavLink
                icon={<NavIcons.Rewards active={currentTab === 'rewards'} />}
                active={currentTab === 'rewards'}
                onClick={() => onNavigate?.('rewards')}
              >
                Rewards
              </NavLink>
            </nav>
          </div>

          {/* Search and Actions */}
          <div className="flex items-center gap-3">
            {/* Search Bar */}
            <div className="hidden md:flex items-center gap-2 bg-accent/50 rounded-lg px-3 py-2 w-64">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search everything"
                className="bg-transparent border-none outline-none w-full text-sm"
              />
              <span className="text-xs text-muted-foreground">/</span>
            </div>

            {/* Theme Toggle Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full relative">
                  <Sun className={`h-[1.2rem] w-[1.2rem] transition-all absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${theme === 'light' ? 'scale-100 rotate-0 opacity-100' : 'scale-0 -rotate-90 opacity-0'}`} />
                  <Moon className={`h-[1.2rem] w-[1.2rem] transition-all absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${theme === 'dark' ? 'scale-100 rotate-0 opacity-100' : 'scale-0 rotate-90 opacity-0'}`} />
                  <Laptop className={`h-[1.2rem] w-[1.2rem] transition-all absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${theme === 'system' ? 'scale-100 rotate-0 opacity-100' : 'scale-0 rotate-90 opacity-0'}`} />
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme("light")}>
                  <Sun className="mr-2 h-4 w-4" />
                  <span>Light</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                  <Moon className="mr-2 h-4 w-4" />
                  <span>Dark</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                  <Laptop className="mr-2 h-4 w-4" />
                  <span>System</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Notification Bell */}
            <button className="relative p-2 hover:bg-accent rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-cyan-500 rounded-full"></span>
            </button>

            {/* Auth Buttons / Profile */}
            {isAuthenticated && user ? (
              <div className="hidden sm:block">
                <ProfileDropdown user={user} onNavigate={onNavigate} />
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Button variant="ghost" className="rounded-full" onClick={onOpenAuth} disabled={isLoading}>
                  Log In
                </Button>
                <Button
                  className="rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black"
                  onClick={onOpenAuth}
                  disabled={isLoading}
                >
                  Sign Up
                </Button>
              </div>
            )}
          </div>
        </div>


      </div>

      {/* Category Navigation */}
      <div className="border-t border-border/40 bg-background/50">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 overflow-x-auto py-3 scrollbar-hide">
            <CategoryBadge active={activeCategory === 'Live'} onClick={() => onSelectCategory?.('Live')}>🔴 Live</CategoryBadge>
            <CategoryBadge active={activeCategory === 'All'} onClick={() => onSelectCategory?.('All')}>All</CategoryBadge>
            <CategoryBadge active={activeCategory === 'For You'} onClick={() => onSelectCategory?.('For You')}>For You</CategoryBadge>
            <CategoryBadge active={activeCategory === 'Politics'} onClick={() => onSelectCategory?.('Politics')}>Politics</CategoryBadge>
            <CategoryBadge active={activeCategory === 'Sports'} onClick={() => onSelectCategory?.('Sports')}>Sports</CategoryBadge>
            <CategoryBadge active={activeCategory === 'Crypto'} onClick={() => onSelectCategory?.('Crypto')}>Crypto</CategoryBadge>
            <CategoryBadge active={activeCategory === 'Global Elections'} onClick={() => onSelectCategory?.('Global Elections')}>Global Elections</CategoryBadge>
            <CategoryBadge active={activeCategory === 'Mentions'} onClick={() => onSelectCategory?.('Mentions')}>Mentions</CategoryBadge>
            <CategoryBadge active={activeCategory === 'Creators'} onClick={() => onSelectCategory?.('Creators')}>Creators</CategoryBadge>
            <CategoryBadge active={activeCategory === 'Pop Culture'} onClick={() => onSelectCategory?.('Pop Culture')}>Pop Culture</CategoryBadge>
            <CategoryBadge active={activeCategory === 'Business'} onClick={() => onSelectCategory?.('Business')}>Business</CategoryBadge>
            <CategoryBadge active={activeCategory === 'Science'} onClick={() => onSelectCategory?.('Science')}>Science</CategoryBadge>
          </div>
        </div>
      </div>


    </header >
  );
}

function NavLink({ icon, children, active = false, onClick }: { icon: React.ReactNode; children: React.ReactNode; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${active
        ? "bg-accent text-accent-foreground shadow-sm scale-105"
        : "hover:bg-accent/50 text-muted-foreground hover:text-foreground hover:scale-105"
        }`}
    >
      <span className="w-6 h-6 flex items-center justify-center">{icon}</span>
      <span className="text-sm font-medium">{children}</span>
    </button>
  );
}



function CategoryBadge({ children, active = false, onClick }: { children: React.ReactNode; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full whitespace-nowrap transition-colors text-sm ${active
        ? "bg-primary text-primary-foreground"
        : "bg-accent/50 hover:bg-accent text-foreground"
        }`}
    >
      {children}
    </button>
  );
}