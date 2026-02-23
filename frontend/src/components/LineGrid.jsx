import SubwayLineCard from "./SubwayLineCard";
import { getScoreTier } from "../constants/lines";

export default function LineGrid({ lines }) {
  // Sort: worst first, then good service
  const sorted = [...lines].sort((a, b) => (b.daily_score || 0) - (a.daily_score || 0));

  const worstCount = sorted.filter(l => (l.daily_score || 0) > 0).length;
  const goodCount = sorted.length - worstCount;

  return (
    <div className="px-4 pb-8 max-w-5xl mx-auto">
      <div className="flex items-baseline justify-between mb-4 px-1">
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
