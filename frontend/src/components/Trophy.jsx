import { useMemo, useState, useCallback, useEffect } from "react";
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
import ShareCard from "./ShareCard";

const HOF_KEY = "subway-shame-hof";
const HOF_MAX = 50; // keep last 50 entries, display top 5

function loadHof() {
  try {
    const raw = localStorage.getItem(HOF_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToHof(winner) {
  try {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const existing = loadHof();
    // One entry per calendar day — update if today's score is higher
    const idx = existing.findIndex((e) => e.date === today);
    const label = formatHofLabel(today, winner.id, winner.daily_score);
    const entry = { date: today, lineId: winner.id, score: winner.daily_score, label };
    let updated;
    if (idx >= 0) {
      if (existing[idx].score < winner.daily_score) {
        updated = [...existing];
        updated[idx] = entry;
      } else {
        updated = existing;
      }
    } else {
      updated = [entry, ...existing].slice(0, HOF_MAX);
    }
    localStorage.setItem(HOF_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

function formatHofLabel(dateStr, lineId, score) {
  const d = new Date(dateStr + "T12:00:00"); // noon local to avoid timezone edge
  const month = d.toLocaleDateString("en-US", { month: "short" });
  const day = d.getDate();
  return `${month} ${day} — ${lineId} Train — ${score} pts`;
}

function getTopHof(entries, n = 5) {
  return [...entries].sort((a, b) => b.score - a.score).slice(0, n);
}

export default function Trophy({ winner, lines = [] }) {
  const color = LINE_COLORS[winner.id] || "#808183";
  const tier = getScoreTier(winner.daily_score);
  const [shareState, setShareState] = useState("idle"); // idle | working | copied | shared | error
  const [activeTab, setActiveTab] = useState("today");
  const [hofEntries, setHofEntries] = useState([]);

  const headline = useMemo(() => {
    const idx = Math.floor(Math.random() * SHAME_HEADLINES.length);
    return SHAME_HEADLINES[idx];
  }, []);

  // Save winner to Hall of Fame when component mounts with live data
  useEffect(() => {
    if (winner && winner.daily_score > 0) {
      const updated = saveToHof(winner);
      setHofEntries(updated);
    } else {
      setHofEntries(loadHof());
    }
  }, [winner]);

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

  const shareDate = useMemo(
    () =>
      new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    []
  );

  const shareDateShort = useMemo(
    () =>
      new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    []
  );

  const handleShare = useCallback(async () => {
    setShareState("working");
    const shareText = `🚇 Subway Shame — ${shareDate}\n🏆 Worst: ${winner.id} Train (${winner.daily_score} shame pts)\n${worstCount} lines delayed, ${goodCount} running clean\nhttps://michaelpyon.github.io/subway-shame/`;

    // Try html2canvas first
    try {
      const { default: html2canvas } = await import("html2canvas");
      const el = document.getElementById("shame-share-card");
      if (!el) throw new Error("Card element not found");

      const canvas = await html2canvas(el, {
        backgroundColor: "#0a0a0f",
        scale: 2, // retina
        useCORS: true,
        logging: false,
      });

      // Convert to blob
      const blob = await new Promise((res) =>
        canvas.toBlob((b) => res(b), "image/png", 1.0)
      );
      const file = new File([blob], "subway-shame.png", { type: "image/png" });

      // Try Web Share API with file
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: "Subway Shame NYC",
          text: shareText,
          files: [file],
        });
        setShareState("shared");
        setTimeout(() => setShareState("idle"), 2500);
        return;
      }

      // Fallback: download the PNG
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "subway-shame.png";
      a.click();
      URL.revokeObjectURL(url);
      setShareState("shared");
      setTimeout(() => setShareState("idle"), 2500);
      return;
    } catch (imgErr) {
      console.warn("html2canvas failed, falling back to text share:", imgErr);
    }

    // Text-only fallback
    try {
      if (navigator.share) {
        await navigator.share({ text: shareText, title: "Subway Shame NYC" });
        setShareState("shared");
      } else {
        await navigator.clipboard.writeText(shareText);
        setShareState("copied");
      }
    } catch {
      try {
        await navigator.clipboard.writeText(shareText);
        setShareState("copied");
      } catch {
        setShareState("error");
      }
    }
    setTimeout(() => setShareState("idle"), 2500);
  }, [winner, worstCount, goodCount, shareDate]);

  const shareLabel =
    shareState === "working"
      ? "⏳ Capturing..."
      : shareState === "copied"
      ? "✓ Copied!"
      : shareState === "shared"
      ? "✓ Shared!"
      : shareState === "error"
      ? "Try again"
      : "📸 Share Today's Shame";

  const topHof = getTopHof(hofEntries);
  const hasHof = hofEntries.length > 0;

  const handleResetHof = useCallback(() => {
    localStorage.removeItem(HOF_KEY);
    setHofEntries([]);
  }, []);

  return (
    <>
      {/* Hidden share card rendered off-screen for html2canvas */}
      <ShareCard winner={winner} lines={lines} date={shareDateShort} />

      <div className="px-4 pt-8 pb-2 max-w-2xl mx-auto">
        {/* Tab bar */}
        <div className="flex gap-1 mb-3">
          <button
            onClick={() => setActiveTab("today")}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === "today"
                ? "text-white"
                : "text-gray-500 hover:text-gray-300"
            }`}
            style={
              activeTab === "today"
                ? { backgroundColor: `${color}25`, border: `1px solid ${color}50` }
                : { backgroundColor: "transparent", border: "1px solid transparent" }
            }
          >
            🏆 Today
          </button>
          <button
            onClick={() => setActiveTab("hof")}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === "hof"
                ? "text-white"
                : "text-gray-500 hover:text-gray-300"
            }`}
            style={
              activeTab === "hof"
                ? { backgroundColor: "#F59E0B25", border: "1px solid #F59E0B50" }
                : { backgroundColor: "transparent", border: "1px solid transparent" }
            }
          >
            ⭐ Hall of Fame
          </button>
        </div>

        {/* ─── TODAY TAB ─── */}
        {activeTab === "today" && (
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
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-300">
                Live
              </span>
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
                  <div className="flex flex-wrap justify-center gap-x-3 gap-y-1">
                    {sortedCats.map((cat) => {
                      const cfg = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG["Other"];
                      return (
                        <span key={cat} className="text-xs flex items-center gap-1">
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
                disabled={shareState === "working"}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 active:scale-95 disabled:opacity-60"
                style={{
                  backgroundColor:
                    shareState === "idle" || shareState === "working"
                      ? `${color}18`
                      : shareState === "error"
                      ? "#EF444418"
                      : "#16A34A18",
                  border: `1px solid ${
                    shareState === "idle" || shareState === "working"
                      ? `${color}50`
                      : shareState === "error"
                      ? "#EF444450"
                      : "#16A34A50"
                  }`,
                  color:
                    shareState === "idle" || shareState === "working"
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
        )}

        {/* ─── HALL OF FAME TAB ─── */}
        {activeTab === "hof" && (
          <div
            className="relative rounded-2xl p-6 sm:p-8 overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(17,24,39,1) 70%)",
              border: "2px solid rgba(245,158,11,0.2)",
            }}
          >
            {/* Glow */}
            <div
              className="absolute inset-0 opacity-10 blur-3xl"
              style={{
                background:
                  "radial-gradient(circle at 50% 0%, #F59E0B, transparent 60%)",
              }}
            />

            <div className="relative z-10">
              <h2 className="text-xl font-bold text-center text-white mb-1">
                ⭐ Hall of Shame
              </h2>
              <p className="text-xs text-gray-500 text-center mb-6">
                Your browser's personal record of the worst days
              </p>

              {!hasHof ? (
                <div className="text-center py-8">
                  <p className="text-4xl mb-3">📭</p>
                  <p className="text-gray-500 text-sm">
                    No history yet. Check back after a few visits!
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {topHof.map((entry, i) => {
                      const entryColor = LINE_COLORS[entry.lineId] || "#808183";
                      const entryTier = getScoreTier(entry.score);
                      const isYellow = ["N", "Q", "R", "W"].includes(entry.lineId);
                      return (
                        <div
                          key={entry.date}
                          className="flex items-center gap-4 rounded-xl px-4 py-3"
                          style={{
                            backgroundColor: `${entryColor}10`,
                            border: `1px solid ${entryColor}30`,
                          }}
                        >
                          {/* Rank */}
                          <span className="text-lg font-black text-gray-600 w-6 text-center shrink-0">
                            {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                          </span>

                          {/* Line badge (small) */}
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-base shrink-0"
                            style={{
                              backgroundColor: entryColor,
                              color: isYellow ? "#000" : "#fff",
                            }}
                          >
                            {entry.lineId}
                          </div>

                          {/* Label */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">
                              {entry.lineId} Train
                            </p>
                            <p className="text-xs text-gray-500">
                              {(() => {
                                const d = new Date(entry.date + "T12:00:00");
                                return d.toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                });
                              })()}
                            </p>
                          </div>

                          {/* Score */}
                          <div className="text-right shrink-0">
                            <span
                              className="text-xl font-black tabular-nums"
                              style={{ color: entryTier.color }}
                            >
                              {entry.score}
                            </span>
                            <p className="text-[10px] text-gray-600">pts</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {hofEntries.length > 5 && (
                    <p className="text-xs text-gray-600 text-center mt-3">
                      Showing top 5 of {hofEntries.length} recorded days
                    </p>
                  )}

                  <div className="text-center mt-5">
                    <button
                      onClick={handleResetHof}
                      className="text-xs text-gray-600 hover:text-red-500 transition-colors underline"
                    >
                      Reset history
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}
