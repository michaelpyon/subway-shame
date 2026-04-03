import {
  LINE_COLORS,
  getScoreTier,
  CATEGORY_CONFIG,
  CATEGORY_ORDER,
  getEditorialLine,
  LINE_ROUTES,
} from "../constants/lines";
import LineBadge from "./LineBadge";

// Status badge labels mapped from MTA status text
function getStatusBadge(line) {
  const dailyScore = line.daily_score || 0;
  const liveScore = line.score || 0;
  if (dailyScore === 0) return null;
  if (liveScore === 0) return { label: "RESOLVED", color: "#9CA3AF", bg: "rgba(156,163,175,0.2)" };

  const status = (line.status || "").toLowerCase();
  if (status.includes("suspend") || status.includes("no service"))
    return { label: "SUSPENDED", color: "var(--color-cream)", bg: "var(--color-signal-red)" };
  if (status.includes("delay"))
    return { label: "DELAYED", color: "var(--color-tunnel)", bg: "#EAB308" };
  if (status.includes("slow"))
    return { label: "SLOW", color: "var(--color-tunnel)", bg: "#F59E0B" };
  return { label: "DISRUPTED", color: "var(--color-cream)", bg: "var(--color-outline-variant)" };
}

export default function LineCard({ line, halftone = false }) {
  const color = LINE_COLORS[line.id] || "#808183";
  const dailyScore = line.daily_score || 0;
  const tier = getScoreTier(dailyScore);
  const statusBadge = getStatusBadge(line);
  const editorial = getEditorialLine(line);
  const routeName = LINE_ROUTES[line.id] || `${line.id} Train`;

  // Top category for the card
  const topCats = CATEGORY_ORDER.filter(
    (cat) => line.breakdown && (line.breakdown[cat] || 0) > 0
  ).slice(0, 2);

  return (
    <div
      className={`flex flex-col p-3 relative overflow-hidden ${halftone ? "halftone" : ""}`}
      style={{
        backgroundColor: 'var(--color-ballast)',
        borderTop: `4px solid ${color}50`,
        borderLeft: `4px solid ${color}`,
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {/* Top row: badge + status */}
      <div className="flex justify-between items-start mb-2">
        <LineBadge lineId={line.id} size="sm" />
        {statusBadge && (
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 uppercase tracking-wider font-label"
            style={{
              backgroundColor: statusBadge.bg,
              color: statusBadge.color,
            }}
          >
            {statusBadge.label}
          </span>
        )}
      </div>

      {/* Route name */}
      <h3
        className="leading-tight mb-1"
        style={{
          fontFamily: 'var(--font-headline)',
          fontWeight: 800,
          fontStyle: 'italic',
          fontSize: '18px',
          textTransform: 'uppercase',
          letterSpacing: '-0.02em',
          color: 'var(--color-cream)',
        }}
      >
        {routeName}
      </h3>

      {/* Editorial one-liner */}
      {editorial && (
        <p
          className="text-[10px] leading-snug mb-2"
          style={{ color: 'var(--color-outline)' }}
        >
          {editorial}
        </p>
      )}

      {/* Spacer to push score to bottom */}
      <div className="flex-1" />

      {/* Category pills */}
      {topCats.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {topCats.map((cat) => {
            const cfg = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG["Other"];
            return (
              <span
                key={cat}
                className="text-[8px] font-bold px-1.5 py-0.5 uppercase"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  color: cfg.color,
                }}
              >
                {cfg.icon} {cfg.label}
              </span>
            );
          })}
        </div>
      )}

      {/* Breakdown bar */}
      {line.breakdown && dailyScore > 0 && (
        <div className="h-1.5 flex mb-2" style={{ backgroundColor: 'var(--color-concrete)' }}>
          {CATEGORY_ORDER.filter((cat) => (line.breakdown[cat] || 0) > 0).map((cat) => {
            const pts = line.breakdown[cat];
            const pct = (pts / dailyScore) * 100;
            const cfg = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG["Other"];
            return (
              <div
                key={cat}
                className="h-full"
                style={{
                  width: `${Math.max(pct, 5)}%`,
                  backgroundColor: cfg.color,
                }}
                title={`${cfg.label}: ${pts} pts`}
              />
            );
          })}
        </div>
      )}

      {/* Score — large monospace, bottom right */}
      <div className="flex justify-end">
        <span
          className="leading-none"
          style={{
            fontFamily: 'var(--font-headline)',
            fontWeight: 900,
            fontSize: '32px',
            color: tier.color,
            letterSpacing: '-0.04em',
          }}
        >
          {dailyScore.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
