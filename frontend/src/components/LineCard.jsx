import {
  LINE_COLORS,
  getScoreTier,
  CATEGORY_CONFIG,
  CATEGORY_ORDER,
  getEditorialLine,
  LINE_ROUTES,
} from "../constants/lines";
import LineBadge from "./LineBadge";

// One line in the grid. Monochrome card, color enters only as the bullet, the
// score color, and the breakdown bar. 0 radius, hard offset shadow, left border
// in the true line color so the eye groups by line without tinting the surface.
export default function LineCard({ line }) {
  const color = LINE_COLORS[line.id] || "#808183";
  const dailyScore = line.daily_score || 0;
  const tier = getScoreTier(dailyScore);
  const editorial = getEditorialLine(line);
  const routeName = LINE_ROUTES[line.id] || `${line.id} train`;

  const topCats = CATEGORY_ORDER.filter(
    (cat) => line.breakdown && (line.breakdown[cat] || 0) > 0
  ).slice(0, 2);

  return (
    <div
      className="flex flex-col p-4"
      style={{
        backgroundColor: "var(--color-ballast)",
        borderLeft: `3px solid ${color}`,
        boxShadow: "0 0 0 1px var(--color-concrete), 3px 3px 0 0 rgba(0,0,0,0.5)",
      }}
    >
      {/* Top row: bullet + score */}
      <div className="flex justify-between items-start gap-2 mb-2">
        <LineBadge lineId={line.id} size="sm" />
        <span
          className="font-display tabular leading-none"
          style={{ fontSize: "32px", color: tier.color }}
        >
          {dailyScore.toLocaleString()}
        </span>
      </div>

      {/* Route name */}
      <h3 className="kicker mb-1" style={{ fontSize: "16px", color: "var(--color-platform)" }}>
        The {line.id} &middot; {routeName}
      </h3>

      {/* Editorial one-liner: blame the train, with the actual alert when short. */}
      {editorial && (
        <p style={{ fontSize: "13px", lineHeight: 1.4, color: "var(--color-newsprint)" }}>
          {editorial}
        </p>
      )}

      <div className="flex-1" />

      {/* Category text labels (no decorative emoji) */}
      {topCats.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {topCats.map((cat) => {
            const cfg = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG.Other;
            return (
              <span
                key={cat}
                className="receipt"
                style={{
                  color: cfg.color,
                  border: `1px solid ${cfg.color}`,
                  padding: "2px 6px",
                }}
              >
                {cfg.label}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
