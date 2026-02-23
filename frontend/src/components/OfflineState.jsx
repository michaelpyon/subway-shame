import LineBadge from "./LineBadge";
import { getScoreTier } from "../constants/lines";

// Preview lines to show in the "coming soon" demo — realistic data
const PREVIEW_LINES = [
  { id: "A",  dailyScore: 87, status: "Suspended",    tier: "🔥" },
  { id: "F",  dailyScore: 62, status: "Major Delays", tier: "🔥" },
  { id: "7",  dailyScore: 44, status: "Delays",       tier: "😤" },
  { id: "L",  dailyScore: 31, status: "Delays",       tier: "😤" },
  { id: "N",  dailyScore: 18, status: "Minor Issues", tier: "😒" },
  { id: "G",  dailyScore: 0,  status: "Good Service", tier: null },
];

const MTA_LINE_COLORS = [
  "#EE352E", "#00933C", "#B933AD",
  "#0039A6", "#FF6319", "#FCCC0A",
  "#6CBE45", "#996633", "#A7A9AC", "#808183",
];

// Static bar widths for the preview breakdown bar (just visual chrome)
const PREVIEW_BAR_COLORS = ["#EF4444", "#F97316", "#EAB308"];
const PREVIEW_BAR_WIDTHS = [
  [55, 30, 15],
  [45, 40, 15],
  [40, 45, 15],
  [50, 35, 15],
  [60, 40, 0],
  null,
];

export default function OfflineState({ onRetry, loading }) {
  return (
    <div className="min-h-screen bg-gray-950 text-white antialiased">
      {/* Top MTA color bar */}
      <div className="h-1 w-full flex">
        {MTA_LINE_COLORS.map((color, i) => (
          <div key={i} className="flex-1" style={{ backgroundColor: color }} />
        ))}
      </div>

      {/* Header */}
      <div className="px-4 pt-7 pb-4 text-center max-w-2xl mx-auto">
        <div className="flex items-center justify-center gap-2 mb-1">
          <span className="text-2xl" aria-hidden="true">🚇</span>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Subway Shame
          </h1>
        </div>
        <p className="text-gray-500 mt-1.5 text-sm sm:text-base">
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
      <div className="max-w-md mx-auto px-4 mt-2">
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

      {/* Is My Train Fucked — preview */}
      <div className="max-w-2xl mx-auto px-4 py-5">
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800 relative overflow-hidden">
          {/* Overlay */}
          <div className="absolute inset-0 bg-gray-950/70 flex items-center justify-center rounded-2xl z-10 backdrop-blur-[1px]">
            <div className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 shadow-lg">
              <span className="text-gray-300 text-sm font-medium">Available when live data connects</span>
            </div>
          </div>

          <h2 className="text-xl font-black text-center mb-1 text-white">
            Is My Train Fucked?
          </h2>
          <p className="text-xs text-gray-600 text-center mb-4">
            The only question that matters.
          </p>
          {/* All line badges */}
          <div className="flex flex-wrap gap-1.5 justify-center">
            {["1","2","3","A","C","E","N","Q","R","L","7","G","J","Z","B","D","F","M","4","5","6"].map(id => (
              <LineBadge key={id} lineId={id} size="sm" />
            ))}
          </div>
        </div>
      </div>

      {/* Live Rankings Preview — with real MTA colors + skeletons */}
      <div className="max-w-5xl mx-auto px-4 pb-8">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-lg font-semibold text-gray-400">Live Rankings</h2>
          <span className="text-xs text-gray-600 px-2 py-0.5 rounded-full border border-gray-800">
            Preview
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PREVIEW_LINES.map(({ id, dailyScore, status, tier }, idx) => {
            const scoreTier = getScoreTier(dailyScore);
            const barWidths = PREVIEW_BAR_WIDTHS[idx];
            const hasScore = dailyScore > 0;

            return (
              <div
                key={id}
                className="bg-gray-900 rounded-lg overflow-hidden"
                style={{ borderLeft: `4px solid ${scoreTier.color}` }}
              >
                <div className="p-4">
                  {/* Top row: badge + name + score */}
                  <div className="flex items-center gap-3">
                    <LineBadge lineId={id} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white text-sm">
                        {id} Train
                      </div>
                      <div
                        className="text-xs mt-0.5"
                        style={{ color: scoreTier.color }}
                      >
                        {status}
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-1.5">
                      {hasScore ? (
                        <>
                          <span className="text-base">{tier}</span>
                          <span
                            className="text-xl font-bold tabular-nums"
                            style={{ color: scoreTier.color }}
                          >
                            {dailyScore}
                          </span>
                        </>
                      ) : (
                        <span className="text-green-500 text-lg">✓</span>
                      )}
                    </div>
                  </div>

                  {/* Breakdown bar skeleton */}
                  {hasScore && barWidths && (
                    <div className="mt-3">
                      <div className="h-2 rounded-full overflow-hidden flex bg-gray-800">
                        {barWidths.map((w, i) => w > 0 && (
                          <div
                            key={i}
                            className="h-full"
                            style={{
                              width: `${w}%`,
                              backgroundColor: PREVIEW_BAR_COLORS[i],
                              opacity: 0.7,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-gray-700 mt-4">
          Sample data — live scores will load once the backend connects
        </p>
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-gray-700 py-6 px-4 border-t border-gray-900">
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
