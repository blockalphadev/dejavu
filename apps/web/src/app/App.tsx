import { useState } from "react";
import { ThemeProvider } from "./components/ThemeProvider";
import { AuthProvider } from "./components/auth/AuthContext";
import { AuthModal } from "./components/auth/AuthModal";
import { DepositProvider, useDeposit } from "./components/DepositContext";
import { DepositModal } from "./components/DepositModal";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Header } from "./components/Header";
import { HeroSection } from "./components/HeroSection";
import { FilterSection } from "./components/FilterSection";
import { Sidebar } from "./components/Sidebar";
import { ChevronLeft } from "lucide-react";
import { Footer } from "./components/Footer";
import { MarketGrid } from "./components/MarketGrid";
import { CategoryNav } from "./components/CategoryNav";
import SportsCategory from "./components/SportsCategory";
import { MobileBottomNav } from "./components/MobileBottomNav";
import { PortfolioPage } from "./components/PortfolioPage";
import { MobileMenu } from "./components/MobileMenu";

/**
 * Inner App component that has access to DepositContext
 */
function AppContent() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("markets");
  const [activeCategory, setActiveCategory] = useState("top_pics");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { isDepositModalOpen, closeDepositModal } = useDeposit();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header
        currentTab={activeTab}
        onNavigate={setActiveTab}
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onToggleMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        onNavigate={setActiveTab}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {activeTab === 'markets' && (
        <CategoryNav
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
        />
      )}

      <div className="flex">
        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {activeTab === 'markets' && (
            <>
              {activeCategory === 'Sports' ? (
                <SportsCategory />
              ) : (
                <>
                  {activeCategory === 'signals' && <HeroSection />}
                  <FilterSection
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                  />
                  <MarketGrid
                    activeCategory={activeCategory}
                    searchQuery={searchQuery}
                  />
                </>
              )}
            </>
          )}
          {activeTab === 'dashboards' && <PortfolioPage />}
          {activeTab === 'search' && <div className="p-8 text-center text-muted-foreground">Search View Coming Soon</div>}
          {activeTab === 'breaking' && <div className="p-8 text-center text-muted-foreground">Top Markets View Coming Soon</div>}
          {activeTab === 'activity' && <div className="p-8 text-center text-muted-foreground">Activity Feed Coming Soon</div>}
          {activeTab === 'ranks' && <div className="p-8 text-center text-muted-foreground">Global Ranks Coming Soon</div>}
          {activeTab === 'rewards' && <div className="p-8 text-center text-muted-foreground">Rewards & Airdrops Coming Soon</div>}
        </main>

        {/* Sidebar - Desktop */}
        <div className="hidden lg:block">
          <Sidebar isOpen={false} onClose={() => { }} onOpenAuth={() => setIsAuthModalOpen(true)} />
        </div>
      </div>

      {/* Floating Sidebar Toggle - Smart & Persistent */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className={`lg:hidden fixed top-27 right-0 w-8 h-10 rounded-l-lg rounded-r-none shadow-xl flex items-center justify-center z-[60] transition-all duration-300 border-l border-t border-b border-border/20 backdrop-blur-md ${isSidebarOpen
          ? "bg-background/80 text-foreground"
          : "bg-foreground text-background"
          }`}
        aria-label="Toggle Sidebar"
      >
        <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${isSidebarOpen ? "rotate-180" : "rotate-0"}`} />
      </button>

      {/* Sidebar - Mobile */}
      <div className="lg:hidden">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} onOpenAuth={() => setIsAuthModalOpen(true)} />
      </div>

      <div className="hidden lg:block">
        <Footer />
      </div>

      {/* Deposit Modal */}
      <DepositModal isOpen={isDepositModalOpen} onClose={closeDepositModal} />

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden">
        <MobileBottomNav
          currentTab={activeTab}
          onNavigate={setActiveTab}
          onToggleMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />
      </div>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <DepositProvider>
            <AppContent />
          </DepositProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;