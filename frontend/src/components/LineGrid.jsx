import SubwayLineCard from "./SubwayLineCard";
import { getScoreTier, SCORE_TIERS } from "../constants/lines";

export default function LineGrid({ lines }) {
  // Sort: worst first, then good service
  const sorted = [...lines].sort((a, b) => (b.daily_score || 0) - (a.daily_score || 0));

  const worstCount = sorted.filter(l => (l.daily_score || 0) > 0).length;
  const goodCount = sorted.length - worstCount;

  return (
    <div className="px-4 pb-8 max-w-5xl mx-auto">
      <div className="flex items-baseline justify-between mb-3 px-1">
        <h2 className="text-lg font-semibold text-gray-400">All Lines</h2>
        <div className="flex items-center gap-3 text-xs">
          {worstCount > 0 && (
            <span className="text-red-500">{worstCount} with issues</span>
          )}
          {goodCount > 0 && (
            <span className="text-green-600">{goodCount} on time</span>
          )}
        </div>
      </div>

      {/* Score tier legend */}
      <div className="flex flex-wrap gap-2 mb-4 px-1">
        {[...SCORE_TIERS].reverse().map((tier) => (
          <div key={tier.label} className="flex items-center gap-1 text-[10px]">
            <span>{tier.emoji}</span>
            <span style={{ color: tier.color }} className="font-medium">{tier.label}</span>
            {tier.min > 0 && (
              <span className="text-gray-700">≥{tier.min >= 1000 ? `${tier.min/1000}k` : tier.min} pts</span>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {sorted.map((line, idx) => (
          <SubwayLineCard
            key={line.id}
            line={line}
            rank={idx + 1}
            maxScore={sorted[0]?.daily_score || 1}
          />
        ))}
      </div>
    </div>
  );
}
