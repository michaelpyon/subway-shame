import LineBadge from "./LineBadge";

const MTA_LINE_COLORS = [
  "#EE352E", "#00933C", "#B933AD",
  "#0039A6", "#FF6319", "#FCCC0A",
  "#6CBE45", "#996633", "#A7A9AC", "#808183",
];

export default function OfflineState({ onRetry, loading, lastUpdated }) {
  const lastSeen = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    : null;
  return (
    <div className="min-h-dvh antialiased" style={{ backgroundColor: 'var(--color-tunnel)', color: 'var(--color-cream)' }}>
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
            color: 'var(--color-cream)',
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
            color: 'var(--color-on-surface-variant)',
            fontSize: '13px',
          }}
        >
          Is My Train Fucked?
        </p>
      </div>

      {/* ── DOWN STATE: the honest hero ── */}
      <div className="max-w-2xl mx-auto px-4 mt-4">
        <div
          className="relative overflow-hidden structural-card p-6 sm:p-8 text-center"
          style={{
            backgroundColor: 'var(--color-ballast)',
            boxShadow: 'var(--shadow-card-shame)',
            borderColor: 'var(--color-signal-red)',
          }}
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping motion-reduce:animate-none absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: 'var(--color-gold-dim)' }} />
              <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: 'var(--color-gold-dim)' }} />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-gold-dim)' }}>
              No Live Data
            </span>
          </div>

          <h2
            style={{
              fontFamily: 'var(--font-headline)',
              fontWeight: 900,
              fontStyle: 'italic',
              fontSize: 'clamp(28px, 7vw, 44px)',
              lineHeight: 1.02,
              color: 'var(--color-cream)',
              letterSpacing: '-0.03em',
              textTransform: 'uppercase',
            }}
          >
            The tracker is down.<br />Even we&apos;re delayed.
          </h2>

          <p className="text-sm mt-4 max-w-md mx-auto leading-relaxed" style={{ color: 'var(--color-on-surface-variant)' }}>
            We cannot reach the live MTA feed right now, so there are no real scores to show.
            We would rather show you nothing than make numbers up.
          </p>

          {lastSeen && (
            <p className="text-xs mt-3" style={{ color: 'var(--color-outline)' }}>
              Last good data: {lastSeen} &middot; may be stale
            </p>
          )}

          <button
            type="button"
            onClick={onRetry}
            disabled={loading}
            className="mt-5 inline-flex items-center justify-center gap-2 press-scale disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '15px',
              letterSpacing: '0.05em',
              minHeight: '44px',
              padding: '0 22px',
              backgroundColor: 'var(--color-signal-red)',
              color: 'var(--color-cream)',
              border: '2px solid var(--color-cream)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            {loading ? (
              <>
                <span className="inline-block w-3 h-3 rounded-full animate-spin motion-reduce:animate-none" style={{ border: '1px solid rgba(245, 240, 232, 0.4)', borderTopColor: 'var(--color-cream)' }} />
                CHECKING...
              </>
            ) : (
              "TRY AGAIN"
            )}
          </button>
        </div>
      </div>

      {/* Is My Train Fucked — preview */}
      <div className="max-w-2xl mx-auto px-4 py-5">
        <div className=" p-5 relative overflow-hidden" style={{ backgroundColor: 'var(--color-ballast)', boxShadow: 'var(--shadow-card)' }}>
          {/* Overlay */}
          <div className="absolute inset-0 flex items-center justify-center  z-10 backdrop-blur-[1px]" style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}>
            <div className="rounded-lg px-4 py-2.5" style={{ backgroundColor: 'var(--color-ballast)', boxShadow: 'var(--shadow-card)' }}>
              <span className="text-sm font-medium" style={{ color: 'var(--color-on-surface-variant)' }}>Available when live data connects</span>
            </div>
          </div>

          <h2
            className="text-center mb-1"
            style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--color-cream)', letterSpacing: '0.04em' }}
          >
            IS MY TRAIN FUCKED?
          </h2>
          <p className="text-xs text-center mb-4" style={{ color: 'var(--color-outline-variant)' }}>
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

      {/* Illustrative layout sketch — UNMISTAKABLY not live. No real scores, ever. */}
      <div className="max-w-2xl mx-auto px-4 pb-8" aria-hidden="true">
        <div className="flex items-center gap-3 mb-3">
          <h2
            style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--color-outline-variant)', letterSpacing: '0.04em' }}
          >
            WHAT THE RANKING LOOKS LIKE
          </h2>
          <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ color: 'var(--color-outline-variant)', border: '1px dashed var(--color-outline-variant)' }}>
            Example layout, not live
          </span>
        </div>

        {/* Grayscale, score-free skeleton. Dashes where numbers would be. */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" style={{ filter: 'grayscale(1)', opacity: 0.32 }}>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-lg overflow-hidden"
              style={{ backgroundColor: 'var(--color-ballast)', border: '1px dashed var(--color-outline-variant)' }}
            >
              <div className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full shrink-0" style={{ backgroundColor: 'var(--color-concrete)' }} />
                <div className="flex-1 min-w-0">
                  <div className="h-3 w-20 rounded mb-1.5" style={{ backgroundColor: 'var(--color-concrete)' }} />
                  <div className="h-2 w-12 rounded" style={{ backgroundColor: 'var(--color-concrete)' }} />
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold tabular-nums leading-none" style={{ color: 'var(--color-outline-variant)' }}>
                    &mdash;&mdash;&mdash;
                  </div>
                  <div className="text-[9px] uppercase tracking-wide mt-0.5" style={{ color: 'var(--color-outline-variant)' }}>
                    pts
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-xs mt-4" style={{ color: 'var(--color-outline-variant)' }}>
          This is an empty layout sketch. No scores here are real. The live ranking appears once the feed reconnects.
        </p>
      </div>

      {/* Footer */}
      <footer className="text-center text-xs py-6 px-4" style={{ color: 'var(--color-outline-variant)', borderTop: '1px solid var(--color-outline-variant)' }}>
        <p>
          Data from{" "}
          <a
            href="https://api.mta.info/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
            style={{ color: 'var(--color-outline-variant)' }}
          >
            MTA GTFS-RT feeds
          </a>
        </p>
        <p className="mt-1">For entertainment purposes. The MTA has enough problems.</p>
      </footer>
    </div>
  );
}
