import { Search, SlidersHorizontal, LayoutGrid, List } from "lucide-react";
import { useState, useCallback } from "react";


interface FilterSectionProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function FilterSection({ searchQuery, onSearchChange }: FilterSectionProps) {
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  }, [onSearchChange]);

  const handleToggleAnimations = useCallback(() => {
    setAnimationsEnabled(prev => !prev);
  }, []);

  const handleViewModeChange = useCallback((mode: "grid" | "list") => {
    setViewMode(mode);
  }, []);

  return (
    <div className="container mx-auto px-4 py-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Left Side - Search and Filters */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Filter Button */}
          <button className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/80 rounded-lg transition-colors">
            <SlidersHorizontal className="w-4 h-4" />
            <span className="text-sm">Filters</span>
          </button>

          {/* Search Markets */}
          <div className="flex items-center gap-2 bg-accent/50 rounded-lg px-3 py-2 flex-1 sm:w-64">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search markets"
              className="bg-transparent border-none outline-none w-full text-sm"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>

          {/* Animations Toggle */}
          <div className="hidden md:flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Animations</span>
            <button
              onClick={handleToggleAnimations}
              className={`relative w-11 h-6 rounded-full transition-colors ${animationsEnabled ? "bg-cyan-500" : "bg-accent"
                }`}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${animationsEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
              />
            </button>
          </div>
        </div>

        {/* Right Side - View Mode and Sort */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-accent rounded-lg p-1">
            <button
              onClick={() => handleViewModeChange("grid")}
              className={`p-1.5 rounded transition-colors ${viewMode === "grid"
                ? "bg-background shadow-sm"
                : "hover:bg-background/50"
                }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleViewModeChange("list")}
              className={`p-1.5 rounded transition-colors ${viewMode === "list"
                ? "bg-background shadow-sm"
                : "hover:bg-background/50"
                }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Sort Dropdown */}
          <select className="px-4 py-2 bg-accent hover:bg-accent/80 rounded-lg transition-colors text-sm cursor-pointer outline-none">
            <option>Newest</option>
            <option>Most Popular</option>
            <option>Highest Volume</option>
            <option>Ending Soon</option>
          </select>
        </div>
      </div>

    </div>
  );
}