import { TrendingUp, Star, ChevronRight, X, LogIn, UserPlus, LogOut } from "lucide-react";
import { Button } from "./ui/button";
import { useAuth } from "./auth/AuthContext";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth?: () => void;
}

export function Sidebar({ isOpen, onClose, onOpenAuth }: SidebarProps) {
  const { isAuthenticated, logout } = useAuth();
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 right-0 h-screen w-80 bg-card border-l border-border z-50 lg:z-0 transition-transform duration-300 lg:translate-x-0 overflow-y-auto custom-scrollbar ${isOpen ? "translate-x-0" : "translate-x-full"
          }`}
      >
        <div className="p-6 space-y-6">
          {/* Close Button - Mobile Only */}
          <button
            onClick={onClose}
            className="lg:hidden absolute top-4 right-4 p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Auth Section (Guest Only) */}
          {!isAuthenticated && (
            <div className="rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 p-5">
              <h3 className="font-semibold mb-2">Join DeJaVu</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Sign up to start predicting and earning rewards.
              </p>
              <div className="space-y-2">
                <Button
                  className="w-full bg-primary text-primary-foreground"
                  onClick={onOpenAuth}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Sign Up
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={onOpenAuth}
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Log In
                </Button>
              </div>
            </div>
          )}

          {/* Portfolio Section (User Only) */}
          {isAuthenticated && (
            <div className="space-y-6">
              <div className="rounded-xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-5 h-5 text-purple-500" />
                  <h3 className="font-semibold">Portfolio</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Deposit some cash to start betting
                </p>
                <Button className="w-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600">
                  Deposit
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>

              <Button
                variant="destructive"
                className="w-full bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive"
                onClick={logout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Log Out
              </Button>
            </div>
          )}

          {/* Watchlist Section */}
          <div className="rounded-xl bg-accent/50 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-5 h-5 text-yellow-500" />
              <h3 className="font-semibold">Watchlist</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Click the star on any market to add it to your list
            </p>
            <Button variant="outline" className="w-full rounded-full">
              Trending
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {/* Trending Topics */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Trending Topics</h3>
              <a href="#" className="text-sm text-primary hover:underline">
                See all
              </a>
            </div>
            <div className="space-y-2">
              <TopicBadge>Wildfire</TopicBadge>
              <TopicBadge>Breaking News</TopicBadge>
              <TopicBadge>Canada</TopicBadge>
              <TopicBadge>Trump Inauguration</TopicBadge>
              <TopicBadge>Trump Presidency</TopicBadge>
              <TopicBadge>2025 Predictions</TopicBadge>
              <TopicBadge>Geopolitics</TopicBadge>
              <TopicBadge>NFL Draft</TopicBadge>
              <TopicBadge>Elon Musk</TopicBadge>
              <TopicBadge>Middle East</TopicBadge>
              <TopicBadge>Bitcoin</TopicBadge>
              <TopicBadge>Cyber Truck</TopicBadge>
              <TopicBadge>Bird Flu</TopicBadge>
              <TopicBadge>Weather</TopicBadge>
              <TopicBadge>German Election</TopicBadge>
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Recent Activity</h3>
              <a href="#" className="text-sm text-primary hover:underline">
                See all
              </a>
            </div>
            <div className="space-y-3">
              <ActivityItem
                title="Will EU impose new AFC Championship..."
                subtitle="Placeholder bought: No at 16¢"
                change="+$53.03"
                positive
              />
              <ActivityItem
                title="Will Elon musk reach 600 to 624 million Jan 3..."
                subtitle="Oct 26/YU27/1986 - bought: Yes at 16¢"
                change="+224.43"
                positive
              />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

function TopicBadge({ children }: { children: React.ReactNode }) {
  return (
    <button className="w-full text-left px-3 py-2 rounded-lg bg-accent/50 hover:bg-accent transition-colors text-sm">
      {children}
    </button>
  );
}

function ActivityItem({
  title,
  subtitle,
  change,
  positive = false,
}: {
  title: string;
  subtitle: string;
  change: string;
  positive?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors cursor-pointer">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm line-clamp-1 mb-1">{title}</p>
        <p className="text-xs text-muted-foreground line-clamp-1">{subtitle}</p>
      </div>
      <span
        className={`text - sm font - medium whitespace - nowrap ${positive ? "text-green-500" : "text-red-500"
          } `}
      >
        {change}
      </span>
    </div>
  );
}