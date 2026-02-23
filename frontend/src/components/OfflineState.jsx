import LineBadge from "./LineBadge";

// Preview lines to show in the "coming soon" demo
const PREVIEW_LINES = [
  { id: "A", score: 87, tier: "🔥", label: "Dumpster Fire", color: "#EF4444" },
  { id: "F", score: 62, tier: "🔥", label: "Dumpster Fire", color: "#EF4444" },
  { id: "7", score: 44, tier: "😤", label: "Delayed",       color: "#F97316" },
  { id: "L", score: 31, tier: "😤", label: "Delayed",       color: "#F97316" },
  { id: "N", score: 18, tier: "😒", label: "Minor Issues",  color: "#EAB308" },
  { id: "G", score: 12, tier: "😒", label: "Minor Issues",  color: "#EAB308" },
];

const MTA_LINE_COLORS = [
  "#EE352E", "#00933C", "#B933AD",
  "#0039A6", "#FF6319", "#FCCC0A",
  "#6CBE45", "#996633", "#A7A9AC", "#808183",
];

export default function OfflineState({ onRetry, loading }) {
  return (
    <div className="min-h-screen bg-gray-950 text-white antialiased">
      {/* Top color bar */}
      <div className="h-1 w-full flex">
        {MTA_LINE_COLORS.map((color, i) => (
          <div key={i} className="flex-1" style={{ backgroundColor: color }} />
        ))}
      </div>

      {/* Header */}
      <div className="px-4 pt-8 pb-4 text-center max-w-2xl mx-auto">
        <div className="text-4xl mb-2">🚇</div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Subway Shame
        </h1>
        <p className="text-gray-500 mt-2 text-sm sm:text-base">
          Which NYC subway line is ruining the most commutes right now?
        </p>

        {/* Line color dots */}
        <div className="flex justify-center gap-1.5 mt-4">
          {MTA_LINE_COLORS.map((color, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full opacity-60"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      {/* Status card */}
      <div className="max-w-md mx-auto px-4 mt-4">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center">
          {/* Animated status dot */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="relative">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="absolute inset-0 w-3 h-3 rounded-full bg-yellow-500 animate-ping opacity-60" />
            </div>
            <span className="text-yellow-500 text-sm font-semibold">
              Connecting to live data…
            </span>
          </div>

          <p className="text-gray-400 text-sm leading-relaxed mb-5">
            The MTA data backend is spinning up. Live delay scores will appear
            once the feed is connected. The trains themselves are probably also
            delayed — so you'll fit right in.
          </p>

          <button
            onClick={onRetry}
            disabled={loading}
            className="px-6 py-2.5 bg-white text-black font-bold rounded-full text-sm hover:bg-gray-100 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="inline-block w-3.5 h-3.5 border-2 border-gray-400 border-t-gray-800 rounded-full animate-spin" />
                Checking…
              </span>
            ) : (
              "Try again"
            )}
          </button>
        </div>
      </div>

      {/* Is My Train Fucked — works without live data as preview */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800 opacity-60 pointer-events-none select-none relative overflow-hidden">
          {/* Overlay */}
          <div className="absolute inset-0 bg-gray-950/60 flex items-center justify-center rounded-2xl z-10">
            <div className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2">
              <span className="text-gray-400 text-sm">Available when live data connects</span>
            </div>
          </div>
          <h2 className="text-xl font-black text-center mb-1 text-white">
            Is My Train Fucked?
          </h2>
          <p className="text-xs text-gray-600 text-center mb-4">
            The only question that matters.
          </p>
          {/* Fake line badges */}
          <div className="flex flex-wrap gap-1.5 justify-center">
            {["1","2","3","A","C","E","N","Q","R","L","7","G","J","Z","B","D","F","M","4","5","6"].map(id => (
              <LineBadge key={id} lineId={id} size="sm" />
            ))}
          </div>
        </div>
      </div>

      {/* Preview cards */}
      <div className="max-w-5xl mx-auto px-4 pb-8">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-lg font-semibold text-gray-600">Live Rankings</h2>
          <span className="text-xs text-gray-700 px-2 py-0.5 rounded-full border border-gray-800">
            Preview
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PREVIEW_LINES.map(({ id, score, tier, label, color }) => (
            <div
              key={id}
              className="bg-gray-900/50 rounded-lg overflow-hidden relative"
              style={{ borderLeft: `4px solid ${color}40` }}
            >
              {/* Skeleton shimmer overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-800/20 to-transparent animate-[shimmer_2s_ease-in-out_infinite] bg-[length:200%_100%]" />
              <div className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-800 opacity-40" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-gray-800 rounded w-20 opacity-40" />
                  <div className="h-2.5 bg-gray-800 rounded w-14 opacity-30" />
                </div>
                <div className="h-6 bg-gray-800 rounded w-8 opacity-40" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-gray-700 py-6 px-4">
        <p>
          Data from{" "}
          <a
            href="https://api.mta.info/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-gray-600"
          >
            MTA GTFS-RT feeds
          </a>
        </p>
        <p className="mt-1">For entertainment purposes. The MTA has enough problems.</p>
      </footer>
    </div>
  );
}
