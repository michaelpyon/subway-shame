const MTA_COLORS = [
  "#EE352E", "#00933C", "#B933AD",
  "#0039A6", "#FF6319", "#FCCC0A",
  "#6CBE45", "#996633", "#A7A9AC", "#808183",
];

export default function Header({ lastUpdated, secondsUntilRefresh, onRefresh, loading, error }) {
  const timeAgo = lastUpdated ? formatTimeAgo(lastUpdated) : null;
  const countdown = formatCountdown(secondsUntilRefresh);

  return (
    <header>
      {/* Top MTA color bar */}
      <div className="h-1 w-full flex">
        {MTA_COLORS.map((color, i) => (
          <div key={i} className="flex-1" style={{ backgroundColor: color }} />
        ))}
      </div>

      <div className="px-4 pt-7 pb-4 text-center max-w-2xl mx-auto">
        {/* Brand */}
        <div className="flex items-center justify-center gap-2 mb-1">
          <span className="text-2xl" aria-hidden="true">🚇</span>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Subway Shame
          </h1>
        </div>
        <p className="text-gray-500 mt-1.5 text-sm sm:text-base">
          Which NYC subway line is ruining the most commutes right now?
        </p>
        <p className="text-gray-700 mt-1 text-xs">
          Higher shame score = more delays, longer delays. Resets every midnight.
        </p>

        {/* Status row */}
        <div className="flex items-center justify-center gap-3 mt-3 text-xs text-gray-600">
          {/* Live / stale indicator */}
          {timeAgo ? (
            <span className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${error ? "bg-yellow-600" : "bg-green-600 animate-pulse"}`} />
              <span>Updated {timeAgo}</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-700" />
              <span>Connecting…</span>
            </span>
          )}

          {timeAgo && (
            <>
              <span className="text-gray-800">·</span>
              <span>Next in {countdown}</span>
            </>
          )}

          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-1 rounded hover:bg-gray-800 transition-colors disabled:opacity-30"
            title="Refresh now"
            aria-label="Refresh now"
          >
            <svg
              className={`w-3.5 h-3.5 text-gray-500 ${loading ? "animate-spin" : ""}`}
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
      </div>
    </header>
  );
}

function formatTimeAgo(isoString) {
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
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
