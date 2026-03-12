import SubwayLineCard from "./SubwayLineCard";
import LineBadge from "./LineBadge";

export default function LineGrid({ lines }) {
  const sorted = [...lines].sort((a, b) => (b.daily_score || 0) - (a.daily_score || 0));

  const problemLines = sorted.filter(l => (l.daily_score || 0) > 0);
  const goodLines = sorted.filter(l => (l.daily_score || 0) === 0);

  return (
    <div className="px-4 pb-8 max-w-2xl mx-auto">
      <div className="flex items-baseline justify-between mb-4 px-1">
        <h2 className="text-lg font-semibold text-gray-400">All Lines</h2>
        <div className="flex items-center gap-3 text-xs">
          {problemLines.length > 0 && (
            <span className="text-red-500">{problemLines.length} with issues</span>
          )}
          {goodLines.length > 0 && (
            <span className="text-green-600">{goodLines.length} on time</span>
          )}
        </div>
      </div>

      {/* Problem lines — full cards */}
      {problemLines.length > 0 && (
        <div className="space-y-2 mb-6">
          {problemLines.map((line, idx) => (
            <SubwayLineCard
              key={line.id}
              line={line}
              rank={idx + 1}
              maxScore={problemLines[0]?.daily_score || 1}
            />
          ))}
        </div>
      )}

      {/* Good service lines — compact badge row */}
      {goodLines.length > 0 && (
        <div className="bg-gray-900/50 rounded-xl px-4 py-3 border border-gray-800/50">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="text-green-500 text-xs font-semibold uppercase tracking-wider">Running normally</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {goodLines.map(line => (
              <LineBadge key={line.id} lineId={line.id} size="sm" />
            ))}
          </div>
        </div>
      )}

      {/* All clear */}
      {problemLines.length === 0 && (
        <div className="text-center py-6 text-gray-600 text-sm">
          All lines running normally.
        </div>
      )}
    </div>
  );
}
