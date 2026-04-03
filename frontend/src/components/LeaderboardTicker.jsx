import LineBadge from "./LineBadge";
import { getScoreTier } from "../constants/lines";

export default function LeaderboardTicker({ podium }) {
  if (!podium || podium.length === 0) return null;
  // Only show lines with scores
  const ranked = podium.filter((l) => (l.daily_score || 0) > 0).slice(0, 3);
  if (ranked.length === 0) return null;

  return (
    <div className="px-4 max-w-2xl mx-auto">
      <div
        className="overflow-x-auto"
        style={{
          border: '2px solid var(--color-outline-variant)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div
          className="flex items-center gap-4 min-w-max px-3 py-2.5"
          style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700 }}
        >
          {ranked.map((line, i) => {
            const tier = getScoreTier(line.daily_score);
            const shortLabel = tier.label.split(" ")[0].toUpperCase();
            return (
              <div key={line.id} className="flex items-center gap-4">
                {i > 0 && (
                  <div className="w-px h-4" style={{ backgroundColor: 'var(--color-outline-variant)' }} />
                )}
                <div
                  className="flex items-center gap-2"
                  style={{ color: i === 0 ? tier.color : 'var(--color-on-surface-variant)' }}
                >
                  <span
                    className="px-1 text-[10px] font-label"
                    style={{
                      backgroundColor: i === 0 ? tier.color : 'var(--color-outline-variant)',
                      color: i === 0 ? 'var(--color-tunnel)' : 'var(--color-on-surface-variant)',
                    }}
                  >
                    #{i + 1}
                  </span>
                  <LineBadge lineId={line.id} size="xs" />
                  <span className="tabular-nums">{line.daily_score.toLocaleString()}</span>
                  <span className="text-[9px] uppercase tracking-wider">{shortLabel}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
