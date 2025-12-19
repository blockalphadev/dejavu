import { Search, Bell, Menu, X, Sun, Moon } from "lucide-react";
import { useState, useCallback } from "react";
import { useTheme } from "./ThemeProvider";
import { Button } from "./ui/button";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const handleToggleMenu = useCallback(() => {
    setIsMenuOpen(prev => !prev);
  }, []);

  const handleToggleTheme = useCallback(() => {
    toggleTheme();
  }, [toggleTheme]);

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

            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <span className="font-bold text-xl hidden sm:block">CryonMarket</span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              <NavLink icon="📊" active>Markets</NavLink>
              <NavLink icon="📈">Dashboards</NavLink>
              <NavLink icon="⚡">Activity</NavLink>
              <NavLink icon="🏆">Ranks</NavLink>
              <NavLink icon="🎁">Rewards</NavLink>
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

            {/* Theme Toggle with Slider */}
            <button
              onClick={handleToggleTheme}
              className="relative w-14 h-7 bg-accent rounded-full p-1 transition-colors duration-300 hover:bg-accent/80"
              aria-label="Toggle theme"
            >
              <div
                className={`absolute w-5 h-5 bg-primary rounded-full transition-transform duration-300 ease-in-out flex items-center justify-center ${
                  theme === "dark" ? "translate-x-7" : "translate-x-0"
                }`}
              >
                {theme === "dark" ? (
                  <Moon className="w-3 h-3 text-primary-foreground" />
                ) : (
                  <Sun className="w-3 h-3 text-primary-foreground" />
                )}
              </div>
            </button>

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

function NavLink({ icon, children, active = false }: { icon: string; children: React.ReactNode; active?: boolean }) {
  return (
    <a
      href="#"
      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
        active
          ? "bg-accent text-accent-foreground"
          : "hover:bg-accent/50 text-muted-foreground hover:text-foreground"
      }`}
    >
      <span>{icon}</span>
      <span className="text-sm">{children}</span>
    </a>
  );
}

function MobileNavLink({ children, active = false }: { children: React.ReactNode; active?: boolean }) {
  return (
    <a
      href="#"
      className={`px-4 py-2 rounded-lg transition-colors ${
        active
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
      className={`px-4 py-1.5 rounded-full whitespace-nowrap transition-colors text-sm ${
        active
          ? "bg-primary text-primary-foreground"
          : "bg-accent/50 hover:bg-accent text-foreground"
      }`}
    >
      {children}
    </button>
  );
}