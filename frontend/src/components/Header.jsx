// Masthead. THE LOW LINE wordmark in display face, +0.3em, Platform. Right side
// carries the receipt micro line (DATA AS OF 8:47 AM), which flips to Signal Red
// when the data is older than 10 minutes. A single 1px Concrete hairline bottom
// border is the only chrome. No color stripe, no gold, no glow, no tagline
// competing with the verdict: color is reserved for data (a bullet, a tier, a
// stamp) and never runs as masthead decoration.
import { FreshnessStamp } from "./FreshnessStamp";

export default function Header({ lastUpdated, error, onRefresh, loading }) {
  return (
    <header style={{ borderBottom: "1px solid var(--color-concrete)" }}>
      <div className="px-4 py-3 max-w-[672px] mx-auto flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1
            className="font-display leading-none"
            style={{
              fontSize: "clamp(20px, 6vw, 22px)",
              letterSpacing: "0.3em",
              color: "var(--color-platform)",
            }}
          >
            THE LOW LINE
          </h1>
          <p
            className="mt-0.5"
            style={{
              fontFamily: "var(--font-text)",
              fontSize: "11px",
              letterSpacing: "0.04em",
              color: "var(--color-newsprint)",
            }}
          >
            Is my train fucked?
          </p>
        </div>

        <FreshnessStamp
          lastUpdated={lastUpdated}
          stale={Boolean(error && lastUpdated)}
          onRetry={onRefresh}
          loading={loading}
        />
      </div>
    </header>
  );
}
