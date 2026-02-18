export default function Header({ lastUpdated, secondsUntilRefresh, onRefresh, loading }) {
  const timeAgo = lastUpdated ? formatTimeAgo(lastUpdated) : null;
  const countdown = formatCountdown(secondsUntilRefresh);

  return (
    <header className="px-4 pt-8 pb-4 text-center max-w-2xl mx-auto">
      <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
        Subway Shame
      </h1>
      <p className="text-gray-500 mt-2 text-sm sm:text-base">
        Which NYC subway line is ruining the most commutes right now?
      </p>
      <div className="flex items-center justify-center gap-3 mt-3 text-xs text-gray-600">
        {timeAgo && <span>Updated {timeAgo}</span>}
        <span>·</span>
        <span>Next update in {countdown}</span>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="ml-1 p-1 rounded hover:bg-gray-800 transition-colors disabled:opacity-30"
          title="Refresh now"
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
