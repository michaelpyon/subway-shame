import LineBadge from "./LineBadge";
import { getScoreTier, LINE_ROUTES } from "../constants/lines";

// The standings. Job 3 from the persona: the chat argues whose line is worse,
// this ends the argument. 1 villain right now (the live snapshot, not a daily
// total); ties share the crown explicitly.
// Rank in display 24px, bullet, line name in body, score right-aligned tabular
// with tier color, stamp at micro size.
export default function Leaderboard({ podium }) {
  if (!podium || podium.length === 0) return null;
  const ranked = podium.filter((l) => (l.daily_score || 0) > 0).slice(0, 5);
  if (ranked.length === 0) return null;

  // Assign shared ranks: equal scores share a place number. Computed in a plain
  // reduce so there is no reassigned closure variable surviving past render.
  const rows = ranked.reduce((acc, line, i) => {
    const prevRow = acc[i - 1];
    const place =
      prevRow && prevRow.line.daily_score === line.daily_score ? prevRow.place : i + 1;
    acc.push({ line, place });
    return acc;
  }, []);
  const tieAtTop = rows.filter((r) => r.place === 1).length > 1;

  return (
    <section className="px-4 max-w-[672px] mx-auto">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="kicker" style={{ color: "var(--color-platform)" }}>
          The standings
        </h2>
        <span className="receipt" style={{ color: "var(--color-newsprint)" }}>
          {tieAtTop ? "Tie for the crown" : "1 villain right now"}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {rows.map(({ line, place: rank }) => {
          const tier = getScoreTier(line.daily_score);
          const route = LINE_ROUTES[line.id] || `${line.id} train`;
          return (
            <div
              key={line.id}
              className="flex items-center gap-3 px-4 py-3"
              style={{
                backgroundColor: "var(--color-ballast)",
                boxShadow: "0 0 0 1px var(--color-concrete), 3px 3px 0 0 rgba(0,0,0,0.5)",
              }}
            >
              <span
                className="font-display tabular shrink-0 text-center"
                style={{
                  fontSize: "24px",
                  width: "28px",
                  color: rank === 1 ? tier.color : "var(--color-newsprint)",
                }}
              >
                {rank}
              </span>
              <LineBadge lineId={line.id} size="sm" decorative />
              <div className="flex-1 min-w-0">
                <p
                  className="truncate"
                  style={{
                    fontFamily: "var(--font-text)",
                    fontSize: "15px",
                    color: "var(--color-platform)",
                  }}
                >
                  The {line.id}
                </p>
                <p className="receipt truncate" style={{ color: "var(--color-newsprint)" }}>
                  {route}
                </p>
              </div>
              <div className="text-right shrink-0">
                <div className="flex items-baseline gap-1 justify-end">
                  <span
                    className="font-display tabular"
                    style={{ fontSize: "24px", color: tier.color }}
                  >
                    {line.daily_score.toLocaleString()}
                  </span>
                  <span className="receipt" style={{ color: "var(--color-newsprint)" }}>
                    pts
                  </span>
                </div>
                <span className="receipt" style={{ color: tier.color }}>
                  {tier.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
