// Masthead. THE LOW LINE wordmark in display face, +0.3em, Platform. Right side
// carries the receipt micro line (DATA AS OF 8:47 AM), which flips to Signal Red
// when the data is older than 10 minutes. 1px Concrete bottom border. No gold, no
// glow, no tagline competing with the verdict.
import { FreshnessStamp } from "./FreshnessStamp";

// True MTA bullet colors as a thin data stripe. Color only ever enters as data.
const MTA_COLORS = [
  "var(--mta-123)", "var(--mta-456)", "var(--mta-7)",
  "var(--mta-ace)", "var(--mta-bdfm)", "var(--mta-nqrw)",
  "var(--mta-g)", "var(--mta-jz)", "var(--mta-l)", "var(--mta-s)",
];

export default function Header({ lastUpdated, error, onRefresh, loading }) {
  return (
    <header style={{ borderBottom: "1px solid var(--color-concrete)" }}>
      {/* MTA bullet color stripe */}
      <div className="h-1 w-full flex">
        {MTA_COLORS.map((color, i) => (
          <div key={i} className="flex-1" style={{ backgroundColor: color }} />
        ))}
      </div>

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
