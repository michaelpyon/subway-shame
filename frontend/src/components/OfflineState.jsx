import LineBadge from "./LineBadge";
import { getScoreTier } from "../constants/lines";

// Preview lines — scores calibrated to the current tier thresholds so colors look right
// Dumpster Fire >=5000 | Rough Day >=1500 | Running Late >=300 | Minor Issues >=1 | Good Service = 0
const PREVIEW_LINES = [
  { id: "A",  dailyScore: 5800, status: "No Service" },
  { id: "F",  dailyScore: 2100, status: "Delays" },
  { id: "7",  dailyScore: 750,  status: "Delays" },
  { id: "L",  dailyScore: 150,  status: "Slow Speeds" },
  { id: "N",  dailyScore: 0,    status: "Good Service" },
  { id: "G",  dailyScore: 0,    status: "Good Service" },
];

const MTA_LINE_COLORS = [
  "#EE352E", "#00933C", "#B933AD",
  "#0039A6", "#FF6319", "#FCCC0A",
  "#6CBE45", "#996633", "#A7A9AC", "#808183",
];

// Static bar widths for the preview breakdown bar (just visual chrome)
const PREVIEW_BAR_COLORS = ["#E8353A", "#F97316", "#EAB308"];
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
    <div className="min-h-screen antialiased" style={{ backgroundColor: '#0A0A0A', color: '#F5F0E8' }}>
      {/* Top MTA color bar */}
      <div className="h-0.5 w-full flex">
        {MTA_LINE_COLORS.map((color, i) => (
          <div key={i} className="flex-1" style={{ backgroundColor: color }} />
        ))}
      </div>

      {/* Header */}
      <div className="px-4 pt-7 pb-4 text-center max-w-2xl mx-auto">
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
      </div>

      {/* Status note */}
      <div className="max-w-md mx-auto px-4 mt-2">
        <div className="text-center py-3">
          <div className="flex items-center justify-center gap-1.5 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
            <span className="text-xs" style={{ color: 'rgba(245, 240, 232, 0.3)' }}>Live data loads once the backend wakes up. Preview below shows what it looks like.</span>
          </div>
          <button
            onClick={onRetry}
            disabled={loading}
            className="px-3 py-1 text-xs rounded-full transition-all disabled:opacity-40 disabled:cursor-not-allowed press-scale"
            style={{ color: 'rgba(245, 240, 232, 0.3)', border: '1px solid rgba(245, 240, 232, 0.1)' }}
          >
            {loading ? (
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-2.5 h-2.5 rounded-full animate-spin" style={{ border: '1px solid rgba(245, 240, 232, 0.3)', borderTopColor: 'rgba(245, 240, 232, 0.6)' }} />
                Checking...
              </span>
            ) : (
              "Try again"
            )}
          </button>
        </div>
      </div>

      {/* Is My Train Fucked — preview */}
      <div className="max-w-2xl mx-auto px-4 py-5">
        <div className="rounded-2xl p-5 relative overflow-hidden" style={{ backgroundColor: '#1A1A1A', boxShadow: 'var(--shadow-card)' }}>
          {/* Overlay */}
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl z-10 backdrop-blur-[1px]" style={{ backgroundColor: 'rgba(10, 10, 10, 0.7)' }}>
            <div className="rounded-lg px-4 py-2.5" style={{ backgroundColor: '#1A1A1A', boxShadow: 'var(--shadow-card)' }}>
              <span className="text-sm font-medium" style={{ color: 'rgba(245, 240, 232, 0.5)' }}>Available when live data connects</span>
            </div>
          </div>

          <h2
            className="text-center mb-1"
            style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: '#F5F0E8', letterSpacing: '0.04em' }}
          >
            IS MY TRAIN FUCKED?
          </h2>
          <p className="text-xs text-center mb-4" style={{ color: 'rgba(245, 240, 232, 0.25)' }}>
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

      {/* Live Rankings Preview */}
      <div className="max-w-2xl mx-auto px-4 pb-8">
        <div className="flex items-center gap-3 mb-4">
          <h2
            style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'rgba(245, 240, 232, 0.5)', letterSpacing: '0.04em' }}
          >
            LIVE RANKINGS
          </h2>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ color: 'rgba(245, 240, 232, 0.25)', border: '1px solid rgba(245, 240, 232, 0.1)' }}>
            Preview
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PREVIEW_LINES.map(({ id, dailyScore, status }, idx) => {
            const scoreTier = getScoreTier(dailyScore);
            const barWidths = PREVIEW_BAR_WIDTHS[idx];
            const hasScore = dailyScore > 0;

            return (
              <div
                key={id}
                className="rounded-lg overflow-hidden"
                style={{ backgroundColor: '#1A1A1A', boxShadow: 'var(--shadow-card)' }}
              >
                <div className="p-4">
                  {/* Top row: badge + name + score */}
                  <div className="flex items-center gap-3">
                    <LineBadge lineId={id} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm" style={{ color: '#F5F0E8' }}>
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
                          <span className="text-base">{scoreTier.emoji}</span>
                          <div className="text-right">
                            <div className="flex items-baseline gap-0.5 justify-end">
                              <span
                                className="text-xl font-bold tabular-nums leading-none"
                                style={{ color: scoreTier.color }}
                              >
                                {dailyScore.toLocaleString()}
                              </span>
                              <span className="text-[9px]" style={{ color: `${scoreTier.color}80` }}>pts</span>
                            </div>
                            <span className="text-[9px] uppercase font-semibold tracking-wide" style={{ color: `${scoreTier.color}90` }}>
                              {scoreTier.label}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="text-right">
                          <span className="text-lg" style={{ color: '#22C55E' }}>&#10003;</span>
                          <span className="text-[9px] font-semibold uppercase tracking-wide block" style={{ color: '#166534' }}>On time</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Breakdown bar skeleton */}
                  {hasScore && barWidths && (
                    <div className="mt-3">
                      <div className="h-2 rounded-full overflow-hidden flex" style={{ backgroundColor: '#2A2A2A' }}>
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

        <p className="text-center text-xs mt-4" style={{ color: 'rgba(245, 240, 232, 0.15)' }}>
          Sample data — live scores will load once the backend connects
        </p>
      </div>

      {/* Footer */}
      <footer className="text-center text-xs py-6 px-4" style={{ color: 'rgba(245, 240, 232, 0.15)', borderTop: '1px solid rgba(245, 240, 232, 0.06)' }}>
        <p>
          Data from{" "}
          <a
            href="https://api.mta.info/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
            style={{ color: 'rgba(245, 240, 232, 0.25)' }}
          >
            MTA GTFS-RT feeds
          </a>
        </p>
        <p className="mt-1">For entertainment purposes. The MTA has enough problems.</p>
      </footer>
    </div>
  );
}
