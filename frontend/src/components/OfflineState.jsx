import LineBadge from "./LineBadge";

// The honest down screen. When the live MTA feed is unreachable there are no
// real scores, so we show none. We would rather show nothing than make a number
// up: 1 fabricated score mid-meltdown and the persona never trusts us again.
const SAMPLE_LINES = ["1", "2", "3", "A", "C", "E", "N", "Q", "R", "L", "7", "G", "J", "Z", "B", "D", "F", "M", "4", "5", "6"];

export default function OfflineState({ onRetry, loading, lastUpdated }) {
  const lastSeen = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    : null;

  return (
    <div className="min-h-dvh antialiased" style={{ backgroundColor: "var(--color-tunnel)", color: "var(--color-platform)" }}>
      {/* Masthead, same monochrome chrome as the live page: a single 1px
          Concrete hairline, no color stripe (color is data only). */}
      <div style={{ borderBottom: "1px solid var(--color-concrete)" }}>
        <div className="px-4 py-3 max-w-[672px] mx-auto">
          <h1 className="font-display leading-none" style={{ fontSize: "22px", letterSpacing: "0.3em", color: "var(--color-platform)" }}>
            THE LOW LINE
          </h1>
          <p className="mt-0.5" style={{ fontSize: "11px", color: "var(--color-newsprint)" }}>
            Is my train fucked?
          </p>
        </div>
      </div>

      {/* The honest hero */}
      <div className="max-w-[672px] mx-auto px-4 pt-5">
        <div
          className="p-5"
          style={{ backgroundColor: "var(--color-ballast)", boxShadow: "var(--shadow-card-shame)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="live-dot" />
            <span className="receipt" style={{ color: "var(--color-signal-red)" }}>No live data</span>
          </div>

          <h2 className="font-display" style={{ fontSize: "clamp(40px, 12vw, 64px)", lineHeight: 0.95, letterSpacing: "0.01em", color: "var(--color-platform)" }}>
            THE TRACKER IS DOWN.
            <br />
            EVEN WE ARE DELAYED.
          </h2>

          <p className="mt-4" style={{ fontSize: "15px", lineHeight: 1.5, color: "var(--color-platform)" }}>
            We cannot reach the live MTA feed right now, so there are no real scores to show.
            We would rather show you nothing than make a number up.
          </p>

          {lastSeen && (
            <p className="receipt mt-3" style={{ color: "var(--color-newsprint)" }}>
              Last good data: {lastSeen} &middot; may be stale
            </p>
          )}

          <button
            type="button"
            onClick={onRetry}
            disabled={loading}
            className="font-display mt-5 inline-flex items-center justify-center press-scale disabled:opacity-40"
            style={{
              fontSize: "20px",
              letterSpacing: "0.04em",
              minHeight: "48px",
              padding: "0 24px",
              backgroundColor: "var(--color-signal-red)",
              color: "var(--color-platform)",
              border: "none",
              borderRadius: 0,
              cursor: "pointer",
            }}
          >
            {loading ? "CHECKING" : "TRY AGAIN"}
          </button>
        </div>
      </div>

      {/* Layout sketch: unmistakably not live. No real scores, ever. */}
      <div className="max-w-[672px] mx-auto px-4 pt-6" aria-hidden="true">
        <div className="flex items-center gap-2 mb-3 pl-3" style={{ borderLeft: "4px solid var(--color-concrete)" }}>
          <span className="kicker" style={{ color: "var(--color-newsprint)" }}>What the ranking looks like</span>
          <span className="receipt" style={{ color: "var(--color-newsprint)", border: "1px dashed var(--color-concrete)", padding: "2px 6px" }}>
            Sample layout, not live
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" style={{ opacity: 0.4 }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="p-4 flex items-center gap-3" style={{ backgroundColor: "var(--color-ballast)", border: "1px dashed var(--color-concrete)" }}>
              <div className="w-9 h-9 rounded-full shrink-0" style={{ backgroundColor: "var(--color-concrete)" }} />
              <div className="flex-1">
                <div className="h-3 w-20 mb-1.5" style={{ backgroundColor: "var(--color-concrete)" }} />
                <div className="h-2 w-12" style={{ backgroundColor: "var(--color-concrete)" }} />
              </div>
              <span className="font-display" style={{ fontSize: "24px", color: "var(--color-newsprint)" }} aria-hidden="true">--</span>
            </div>
          ))}
        </div>
        <p className="receipt mt-4" style={{ color: "var(--color-newsprint)" }}>
          No scores here are real. The live ranking appears once the feed reconnects.
        </p>
      </div>

      {/* All the bullets, no scores: still answers "which lines exist" honestly. */}
      <div className="max-w-[672px] mx-auto px-4 pt-6 pb-10">
        <div className="flex flex-wrap gap-1.5 p-4" style={{ backgroundColor: "var(--color-ballast)", boxShadow: "0 0 0 1px var(--color-concrete)" }}>
          {SAMPLE_LINES.map((id) => (
            <LineBadge key={id} lineId={id} size="sm" />
          ))}
        </div>
        <p className="receipt mt-3 text-center" style={{ color: "var(--color-newsprint)" }}>
          DATA: LIVE FROM THE MTA &middot; For entertainment. The MTA has enough problems.
        </p>
      </div>
    </div>
  );
}
