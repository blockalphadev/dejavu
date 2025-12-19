import { useState } from "react";
import { ThemeProvider } from "./components/ThemeProvider";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Header } from "./components/Header";
import { HeroSection } from "./components/HeroSection";
import { FilterSection } from "./components/FilterSection";
import { MarketCard } from "./components/MarketCard";
import { Sidebar } from "./components/Sidebar";
import { Menu } from "lucide-react";

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <div className="min-h-screen bg-background text-foreground">
          <Header />
          
          <div className="flex">
            {/* Main Content */}
            <main className="flex-1 min-w-0">
              <HeroSection />
              <FilterSection />
              
              {/* Markets Grid */}
              <div className="container mx-auto px-4 py-6">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  <MarketCard
                    emoji="👤"
                    title="Yoon arrested by January 31?"
                    questions={[
                      { text: "", yesPercent: 60, noPercent: 40 }
                    ]}
                    volume="2M"
                    comments={651}
                  />
                  
                  <MarketCard
                    emoji="🚀"
                    title="SpaceX Starship Flight Test 7"
                    badge="NEW"
                    questions={[
                      { text: "Launch by Jan 10?", yesPercent: 76, noPercent: 24 },
                      { text: "Launch before February?", yesPercent: 88, noPercent: 12 },
                      { text: "Reaches Space?", yesPercent: 95, noPercent: 5 }
                    ]}
                    volume="344K"
                    comments={21}
                  />
                  
                  <MarketCard
                    emoji="🎵"
                    title="TikTok band in the US before May 2025?"
                    questions={[
                      { text: "", yesPercent: 59, noPercent: 41 }
                    ]}
                    volume="3M"
                    comments={591}
                  />
                  
                  <MarketCard
                    emoji="🇮🇱"
                    title="Israel x Hamas cease-fire by January 31?"
                    questions={[
                      { text: "", yesPercent: 31, noPercent: 69 }
                    ]}
                    volume="575,000"
                    comments={0}
                  />
                  
                  <MarketCard
                    emoji="💰"
                    title="What price will bitcoin in January?"
                    questions={[
                      { text: "$200,000", yesPercent: 76, noPercent: 24 }
                    ]}
                    volume="0"
                    comments={0}
                  />
                  
                  <MarketCard
                    emoji="🎤"
                    title="Elon musk number of tweets January 3-10? (Continued)"
                    questions={[
                      { text: "575-999", yesPercent: 31, noPercent: 69 }
                    ]}
                    volume="0"
                    comments={0}
                  />

                  <MarketCard
                    emoji="🏈"
                    title="NFL Super Bowl 2025 Winner"
                    questions={[
                      { text: "Kansas City Chiefs?", yesPercent: 42, noPercent: 58 },
                      { text: "Buffalo Bills?", yesPercent: 28, noPercent: 72 }
                    ]}
                    volume="1.2M"
                    comments={342}
                  />

                  <MarketCard
                    emoji="💻"
                    title="Will Apple release new MacBook Pro in Q1 2025?"
                    questions={[
                      { text: "", yesPercent: 35, noPercent: 65 }
                    ]}
                    volume="450K"
                    comments={127}
                  />

                  <MarketCard
                    emoji="🌍"
                    title="Climate Summit Agreement by March?"
                    badge="NEW"
                    questions={[
                      { text: "Major countries sign?", yesPercent: 68, noPercent: 32 },
                      { text: "US participates?", yesPercent: 52, noPercent: 48 }
                    ]}
                    volume="890K"
                    comments={256}
                  />

                  <MarketCard
                    emoji="📱"
                    title="Samsung Galaxy S25 release before Feb 15?"
                    questions={[
                      { text: "", yesPercent: 92, noPercent: 8 }
                    ]}
                    volume="320K"
                    comments={89}
                  />

                  <MarketCard
                    emoji="⚡"
                    title="Will Tesla announce new model in Q1?"
                    questions={[
                      { text: "", yesPercent: 45, noPercent: 55 }
                    ]}
                    volume="1.5M"
                    comments={478}
                  />

                  <MarketCard
                    emoji="🎮"
                    title="Nintendo Switch 2 announcement in January?"
                    badge="NEW"
                    questions={[
                      { text: "", yesPercent: 71, noPercent: 29 }
                    ]}
                    volume="680K"
                    comments={234}
                  />
                </div>

                {/* Load More */}
                <div className="flex justify-center mt-8">
                  <button className="px-8 py-3 bg-accent hover:bg-accent/80 rounded-full transition-colors">
                    Load More Markets
                  </button>
                </div>
              </div>
            </main>

            {/* Sidebar - Desktop */}
            <div className="hidden lg:block">
              <Sidebar isOpen={false} onClose={() => {}} />
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

          {/* Footer */}
          <footer className="border-t border-border bg-card mt-12">
            <div className="container mx-auto px-4 py-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
                <div>
                  <h4 className="mb-4">Markets</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li><a href="#" className="hover:text-foreground transition-colors">Politics</a></li>
                    <li><a href="#" className="hover:text-foreground transition-colors">Sports</a></li>
                    <li><a href="#" className="hover:text-foreground transition-colors">Crypto</a></li>
                    <li><a href="#" className="hover:text-foreground transition-colors">Business</a></li>
                  </ul>
                </div>
                <div>
                  <h4 className="mb-4">Resources</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li><a href="#" className="hover:text-foreground transition-colors">Help Center</a></li>
                    <li><a href="#" className="hover:text-foreground transition-colors">API Docs</a></li>
                    <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
                    <li><a href="#" className="hover:text-foreground transition-colors">Community</a></li>
                  </ul>
                </div>
                <div>
                  <h4 className="mb-4">Company</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
                    <li><a href="#" className="hover:text-foreground transition-colors">Careers</a></li>
                    <li><a href="#" className="hover:text-foreground transition-colors">Press</a></li>
                    <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
                  </ul>
                </div>
                <div>
                  <h4 className="mb-4">Legal</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li><a href="#" className="hover:text-foreground transition-colors">Terms</a></li>
                    <li><a href="#" className="hover:text-foreground transition-colors">Privacy</a></li>
                    <li><a href="#" className="hover:text-foreground transition-colors">Cookie Policy</a></li>
                    <li><a href="#" className="hover:text-foreground transition-colors">Licenses</a></li>
                  </ul>
                </div>
              </div>
              <div className="pt-6 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">C</span>
                  </div>
                  <span className="font-bold">CryonMarket</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  © 2025 CryonMarket. All rights reserved.
                </p>
                <div className="flex items-center gap-4">
                  <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                    <span className="sr-only">Twitter</span>
                    𝕏
                  </a>
                  <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                    <span className="sr-only">Discord</span>
                    💬
                  </a>
                  <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                    <span className="sr-only">Telegram</span>
                    ✈️
                  </a>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;