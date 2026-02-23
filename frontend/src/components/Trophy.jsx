import { useMemo, useState, useCallback } from "react";
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

export default function Trophy({ winner, lines = [] }) {
  const color = LINE_COLORS[winner.id] || "#808183";
  const tier = getScoreTier(winner.daily_score);
  const [shareState, setShareState] = useState("idle"); // idle | copied | shared | error

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

  // Compute line counts for share text
  const worstCount = lines.filter((l) => (l.daily_score || 0) > 0).length;
  const goodCount = lines.length - worstCount;

  const handleShare = useCallback(async () => {
    const date = new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    const lineName = `${winner.id} Train`;
    const shareText = `🚇 Subway Shame — ${date}\n🏆 Worst: ${lineName} (${winner.daily_score} shame pts)\n${worstCount} lines delayed, ${goodCount} running clean\nhttps://michaelpyon.github.io/subway-shame/`;

    try {
      if (navigator.share) {
        await navigator.share({ text: shareText, title: "Subway Shame NYC" });
        setShareState("shared");
      } else {
        await navigator.clipboard.writeText(shareText);
        setShareState("copied");
      }
    } catch (err) {
      // User cancelled or clipboard failed — try fallback
      try {
        await navigator.clipboard.writeText(shareText);
        setShareState("copied");
      } catch {
        setShareState("error");
      }
    }
    setTimeout(() => setShareState("idle"), 2500);
  }, [winner, worstCount, goodCount]);

  const shareLabel =
    shareState === "copied"
      ? "✓ Copied!"
      : shareState === "shared"
      ? "✓ Shared!"
      : shareState === "error"
      ? "Try again"
      : "📸 Share Today's Shame";

  return (
    <div className="px-4 pt-8 pb-2 max-w-2xl mx-auto">
      <div
        className="trophy-card relative rounded-2xl p-6 sm:p-8 text-center overflow-hidden"
        style={{
          background: `linear-gradient(135deg, rgba(${hexToRgb(color)}, 0.15) 0%, rgba(17,24,39,1) 70%)`,
          border: `2px solid ${color}40`,
        }}
      >
        {/* LIVE badge */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-gray-900/80 rounded-full px-2.5 py-1 border border-gray-700/60">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-300">Live</span>
        </div>

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
            <div className="space-y-2 text-left max-w-lg mx-auto mb-5">
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

          {/* Share button */}
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 active:scale-95"
            style={{
              backgroundColor:
                shareState === "idle"
                  ? `${color}18`
                  : shareState === "error"
                  ? "#EF444418"
                  : "#16A34A18",
              border: `1px solid ${
                shareState === "idle"
                  ? `${color}50`
                  : shareState === "error"
                  ? "#EF444450"
                  : "#16A34A50"
              }`,
              color:
                shareState === "idle"
                  ? color
                  : shareState === "error"
                  ? "#EF4444"
                  : "#16A34A",
            }}
          >
            {shareLabel}
          </button>
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
