import { ChevronRight } from "lucide-react";
import heroImage from "figma:asset/23b9b4e70191b182766beeae2afa69fc613a4f7c.png";

export function HeroSection() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* NFL Playoffs Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 p-6 md:p-8 min-h-[280px] flex flex-col justify-between group">
          <div className="relative z-10">
            <h2 className="text-white text-2xl md:text-3xl mb-2">NFL Playoffs</h2>
            <p className="text-blue-100 mb-6">Super Wildcard Weekend is here!</p>
            <button className="inline-flex items-center gap-2 px-6 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-full transition-all backdrop-blur-sm">
              Games
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-48 h-48 md:w-64 md:h-64 opacity-90 group-hover:scale-110 transition-transform duration-300">
            <div className="w-full h-full bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
              <div className="text-6xl md:text-8xl">🏈</div>
            </div>
          </div>
        </div>

        {/* Right Column - Two Stacked Cards */}
        <div className="grid grid-cols-1 gap-4">
          {/* New Year's Predictions */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 p-6 min-h-[130px] flex items-center justify-between group">
            <div className="relative z-10">
              <h3 className="text-white mb-1">New Year's predictions</h3>
              <p className="text-purple-100 text-sm mb-3">What's in store for '25?</p>
              <button className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-full transition-all backdrop-blur-sm text-sm">
                Markets
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="text-5xl opacity-90 group-hover:scale-110 transition-transform">🎆</div>
          </div>

          {/* Trump Admin */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-600 to-red-800 p-6 min-h-[130px] flex items-center justify-between group">
            <div className="relative z-10">
              <h3 className="text-white mb-1">Trump Admin</h3>
              <p className="text-red-100 text-sm mb-3">Track promises, appointments, & more!</p>
              <button className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-full transition-all backdrop-blur-sm text-sm">
                Dashboard
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="text-5xl opacity-90 group-hover:scale-110 transition-transform">🏛️</div>
          </div>
        </div>
      </div>
    </div>
  );
}
