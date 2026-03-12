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
      {/* Top MTA color bar */}
      <div className="h-1 w-full flex">
        {MTA_COLORS.map((color, i) => (
          <div key={i} className="flex-1" style={{ backgroundColor: color }} />
        ))}
      </div>

      <div className="px-4 pt-7 pb-4 text-center max-w-2xl mx-auto">
        {/* Brand */}
        <div className="flex flex-col items-center gap-2 mb-1">
          <div className="flex items-center gap-1.5" title="F*** My Life" aria-label="F M L train lines">
            {[
              { id: "F", color: "#FF6319" },
              { id: "M", color: "#FF6319" },
              { id: "L", color: "#A7A9AC" },
            ].map(({ id, color }) => (
              <div
                key={id}
                className="w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center font-black text-lg sm:text-xl shrink-0 shadow-lg"
                style={{
                  backgroundColor: color,
                  color: "#fff",
                  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                }}
              >
                {id}
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gray-700 tracking-widest uppercase font-mono -mt-1">
            14 St · 6 Av
          </p>
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
              <span className={`w-1.5 h-1.5 rounded-full ${error ? "bg-yellow-600" : refreshing ? "bg-green-500 animate-pulse" : "bg-green-600"}`} />
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

        {/* "Is My Train Fucked?" pill button */}
        {onOpenChecker && (
          <div className="mt-3">
            <button
              onClick={onOpenChecker}
              className="border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 text-xs font-medium px-4 py-1.5 rounded-full transition-colors"
            >
              🚇 Is My Train Fucked? →
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
