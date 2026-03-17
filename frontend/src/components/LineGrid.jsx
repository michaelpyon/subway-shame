import SubwayLineCard from "./SubwayLineCard";
import LineBadge from "./LineBadge";

export default function LineGrid({ lines, history = null, records = null }) {
  const sorted = [...lines].sort((a, b) => (b.daily_score || 0) - (a.daily_score || 0));

  const problemLines = sorted.filter(l => (l.daily_score || 0) > 0);
  const goodLines = sorted.filter(l => (l.daily_score || 0) === 0);

  return (
    <div className="px-4 pb-8 max-w-2xl mx-auto">
      <div className="flex items-baseline justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <h2
            className="text-lg font-semibold"
            style={{ fontFamily: 'var(--font-display)', color: 'rgba(245, 240, 232, 0.5)', letterSpacing: '0.04em', fontSize: '22px' }}
          >
            ALL LINES
          </h2>
          <button
            onClick={() => {
              const el = document.getElementById("scoring-explainer");
              if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold leading-none transition-colors press-scale"
            style={{
              border: '1px solid rgba(245, 240, 232, 0.15)',
              color: 'rgba(245, 240, 232, 0.3)',
            }}
            title="How are shame points calculated?"
            aria-label="How are shame points calculated?"
          >
            ?
          </button>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {problemLines.length > 0 && (
            <span style={{ color: '#E8353A' }}>{problemLines.length} with issues</span>
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
              sparkData={history?.[line.id] ?? null}
              record={records?.[line.id] ?? null}
            />
          ))}
        </div>
      )}

      {/* Good service lines — compact badge row */}
      {goodLines.length > 0 && (
        <div
          className="rounded-xl px-4 py-3"
          style={{
            backgroundColor: 'rgba(26, 26, 26, 0.5)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
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
        <div className="text-center py-6 text-sm" style={{ color: 'rgba(245, 240, 232, 0.25)' }}>
          All lines running normally.
        </div>
      )}
    </div>
  );
}
