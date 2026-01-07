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
import { ProfileButton } from "./ProfileButton";
import { motion } from "motion/react";

interface HeaderProps {
  currentTab?: string;
  onNavigate?: (tab: string) => void;
  onOpenAuth: (mode?: 'login' | 'signup') => void;
  onToggleMenu?: () => void;
}

export function Header({ currentTab = 'markets', onNavigate, onOpenAuth, onToggleMenu }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const { user, isAuthenticated, isLoading } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      {/* Main Navigation */}
      <div className="w-full px-4 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Main Nav */}
          <div className="flex items-center gap-12">

            {/* Mobile Menu Toggle */}
            <button
              onClick={onToggleMenu}
              className="lg:hidden p-2 hover:bg-accent rounded-lg transition-colors"
              aria-label="Open Menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => onNavigate?.('markets')}
            >
              <div className="w-9 h-9 relative">
                <Logo3D className="w-full h-full" />
                <div className="absolute inset-0 bg-blue-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full pointer-events-none" />
              </div>
              <span className="font-rajdhani font-bold text-2xl tracking-wider text-foreground group-hover:text-primary transition-colors">
                DeJaVu
              </span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-2">
              <NavLink
                icon={<NavIcons.Markets active={currentTab === 'markets'} />}
                active={currentTab === 'markets'}
                onClick={() => onNavigate?.('markets')}
              >
                Markets
              </NavLink>

              <NavLink
                icon={<NavIcons.Ranks active={currentTab === 'ranks'} />}
                active={currentTab === 'ranks'}
                onClick={() => onNavigate?.('ranks')}
              >
                Ranks
              </NavLink>

              <NavLink
                icon={<NavIcons.Activity active={currentTab === 'activity'} />}
                active={currentTab === 'activity'}
                onClick={() => onNavigate?.('activity')}
              >
                Activity
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
            <div className="hidden md:flex items-center gap-2 bg-secondary/50 border border-transparent focus-within:border-primary/20 focus-within:bg-secondary rounded-full px-4 py-2 w-64 transition-all">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search everything..."
                className="bg-transparent border-none outline-none w-full text-sm placeholder:text-muted-foreground/70"
              />
              <span className="text-xs text-muted-foreground opacity-50">/</span>
            </div>

            {/* Theme Toggle Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full relative hover:bg-accent/50">
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
            <button className="relative p-2 hover:bg-accent/50 rounded-full transition-colors w-9 h-9 flex items-center justify-center">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-background"></span>
            </button>

            {/* Auth Buttons / Profile */}
            {isAuthenticated && user ? (
              <div className="hidden sm:block">
                <ProfileButton user={user} onNavigate={onNavigate} />
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Button variant="ghost" className="rounded-full font-medium" onClick={() => onOpenAuth('login')} disabled={isLoading}>
                  Log In
                </Button>
                <Button
                  className="rounded-full px-6 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                  onClick={() => onOpenAuth('signup')}
                  disabled={isLoading}
                >
                  Sign Up
                </Button>
              </div>
            )}
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
      className={`group relative flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${active
        ? "text-foreground"
        : "text-muted-foreground hover:text-foreground"
        }`}
    >
      {active && (
        <motion.div
          layoutId="nav-pill"
          className="absolute inset-0 bg-secondary rounded-full -z-10"
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
      <span className="flex items-center justify-center">{icon}</span>
      <span className={`text-sm font-medium ${active ? "font-semibold" : ""}`}>{children}</span>
    </button>
  );
}


