import { useCallback, useState } from "react";
import { LINE_COLORS } from "../constants/lines";
import { buildShareText } from "../utils/shareText";

const MTA_COLORS = [
  "#EE352E", "#00933C", "#B933AD",
  "#0039A6", "#FF6319", "#FCCC0A",
  "#6CBE45", "#996633", "#A7A9AC", "#808183",
];

export default function Header({ lastUpdated, secondsUntilRefresh, onRefresh, loading, refreshing, error, winner, onOpenChecker }) {
  const timeAgo = lastUpdated ? formatTimeAgo(lastUpdated) : null;
  const countdown = formatCountdown(secondsUntilRefresh);
  const clock = lastUpdated ? formatClock(lastUpdated) : null;
  const stale = Boolean(error && lastUpdated);

  // One tap copy of today's worst line, above the fold. Uses the same share text
  // as the Trophy card so the angry commuter can grab the receipt without scrolling.
  const hasWinner = Boolean(winner && winner.id && (winner.daily_score || 0) > 0);
  const [copyState, setCopyState] = useState("idle");

  const handleCopy = useCallback(async () => {
    const text = buildShareText(winner);
    try {
      if (navigator.share) {
        await navigator.share({ title: "The Low Line", text });
        setCopyState("shared");
      } else {
        await navigator.clipboard.writeText(text);
        setCopyState("copied");
      }
    } catch {
      try {
        await navigator.clipboard.writeText(text);
        setCopyState("copied");
      } catch {
        setCopyState("error");
      }
    }
    setTimeout(() => setCopyState("idle"), 2200);
  }, [winner]);

  const winnerColor = hasWinner ? (LINE_COLORS[winner.id] || "#808183") : "#808183";
  const copyLabel =
    copyState === "copied"
      ? "Copied"
      : copyState === "shared"
      ? "Shared"
      : copyState === "error"
      ? "Try again"
      : "Copy the receipt";

  return (
    <header>
      {/* MTA color stripe - thicker accent */}
      <div className="h-1 w-full flex">
        {MTA_COLORS.map((color, i) => (
          <div key={i} className="flex-1" style={{ backgroundColor: color }} />
        ))}
      </div>

      <div className="px-4 pt-6 pb-4 max-w-2xl mx-auto">
        {/* Wordmark - Epilogue italic with red underline */}
        <h1
          className="inline-block"
          style={{
            fontFamily: 'var(--font-headline)',
            fontWeight: 900,
            fontStyle: 'italic',
            fontSize: 'clamp(32px, 9vw, 44px)',
            lineHeight: 1,
            color: 'var(--color-cream)',
            letterSpacing: '-0.03em',
            textTransform: 'uppercase',
            borderBottom: '4px solid var(--color-signal-red)',
            paddingBottom: '4px',
          }}
        >
          THE LOW LINE
        </h1>

        {/* Subtitle - mono, Signal Red */}
        <div className="flex items-center gap-2 mt-2">
          <p
            style={{
              fontFamily: 'var(--font-label)',
              fontWeight: 700,
              color: 'var(--color-signal-red)',
              fontSize: '10px',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            Is My Train Fucked?
          </p>
          <div className="w-2 h-2 rounded-full motion-reduce:animate-none" style={{ backgroundColor: 'var(--color-signal-red)', animation: 'verdict-pulse-green 2s ease-out infinite' }} />
        </div>

        {/* Freshness stamp - always visible, absolute clock time */}
        <div
          className="inline-flex items-center gap-2 mt-3 px-2.5 py-1"
          aria-live="polite"
          style={{
            backgroundColor: stale ? 'rgba(233, 196, 0, 0.12)' : 'rgba(245, 240, 232, 0.06)',
            border: `1px solid ${stale ? 'rgba(233, 196, 0, 0.3)' : 'var(--color-outline-variant)'}`,
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ backgroundColor: stale ? 'var(--color-gold-dim)' : '#22C55E' }}
          />
          <span
            className="text-[11px] uppercase tracking-wide"
            style={{
              fontFamily: 'var(--font-mono)',
              fontVariantNumeric: 'tabular-nums',
              color: stale ? 'var(--color-gold-dim)' : 'var(--color-on-surface-variant)',
              fontWeight: 700,
            }}
          >
            {clock
              ? stale
                ? `Last updated ${clock} · may be stale`
                : `Data as of ${clock}`
              : 'Connecting to live feed...'}
          </span>
        </div>

        {/* Status row */}
        <div className="flex flex-wrap items-center gap-3 mt-3 text-xs font-label" aria-live="polite" style={{ color: 'var(--color-outline)' }}>
          {timeAgo ? (
            <span className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${error ? "" : refreshing ? "animate-pulse motion-reduce:animate-none" : ""}`} style={{ backgroundColor: error ? 'var(--color-gold-dim)' : '#22C55E' }} />
              <span>Updated {timeAgo}</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--color-concrete)' }} />
              <span>Connecting…</span>
            </span>
          )}

          {timeAgo && (
            <>
              <span style={{ color: 'var(--color-outline-variant)' }}>·</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>Next in {countdown}</span>
            </>
          )}

          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="p-1 transition-colors disabled:opacity-30 press-scale"
            style={{ color: 'var(--color-outline)' }}
            title="Refresh now"
            aria-label="Refresh now"
          >
            <svg
              className={`w-3.5 h-3.5 ${loading ? "animate-spin motion-reduce:animate-none" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>

        {/* CTA row - tighter */}
        {(onOpenChecker || hasWinner) && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {onOpenChecker && (
              <button
                type="button"
                onClick={onOpenChecker}
                className="press-scale"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '15px',
                  letterSpacing: '0.05em',
                  backgroundColor: 'var(--color-signal-red)',
                  color: 'var(--color-cream)',
                  border: '2px solid var(--color-cream)',
                  borderRadius: '0px',
                  padding: '8px 18px',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                IS MY TRAIN FUCKED?
              </button>
            )}

            {/* One tap copy the worst line, above the fold for the screenshot moment */}
            {hasWinner && (
              <button
                type="button"
                onClick={handleCopy}
                aria-label={`Copy the receipt: ${winner.id} train, ${winner.daily_score} shame points`}
                className="press-scale inline-flex items-center gap-2"
                style={{
                  fontFamily: 'var(--font-label)',
                  fontWeight: 700,
                  fontSize: '12px',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  color: copyState === "error" ? '#EF4444' : (copyState === "copied" || copyState === "shared") ? '#16A34A' : 'var(--color-on-surface-variant)',
                  backgroundColor: 'transparent',
                  border: `2px solid ${copyState === "error" ? 'rgba(239, 68, 68, 0.5)' : (copyState === "copied" || copyState === "shared") ? 'rgba(22, 163, 74, 0.5)' : 'var(--color-outline-variant)'}`,
                  borderRadius: '0px',
                  padding: '6px 12px',
                  cursor: 'pointer',
                }}
              >
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0"
                  style={{
                    backgroundColor: winnerColor,
                    color: ["N", "Q", "R", "W"].includes(winner.id) ? "#000" : "#fff",
                    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                  }}
                >
                  {winner.id}
                </span>
                {copyLabel}
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

function formatTimeAgo(date) {
  const ms = date instanceof Date ? date.getTime() : new Date(date).getTime();
  const diff = Math.floor((Date.now() - ms) / 1000);
  if (diff < 60) return "just now";
  if (diff < 120) return "1 min ago";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function formatClock(date) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function formatCountdown(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
