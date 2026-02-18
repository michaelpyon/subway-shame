import { useMemo } from "react";
import {
  LINE_COLORS,
  SHAME_HEADLINES,
  getScoreTier,
  CATEGORY_CONFIG,
  CATEGORY_ORDER,
  LINE_DIRECTIONS,
} from "../constants/lines";
import LineBadge from "./LineBadge";
import AlertText from "./AlertText";

export default function Trophy({ winner }) {
  const color = LINE_COLORS[winner.id] || "#808183";
  const tier = getScoreTier(winner.daily_score);

  const headline = useMemo(() => {
    const idx = Math.floor(Math.random() * SHAME_HEADLINES.length);
    return SHAME_HEADLINES[idx];
  }, []);

  // Show the best available alerts: current ones first, fall back to peak
  const alertsToShow =
    winner.alerts && winner.alerts.length > 0
      ? winner.alerts
      : winner.peak_alerts || [];

  const breakdown = winner.breakdown || {};
  const sortedCats = CATEGORY_ORDER.filter((cat) => breakdown[cat] > 0);

  const dirs = LINE_DIRECTIONS[winner.id] || ["Uptown", "Downtown"];
  const byDir = winner.by_direction || {};

  return (
    <div className="px-4 pt-8 pb-2 max-w-2xl mx-auto">
      <div
        className="trophy-card relative rounded-2xl p-6 sm:p-8 text-center overflow-hidden"
        style={{
          background: `linear-gradient(135deg, rgba(${hexToRgb(color)}, 0.15) 0%, rgba(17,24,39,1) 70%)`,
          border: `2px solid ${color}40`,
        }}
      >
        {/* Glow effect */}
        <div
          className="absolute inset-0 opacity-20 blur-3xl"
          style={{
            background: `radial-gradient(circle at 50% 0%, ${color}, transparent 60%)`,
          }}
        />

        <div className="relative z-10">
          {/* Trophy icon */}
          <div className="trophy-float text-6xl sm:text-7xl mb-4">🏆</div>

          {/* Headline */}
          <p className="text-sm sm:text-base text-gray-400 uppercase tracking-widest mb-3">
            {headline}
          </p>

          {/* The line badge, large */}
          <div className="flex justify-center mb-4">
            <LineBadge lineId={winner.id} size="xl" />
          </div>

          {/* Daily score */}
          <div className="mb-2">
            <span
              className="text-5xl sm:text-6xl font-black tabular-nums"
              style={{ color: tier.color }}
            >
              {winner.daily_score}
            </span>
            <p className="text-sm text-gray-500 mt-1">shame points today</p>
          </div>

          {/* Live score if different */}
          {winner.score > 0 && (
            <p className="text-xs text-gray-600 mb-3">
              ({winner.score} right now)
            </p>
          )}

          {/* Status */}
          <div
            className="inline-block px-4 py-1.5 rounded-full text-sm font-semibold mb-5"
            style={{
              backgroundColor: `${tier.color}20`,
              color: tier.color,
            }}
          >
            {tier.emoji} {winner.status}
          </div>

          {/* Breakdown bar */}
          {sortedCats.length > 0 && winner.daily_score > 0 && (
            <div className="max-w-md mx-auto mb-5">
              {/* Bar */}
              <div className="h-4 rounded-full overflow-hidden flex bg-gray-800/50 mb-2">
                {sortedCats.map((cat) => {
                  const pts = breakdown[cat];
                  const pct = (pts / winner.daily_score) * 100;
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
              {/* Legend */}
              <div className="flex flex-wrap justify-center gap-x-3 gap-y-1">
                {sortedCats.map((cat) => {
                  const cfg = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG["Other"];
                  return (
                    <span
                      key={cat}
                      className="text-xs flex items-center gap-1"
                    >
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: cfg.color }}
                      />
                      <span className="text-gray-400">{cfg.label}</span>
                      <span className="text-gray-600">{breakdown[cat]}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Direction split */}
          {(byDir.uptown?.score > 0 || byDir.downtown?.score > 0) && (
            <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto mb-5">
              {["uptown", "downtown"].map((d, i) => {
                const dd = byDir[d] || { score: 0 };
                return (
                  <div
                    key={d}
                    className="bg-gray-950/50 rounded-lg p-3 text-center"
                  >
                    <span className="text-xs text-gray-500 block mb-1">
                      {i === 0 ? "↑" : "↓"} {dirs[i]}
                    </span>
                    <span
                      className={`text-2xl font-bold tabular-nums ${
                        dd.score > 0 ? "text-white" : "text-gray-700"
                      }`}
                    >
                      {dd.score}
                    </span>
                    <span className="text-[10px] text-gray-600 block">pts</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Alerts */}
          {alertsToShow.length > 0 && (
            <div className="space-y-2 text-left max-w-lg mx-auto">
              {alertsToShow.map((alert, i) => {
                const a = typeof alert === "string" ? { text: alert } : alert;
                const cfg = a.category
                  ? CATEGORY_CONFIG[a.category] || CATEGORY_CONFIG["Other"]
                  : null;
                return (
                  <div
                    key={i}
                    className="bg-gray-950/60 border border-gray-800 rounded-lg p-3 text-sm text-gray-300 leading-relaxed"
                  >
                    {cfg && (
                      <span
                        className="text-[10px] font-medium uppercase tracking-wider mr-2 px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: `${cfg.color}20`,
                          color: cfg.color,
                        }}
                      >
                        {cfg.label}
                      </span>
                    )}
                    <AlertText text={a.text || alert} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}
