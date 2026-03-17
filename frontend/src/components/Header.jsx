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
      {/* Top MTA color bar — thinner accent */}
      <div className="h-0.5 w-full flex">
        {MTA_COLORS.map((color, i) => (
          <div key={i} className="flex-1" style={{ backgroundColor: color }} />
        ))}
      </div>

      <div className="px-4 pt-7 pb-4 text-center max-w-2xl mx-auto">
        {/* Wordmark */}
        <h1
          className="tracking-wide"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(32px, 8vw, 48px)',
            lineHeight: 1,
            color: '#F5F0E8',
            letterSpacing: '0.04em',
          }}
        >
          THE LOW LINE
        </h1>
        <p
          className="mt-1.5"
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 400,
            color: 'rgba(245, 240, 232, 0.5)',
            fontSize: '13px',
          }}
        >
          Is My Train Fucked?
        </p>

        {/* Status row */}
        <div className="flex items-center justify-center gap-3 mt-3 text-xs" style={{ color: 'rgba(245, 240, 232, 0.35)' }}>
          {timeAgo ? (
            <span className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${error ? "bg-yellow-600" : refreshing ? "bg-green-500 animate-pulse" : "bg-green-600"}`} />
              <span>Updated {timeAgo}</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#2A2A2A' }} />
              <span>Connecting…</span>
            </span>
          )}

          {timeAgo && (
            <>
              <span style={{ color: 'rgba(245, 240, 232, 0.15)' }}>·</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>Next in {countdown}</span>
            </>
          )}

          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-1 rounded transition-colors disabled:opacity-30 press-scale"
            style={{ color: 'rgba(245, 240, 232, 0.35)' }}
            title="Refresh now"
            aria-label="Refresh now"
          >
            <svg
              className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
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

        {/* "Is My Train Fucked?" CTA — Signal Red, Bebas Neue, unmissable */}
        {onOpenChecker && (
          <div className="mt-4">
            <button
              onClick={onOpenChecker}
              className="press-scale"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '16px',
                letterSpacing: '0.05em',
                backgroundColor: '#E8353A',
                color: '#F5F0E8',
                border: '2px solid #F5F0E8',
                borderRadius: '6px',
                padding: '10px 20px',
                cursor: 'pointer',
                transitionProperty: 'scale, background-color',
                transitionDuration: '120ms',
                transitionTimingFunction: 'ease-out',
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
