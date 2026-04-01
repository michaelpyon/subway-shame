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
          border: '2px solid rgba(245, 240, 232, 0.15)',
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
                  <div className="w-px h-4" style={{ backgroundColor: 'rgba(245, 240, 232, 0.12)' }} />
                )}
                <div
                  className="flex items-center gap-2"
                  style={{ color: i === 0 ? tier.color : 'rgba(245, 240, 232, 0.5)' }}
                >
                  <span
                    className="px-1 text-[10px]"
                    style={{
                      backgroundColor: i === 0 ? tier.color : 'rgba(245, 240, 232, 0.15)',
                      color: i === 0 ? '#0A0A0A' : 'rgba(245, 240, 232, 0.5)',
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
