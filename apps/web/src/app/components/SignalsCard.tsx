import { ArrowUpRight, Clock, Share2 } from "lucide-react";
import { Signal } from "../utils/mockData";

export function SignalsCard({ signal }: { signal: Signal }) {
    return (
        <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-4 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${signal.impact === 'HIGH' ? 'bg-red-500/20 text-red-500' :
                            signal.impact === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-500' :
                                'bg-blue-500/20 text-blue-500'
                        }`}>
                        {signal.impact} IMPACT
                    </span>
                    <span className="text-xs text-muted-foreground">• {signal.source}</span>
                </div>
                <button className="text-muted-foreground hover:text-primary transition-colors">
                    <Share2 className="w-4 h-4" />
                </button>
            </div>

            <h3 className="text-lg font-semibold mb-3 leading-tight group-hover:text-primary transition-colors">
                {signal.title}
            </h3>

            <div className="flex items-center justify-between text-xs text-muted-foreground mt-4">
                <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{signal.timeAgo}</span>
                </div>

                <button className="flex items-center gap-1 text-primary font-medium hover:underline">
                    Read Signal <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Background decoration */}
            <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-5 blur-2xl ${signal.sentiment === 'BULLISH' ? 'bg-green-500' :
                    signal.sentiment === 'BEARISH' ? 'bg-red-500' : 'bg-blue-500'
                }`} />
        </div>
    );
}
