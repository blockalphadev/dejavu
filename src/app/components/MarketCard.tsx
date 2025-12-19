import { MessageCircle, Share2, Bookmark, TrendingUp } from "lucide-react";
import { memo } from "react";

interface MarketCardProps {
  title: string;
  image?: string;
  emoji?: string;
  questions: {
    text: string;
    yesPercent: number;
    noPercent: number;
  }[];
  volume?: string;
  comments?: number;
  badge?: string;
}

export const MarketCard = memo(function MarketCard({ title, emoji, questions, volume, comments = 0, badge }: MarketCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 hover:border-primary/50 transition-all duration-300 hover:shadow-lg group">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        {emoji && (
          <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-xl flex-shrink-0 group-hover:scale-110 transition-transform">
            {emoji}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-card-foreground mb-1 line-clamp-2">
            {title}
          </h3>
          {badge && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 rounded text-xs">
              {badge}
            </span>
          )}
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-3 mb-4">
        {questions.map((question, idx) => (
          <div key={idx} className="space-y-2">
            <p className="text-sm text-muted-foreground">{question.text}</p>
            <div className="grid grid-cols-2 gap-2">
              {/* Yes Button */}
              <button className="group/btn relative overflow-hidden rounded-lg border border-green-500/30 bg-green-500/5 hover:bg-green-500/15 p-3 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-green-600 dark:text-green-400 font-medium">Yes</span>
                  <span className="text-green-600 dark:text-green-400 font-bold">
                    {question.yesPercent}%
                  </span>
                </div>
                <div className="mt-1 text-xs text-green-600/70 dark:text-green-400/70">
                  {question.yesPercent}¢
                </div>
                <div
                  className="absolute bottom-0 left-0 h-1 bg-green-500 transition-all group-hover/btn:h-full group-hover/btn:opacity-10"
                  style={{ width: `${question.yesPercent}%` }}
                />
              </button>

              {/* No Button */}
              <button className="group/btn relative overflow-hidden rounded-lg border border-red-500/30 bg-red-500/5 hover:bg-red-500/15 p-3 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-red-600 dark:text-red-400 font-medium">No</span>
                  <span className="text-red-600 dark:text-red-400 font-bold">
                    {question.noPercent}%
                  </span>
                </div>
                <div className="mt-1 text-xs text-red-600/70 dark:text-red-400/70">
                  {question.noPercent}¢
                </div>
                <div
                  className="absolute bottom-0 left-0 h-1 bg-red-500 transition-all group-hover/btn:h-full group-hover/btn:opacity-10"
                  style={{ width: `${question.noPercent}%` }}
                />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-border/50">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {volume && (
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>{volume}</span>
            </div>
          )}
          <button className="flex items-center gap-1 hover:text-foreground transition-colors">
            <MessageCircle className="w-3 h-3" />
            <span>{comments}</span>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-1.5 hover:bg-accent rounded transition-colors">
            <Share2 className="w-3.5 h-3.5" />
          </button>
          <button className="p-1.5 hover:bg-accent rounded transition-colors">
            <Bookmark className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
});