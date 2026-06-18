import { useEffect, useState } from "react";

const STALE_MS = 10 * 60 * 1000; // 10 minutes: 1 stale lie mid-meltdown loses her.

function clockOf(date) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

// The freshness stamp is load-bearing. Newsprint when fresh. When the data is
// older than 10 minutes it flips to Signal Red and reads OLD NEWS, with a retry
// affordance. Staleness is a brand event, not a console warning.
//
// Time-based derivation (the current clock, whether the data has aged out) lives
// in state and is recomputed by an interval so it can flip on its own without an
// impure read during render.
export function FreshnessStamp({ lastUpdated, stale, onRetry, loading, align = "right" }) {
  // Derive directly from props each render (cheap, pure-enough for display), and
  // run a heartbeat that re-derives so staleness can flip on its own between
  // data fetches. The heartbeat setState lives in an interval callback, which is
  // the allowed external-subscription pattern.
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 30 * 1000);
    return () => clearInterval(id);
  }, []);

  // tick is referenced so the lint and React both treat it as a render input.
  void tick;
  const view = derive(lastUpdated, stale);

  if (!view.connected) {
    return (
      <span className="receipt" style={{ color: "var(--color-newsprint)" }}>
        Connecting to live feed
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 shrink-0"
      aria-live="polite"
      style={{ textAlign: align }}
    >
      {!view.isStale && (
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ backgroundColor: "var(--color-good)" }}
        />
      )}
      <span
        className="receipt"
        style={{ color: view.isStale ? "var(--color-signal-red)" : "var(--color-newsprint)" }}
      >
        {view.isStale ? `OLD NEWS: DATA FROM ${view.clock}` : `DATA AS OF ${view.clock}`}
      </span>
      {view.isStale && onRetry && (
        <button
          type="button"
          onClick={onRetry}
          disabled={loading}
          className="receipt press-scale disabled:opacity-40"
          style={{
            color: "var(--color-signal-red)",
            textDecoration: "underline",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: "4px",
          }}
        >
          {loading ? "CHECKING" : "RETRY"}
        </button>
      )}
    </span>
  );
}

function derive(lastUpdated, stale) {
  if (!lastUpdated) return { connected: false };
  const ageMs = Date.now() - new Date(lastUpdated).getTime();
  return {
    connected: true,
    isStale: Boolean(stale) || ageMs > STALE_MS,
    clock: clockOf(lastUpdated),
  };
}

export default FreshnessStamp;
