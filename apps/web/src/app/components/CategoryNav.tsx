import { CATEGORIES, CategoryId } from "../utils/mockData";

interface CategoryNavProps {
    activeCategory: string;
    onSelectCategory: (id: string) => void;
}

export function CategoryNav({ activeCategory, onSelectCategory }: CategoryNavProps) {
    return (
        <div className="sticky top-[64px] z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40">
            <div className="container mx-auto px-4">
                <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-3 mask-linear-fade">
                    {CATEGORIES.map((cat) => {
                        const Icon = cat.icon;
                        const isActive = activeCategory === cat.id;

                        return (
                            <button
                                key={cat.id}
                                onClick={() => onSelectCategory(cat.id)}
                                className={`
                  flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all duration-200
                  ${isActive
                                        ? "bg-primary text-primary-foreground shadow-sm scale-105"
                                        : "bg-accent/50 text-muted-foreground hover:bg-accent hover:text-foreground"
                                    }
                `}
                            >
                                <Icon className={`w-4 h-4 ${isActive ? "animate-pulse" : ""}`} />
                                {cat.label}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
