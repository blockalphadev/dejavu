import { Search, Bell, Menu, X, Sun, Moon, Laptop } from "lucide-react";
import React, { useState, useCallback } from "react";
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

interface HeaderProps {
  currentTab?: string;
  onNavigate?: (tab: string) => void;
}

export function Header({ currentTab = 'markets', onNavigate }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  const handleToggleMenu = useCallback(() => {
    setIsMenuOpen(prev => !prev);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      {/* Main Navigation */}
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Main Nav */}
          <div className="flex items-center gap-6">
            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 hover:bg-accent rounded-lg transition-colors"
              onClick={handleToggleMenu}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="flex items-center gap-2">
              <div className="w-10 h-10">
                <Logo3D className="w-full h-full" />
              </div>
              <span className="font-bold text-xl hidden sm:block bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
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

            {/* Auth Buttons */}
            <div className="hidden sm:flex items-center gap-2">
              <Button variant="ghost" className="rounded-full">
                Log In
              </Button>
              <Button className="rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black">
                Sign Up
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden py-4 border-t border-border/40">
            <nav className="flex flex-col gap-2">
              <MobileNavLink active>📊 Markets</MobileNavLink>
              <MobileNavLink>📈 Dashboards</MobileNavLink>
              <MobileNavLink>⚡ Activity</MobileNavLink>
              <MobileNavLink>🏆 Ranks</MobileNavLink>
              <MobileNavLink>🎁 Rewards</MobileNavLink>
              <div className="flex gap-2 mt-4 sm:hidden">
                <Button variant="outline" className="flex-1 rounded-full">
                  Log In
                </Button>
                <Button className="flex-1 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black">
                  Sign Up
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>

      {/* Category Navigation */}
      <div className="border-t border-border/40 bg-background/50">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 overflow-x-auto py-3 scrollbar-hide">
            <CategoryBadge active>🔴 Live</CategoryBadge>
            <CategoryBadge>All</CategoryBadge>
            <CategoryBadge>For You</CategoryBadge>
            <CategoryBadge>Politics</CategoryBadge>
            <CategoryBadge>Sports</CategoryBadge>
            <CategoryBadge>Crypto</CategoryBadge>
            <CategoryBadge>Global Elections</CategoryBadge>
            <CategoryBadge>Mentions</CategoryBadge>
            <CategoryBadge>Creators</CategoryBadge>
            <CategoryBadge>Pop Culture</CategoryBadge>
            <CategoryBadge>Business</CategoryBadge>
            <CategoryBadge>Science</CategoryBadge>
          </div>
        </div>
      </div>
    </header>
  );
}

function NavLink({ icon, children, active = false, onClick }: { icon: React.ReactNode; children: React.ReactNode; active?: boolean; onClick?: () => void }) {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${active
        ? "bg-accent text-accent-foreground"
        : "hover:bg-accent/50 text-muted-foreground hover:text-foreground"
        }`}
    >
      {/* We can clone element to pass hover state if needed, but for now specific icons handle active state. 
          If we want hover animation for 3D icons, we might need to pass hover state down. 
          Currently NavIcons accept 'active'. We could also pass 'hovered'.
          But for MVP let's stick to 'active'.
      */}
      <span className="w-6 h-6 flex items-center justify-center">{icon}</span>
      <span className="text-sm font-medium">{children}</span>
    </button>
  );
}

function MobileNavLink({ children, active = false }: { children: React.ReactNode; active?: boolean }) {
  return (
    <a
      href="#"
      className={`px-4 py-2 rounded-lg transition-colors ${active
        ? "bg-accent text-accent-foreground"
        : "hover:bg-accent/50 text-muted-foreground hover:text-foreground"
        }`}
    >
      {children}
    </a>
  );
}

function CategoryBadge({ children, active = false }: { children: React.ReactNode; active?: boolean }) {
  return (
    <button
      className={`px-4 py-1.5 rounded-full whitespace-nowrap transition-colors text-sm ${active
        ? "bg-primary text-primary-foreground"
        : "bg-accent/50 hover:bg-accent text-foreground"
        }`}
    >
      {children}
    </button>
  );
}