import { useState } from "react";
import { ThemeProvider } from "./components/ThemeProvider";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Header } from "./components/Header";
import { HeroSection } from "./components/HeroSection";
import { FilterSection } from "./components/FilterSection";
import { Sidebar } from "./components/Sidebar";
import { Menu } from "lucide-react";
import { Footer } from "./components/Footer";
import { MarketGrid } from "./components/MarketGrid";

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("markets");

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <div className="min-h-screen bg-background text-foreground">
          <Header currentTab={activeTab} onNavigate={setActiveTab} />

          <div className="flex">
            {/* Main Content */}
            <main className="flex-1 min-w-0">
              {activeTab === 'markets' && (
                <>
                  <HeroSection />
                  <FilterSection />
                  <MarketGrid />
                </>
              )}
              {activeTab === 'dashboards' && <div className="p-8 text-center text-muted-foreground">Dashboards Coming Soon</div>}
              {activeTab === 'activity' && <div className="p-8 text-center text-muted-foreground">Activity Feed Coming Soon</div>}
              {activeTab === 'ranks' && <div className="p-8 text-center text-muted-foreground">Global Ranks Coming Soon</div>}
              {activeTab === 'rewards' && <div className="p-8 text-center text-muted-foreground">Rewards & Airdrops Coming Soon</div>}
            </main>

            {/* Sidebar - Desktop */}
            <div className="hidden lg:block">
              <Sidebar isOpen={false} onClose={() => { }} />
            </div>
          </div>

          {/* Floating Sidebar Button - Mobile */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-full shadow-lg flex items-center justify-center z-30 transition-all hover:scale-110"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Sidebar - Mobile */}
          <div className="lg:hidden">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
          </div>

          <Footer />
        </div>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;