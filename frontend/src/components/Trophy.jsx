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
const HOF_MAX = 50;

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
    const today = new Date().toISOString().slice(0, 10);
    const existing = loadHof();
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
  const d = new Date(dateStr + "T12:00:00");
  const month = d.toLocaleDateString("en-US", { month: "short" });
  const day = d.getDate();
  return `${month} ${day}, ${lineId} Train, ${score} pts`;
}

function getTopHof(entries, n = 5) {
  return [...entries].sort((a, b) => b.score - a.score).slice(0, n);
}

export default function Trophy({ winner, lines = [] }) {
  const color = LINE_COLORS[winner.id] || "#808183";
  const tier = getScoreTier(winner.daily_score);
  const [shareState, setShareState] = useState("idle");
  const [activeTab, setActiveTab] = useState("today");
  const [hofEntries, setHofEntries] = useState([]);
  const [expanded, setExpanded] = useState(false);

  const headline = useMemo(() => {
    const idx = Math.floor(Math.random() * SHAME_HEADLINES.length);
    return SHAME_HEADLINES[idx];
  }, []);

  useEffect(() => {
    if (winner && winner.daily_score > 0) {
      const updated = saveToHof(winner);
      setHofEntries(updated);
    } else {
      setHofEntries(loadHof());
    }
  }, [winner]);

  const alertsToShow =
    winner.alerts && winner.alerts.length > 0
      ? winner.alerts
      : winner.peak_alerts || [];

  const breakdown = winner.breakdown || {};
  const sortedCats = CATEGORY_ORDER.filter((cat) => breakdown[cat] > 0);

  const dirs = LINE_DIRECTIONS[winner.id] || ["Uptown", "Downtown"];
  const byDir = winner.by_direction || {};

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
    const shareText = `🚇 The Low Line, ${shareDate}\n🏆 Worst: ${winner.id} Train (${winner.daily_score} shame pts)\n${worstCount} lines delayed, ${goodCount} running clean\nhttps://subway.michaelpyon.com`;

    try {
      const { default: html2canvas } = await import("html2canvas");
      const el = document.getElementById("shame-share-card");
      if (!el) throw new Error("Card element not found");

      const canvas = await html2canvas(el, {
        backgroundColor: "#0a0a0a",
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const blob = await new Promise((res) =>
        canvas.toBlob((b) => res(b), "image/png", 1.0)
      );
      const file = new File([blob], "the-low-line.png", { type: "image/png" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: "The Low Line",
          text: shareText,
          files: [file],
        });
        setShareState("shared");
        setTimeout(() => setShareState("idle"), 2500);
        return;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "the-low-line.png";
      a.click();
      URL.revokeObjectURL(url);
      setShareState("shared");
      setTimeout(() => setShareState("idle"), 2500);
      return;
    } catch (imgErr) {
      console.warn("html2canvas failed, falling back to text share:", imgErr);
    }

    try {
      if (navigator.share) {
        await navigator.share({ text: shareText, title: "The Low Line" });
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
      ? "Capturing..."
      : shareState === "copied"
      ? "✓ Copied!"
      : shareState === "shared"
      ? "✓ Shared!"
      : shareState === "error"
      ? "Try again"
      : "Share";

  const topHof = getTopHof(hofEntries);
  const hasHof = hofEntries.length > 0;

  const handleResetHof = useCallback(() => {
    localStorage.removeItem(HOF_KEY);
    setHofEntries([]);
  }, []);

  return (
    <>
      <ShareCard winner={winner} lines={lines} date={shareDateShort} />

      <div className="px-4 pt-6 pb-2 max-w-2xl mx-auto">
        {/* Tab bar — Bebas Neue labels */}
        <div className="flex gap-1 mb-3">
          <button
            type="button"
            onClick={() => setActiveTab("today")}
            className={`flex-1 py-2 text-sm transition-colors duration-200 press-scale ${
              activeTab === "today"
                ? ""
                : ""
            }`}
            style={{
              fontFamily: 'var(--font-headline)',
              fontStyle: 'italic',
              letterSpacing: '-0.02em',
              fontSize: '14px',
              backgroundColor: activeTab === "today" ? 'rgba(232, 53, 58, 0.15)' : 'transparent',
              color: activeTab === "today" ? 'var(--color-signal-red)' : 'var(--color-outline)',
              border: activeTab === "today" ? '1px solid rgba(232, 53, 58, 0.3)' : '1px solid transparent',
            }}
          >
            TODAY
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("hof")}
            className={`flex-1 py-2 text-sm transition-colors duration-200 press-scale`}
            style={{
              fontFamily: 'var(--font-headline)',
              fontStyle: 'italic',
              letterSpacing: '-0.02em',
              fontSize: '14px',
              backgroundColor: activeTab === "hof" ? 'rgba(255, 215, 0, 0.12)' : 'transparent',
              color: activeTab === "hof" ? 'var(--color-gold)' : 'var(--color-outline)',
              border: activeTab === "hof" ? '1px solid rgba(255, 215, 0, 0.25)' : '1px solid transparent',
            }}
          >
            HALL OF SHAME
          </button>
        </div>

        {/* ─── TODAY TAB ─── */}
        {activeTab === "today" && (
          <div
            className="trophy-card relative overflow-hidden structural-card"
            style={{
              backgroundColor: 'var(--color-ballast)',
              boxShadow: 'var(--shadow-card-shame)',
              borderColor: 'var(--color-signal-red)',
            }}
          >
            {/* Glow effect */}
            <div
              className="absolute inset-0 opacity-20 blur-3xl pointer-events-none"
              style={{
                background: `radial-gradient(circle at 50% 0%, ${color}, transparent 60%)`,
              }}
            />

            {/* ── COMPACT ROW ── */}
            <div className="relative z-10 p-4 flex items-start gap-3">
              <div className="shrink-0 mt-0.5">
                <LineBadge lineId={winner.id} size="md" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm" style={{ color: 'var(--color-cream)' }}>{winner.id} Train</span>
                  <span
                    className="text-sm font-bold tabular-nums"
                    style={{ color: tier.color }}
                  >
                    {winner.daily_score.toLocaleString()} pts
                  </span>
                  <span className="text-sm">{tier.emoji}</span>
                  {/* Severity label as styled pill */}
                  <span className={`severity-label ${tier.severityClass}`}>
                    {tier.label.toUpperCase()}
                  </span>
                  <div className="flex items-center gap-1.5 ml-auto shrink-0">
                    <button
                      type="button"
                      onClick={handleShare}
                      disabled={shareState === "working"}
                      className="text-xs font-medium px-3 py-1 rounded-full transition-colors duration-200 press-scale disabled:opacity-60"
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
                    <button
                      type="button"
                      onClick={() => setExpanded((v) => !v)}
                      className="text-xs transition-colors px-2 py-1 rounded-lg press-scale"
                      aria-controls="trophy-details-panel"
                      aria-expanded={expanded}
                      style={{ color: 'var(--color-outline)' }}
                    >
                      {expanded ? "↑ Hide" : "↓ Details"}
                    </button>
                  </div>
                </div>

                {/* Live meta */}
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="flex items-center gap-1">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping motion-reduce:animate-none absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-outline)' }}>LIVE</span>
                  </span>
                  <span className="text-[10px]" style={{ color: 'var(--color-outline-variant)' }}>·</span>
                  <span className="text-[10px]" style={{ color: 'var(--color-outline)' }}>accumulated today</span>
                  <span className="text-[10px]" style={{ color: 'var(--color-outline-variant)' }}>·</span>
                  <span className="text-[10px]" style={{ color: 'var(--color-outline)' }}>resets at midnight</span>
                  {winner.score > 0 && (
                    <>
                      <span className="text-[10px]" style={{ color: 'var(--color-outline-variant)' }}>·</span>
                      <span className="text-[10px]" style={{ color: 'var(--color-outline)' }}>+{winner.score} pts/hr right now</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* ── EXPANDED DETAILS ── */}
            {expanded && (
              <div
                id="trophy-details-panel"
                className="relative z-10 px-5 pb-5 pt-1"
                style={{ borderTop: '1px solid var(--color-outline-variant)' }}
              >
                <p className="text-xs uppercase tracking-widest mb-4 text-center" style={{ color: 'var(--color-outline)' }}>
                  {headline}
                </p>

                {/* Status pill */}
                <div className="flex justify-center mb-4">
                  <div
                    className="inline-block px-4 py-1.5 rounded-full text-sm font-semibold"
                    style={{
                      backgroundColor: `${tier.color}20`,
                      color: tier.color,
                    }}
                  >
                    {tier.emoji} {winner.status}
                  </div>
                </div>

                {/* Breakdown bar */}
                {sortedCats.length > 0 && winner.daily_score > 0 && (
                  <div className="max-w-md mx-auto mb-5">
                    <div className="h-4 rounded-full overflow-hidden flex mb-2" style={{ backgroundColor: 'var(--color-concrete)' }}>
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
                            <span style={{ color: 'var(--color-outline)' }}>{cfg.label}</span>
                            <span style={{ color: 'var(--color-outline-variant)' }}>{breakdown[cat].toLocaleString()} pts</span>
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
                          className="rounded-lg p-3 text-center"
                          style={{ backgroundColor: 'var(--color-surface)' }}
                        >
                          <span className="text-xs block mb-1" style={{ color: 'var(--color-outline)' }}>
                            {i === 0 ? "↑" : "↓"} {dirs[i]}
                          </span>
                          <span
                            className="text-2xl font-bold tabular-nums"
                            style={{ color: dd.score > 0 ? 'var(--color-cream)' : 'var(--color-outline-variant)' }}
                          >
                            {dd.score}
                          </span>
                          <span className="text-[10px] block" style={{ color: 'var(--color-outline-variant)' }}>pts</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Alerts */}
                {alertsToShow.length > 0 && (
                  <div className="space-y-2 text-left max-w-lg mx-auto mb-4">
                    {alertsToShow.map((alert, i) => {
                      const a = typeof alert === "string" ? { text: alert } : alert;
                      const cfg = a.category
                        ? CATEGORY_CONFIG[a.category] || CATEGORY_CONFIG["Other"]
                        : null;
                      return (
                        <div
                          key={i}
                          className="rounded-lg p-3 text-sm leading-relaxed"
                          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-outline-variant)', color: 'var(--color-on-surface-variant)' }}
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

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setExpanded(false)}
                    className="text-xs transition-colors press-scale"
                    style={{ color: 'var(--color-outline)' }}
                  >
                    ↑ Hide details
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── HALL OF FAME TAB ─── */}
        {activeTab === "hof" && (
          <div
            className="relative p-6 sm:p-8 overflow-hidden structural-card"
            style={{
              backgroundColor: 'var(--color-ballast)',
              boxShadow: 'var(--shadow-card)',
              borderColor: 'var(--color-outline-variant)',
            }}
          >
            {/* Glow */}
            <div
              className="absolute inset-0 opacity-10 blur-3xl"
              style={{
                background: "radial-gradient(circle at 50% 0%, var(--color-gold), transparent 60%)",
              }}
            />

            <div className="relative z-10">
              <h2
                className="text-xl font-bold text-center mb-1"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--color-cream)', letterSpacing: '0.04em', fontSize: '24px' }}
              >
                HALL OF SHAME
              </h2>
              <p className="text-xs text-center mb-1" style={{ color: 'var(--color-outline)' }}>
                Worst daily offender since you started visiting
              </p>
              <div className="flex items-center justify-center gap-1.5 mb-5">
                <svg className="w-3 h-3" style={{ color: 'var(--color-outline-variant)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="text-[10px]" style={{ color: 'var(--color-outline-variant)' }}>Saved in your browser only. Private to you, not a global record</span>
              </div>

              {!hasHof ? (
                <div className="text-center py-6">
                  <p className="text-4xl mb-3">📅</p>
                  <p className="text-sm font-medium mb-2" style={{ color: 'var(--color-outline)' }}>
                    Nothing recorded yet
                  </p>
                  <p className="text-xs max-w-xs mx-auto leading-relaxed" style={{ color: 'var(--color-outline-variant)' }}>
                    Each day you visit, the worst line that day gets saved here automatically.
                    Come back tomorrow to start building your record.
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
                          className="flex items-center gap-4 px-4 py-3"
                          style={{
                            backgroundColor: `${entryColor}10`,
                            boxShadow: 'var(--shadow-card)',
                          }}
                        >
                          <span className="text-lg font-black w-6 text-center shrink-0" style={{ color: 'var(--color-outline-variant)' }}>
                            {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                          </span>
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-base shrink-0"
                            style={{
                              backgroundColor: entryColor,
                              color: isYellow ? "#000" : "#fff",
                            }}
                          >
                            {entry.lineId}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-cream)' }}>
                              {entry.lineId} Train
                            </p>
                            <p className="text-xs" style={{ color: 'var(--color-outline)' }}>
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
                          <div className="text-right shrink-0">
                            <div className="flex items-baseline gap-0.5 justify-end">
                              <span
                                className="text-xl font-black tabular-nums"
                                style={{ color: entryTier.color }}
                              >
                                {entry.score.toLocaleString()}
                              </span>
                              <span className="text-[9px]" style={{ color: 'var(--color-outline-variant)' }}>pts</span>
                            </div>
                            <span className={`severity-label ${entryTier.severityClass}`}>
                              {entryTier.label.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {hofEntries.length > 5 && (
                    <p className="text-xs text-center mt-3" style={{ color: 'var(--color-outline-variant)' }}>
                      Showing top 5 of {hofEntries.length} recorded days
                    </p>
                  )}

                  <div className="text-center mt-5">
                    <button
                      type="button"
                      onClick={handleResetHof}
                      className="text-xs underline transition-colors press-scale"
                      style={{ color: 'var(--color-outline-variant)' }}
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
