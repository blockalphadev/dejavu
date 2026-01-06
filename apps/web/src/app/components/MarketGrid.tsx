import { MarketCard } from "./MarketCard";

export function MarketGrid() {
    return (
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
                    title="TikTok band in the US before May 2026?"
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
                    title="NFL Super Bowl 2026 Winner"
                    questions={[
                        { text: "Kansas City Chiefs?", yesPercent: 42, noPercent: 58 },
                        { text: "Buffalo Bills?", yesPercent: 28, noPercent: 72 }
                    ]}
                    volume="1.2M"
                    comments={342}
                />

                <MarketCard
                    emoji="💻"
                    title="Will Apple release new MacBook Pro in Q1 2026?"
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
    );
}
