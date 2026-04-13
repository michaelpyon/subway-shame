const MTA_COLORS = [
  "#EE352E", "#00933C", "#B933AD",
  "#0039A6", "#FF6319", "#FCCC0A",
  "#6CBE45", "#996633", "#A7A9AC", "#808183",
];

export default function Header({ lastUpdated, secondsUntilRefresh, onRefresh, loading, refreshing, error, onOpenChecker }) {
  const timeAgo = lastUpdated ? formatTimeAgo(lastUpdated) : null;
  const countdown = formatCountdown(secondsUntilRefresh);

  return (
    <header>
      {/* MTA color stripe — thicker accent */}
      <div className="h-1 w-full flex">
        {MTA_COLORS.map((color, i) => (
          <div key={i} className="flex-1" style={{ backgroundColor: color }} />
        ))}
      </div>

      <div className="px-4 pt-6 pb-4 max-w-2xl mx-auto">
        {/* Wordmark — Epilogue italic with red underline */}
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

        {/* Subtitle — mono, Signal Red */}
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

        {/* CTA button — tighter */}
        {onOpenChecker && (
          <div className="mt-4">
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

function formatCountdown(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
