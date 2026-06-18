import { useState } from "react";
import { CATEGORY_CONFIG, SCORE_TIERS } from "../constants/lines";

// How shame points are scored. Collapsed by default: the persona never reads
// this, but when the chat argues about the number it should hold up. Honest
// about being a live snapshot, not a daily total. No jargon, no "methodology".
const SCORING = [
  { cat: "No Service", pts: 50, desc: "The line is stopped. The worst thing it can do." },
  { cat: "Delays", pts: 30, desc: "Running late. The usual." },
  { cat: "Slow Speeds", pts: 20, desc: "Crawling. Speed limits on the whole route." },
  { cat: "Skip Stop", pts: 15, desc: "Blowing past stations with no warning." },
  { cat: "Rerouted", pts: 15, desc: "Taking some other line instead of yours." },
  { cat: "Runs Local", pts: 10, desc: "Express making every local stop." },
  { cat: "Reduced Freq", pts: 10, desc: "Fewer trains. Longer waits." },
  { cat: "Platform Change", pts: 2, desc: "Different platform than you expect." },
  { cat: "Other", pts: 5, desc: "An alert with no clear cause." },
];

export default function ScoringExplainer() {
  const [open, setOpen] = useState(false);

  return (
    <div id="scoring-explainer" className="px-4 max-w-[672px] mx-auto">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-controls="scoring-panel"
        aria-expanded={open}
        className="press-scale w-full flex items-center justify-between gap-2 py-3 px-4"
        style={{ backgroundColor: "var(--color-ballast)", border: "none", boxShadow: "0 0 0 1px var(--color-concrete)", cursor: "pointer" }}
      >
        <span className="kicker" style={{ color: "var(--color-platform)" }}>
          How the points work
        </span>
        <span className="receipt" style={{ color: "var(--color-newsprint)" }}>{open ? "Hide" : "Show"}</span>
      </button>

      {open && (
        <div
          id="scoring-panel"
          className="p-4 mt-px"
          style={{ backgroundColor: "var(--color-ballast)", boxShadow: "0 0 0 1px var(--color-concrete)" }}
        >
          <p style={{ fontSize: "15px", lineHeight: 1.5, color: "var(--color-platform)" }}>
            This is a live snapshot. Each line adds up the points of every alert active on
            it right now. A line with delays is 30 this minute. Suspended plus delays plus
            a skip stop is 95. A clean line is 0. It rises and falls as the MTA updates.
          </p>

          {/* Tiers */}
          <p className="receipt mt-5 mb-2" style={{ color: "var(--color-newsprint)" }}>The tiers</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[...SCORE_TIERS].reverse().slice(1).map((tier) => (
              <div
                key={tier.label}
                className="flex items-center justify-between gap-2 px-3 py-2"
                style={{ backgroundColor: "var(--color-tunnel)", borderLeft: `3px solid ${tier.color}` }}
              >
                <span className="font-display" style={{ fontSize: "18px", letterSpacing: "0.04em", color: tier.color }}>
                  {tier.label}
                </span>
                <span className="receipt tabular" style={{ color: "var(--color-newsprint)" }}>
                  {tier.min.toLocaleString()}+ pts
                </span>
              </div>
            ))}
          </div>

          {/* Per-alert points */}
          <p className="receipt mt-5 mb-2" style={{ color: "var(--color-newsprint)" }}>Points per active alert</p>
          <div>
            {SCORING.map(({ cat, pts, desc }) => {
              const cfg = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG.Other;
              return (
                <div
                  key={cat}
                  className="flex items-baseline gap-3 py-2"
                  style={{ borderBottom: "1px solid var(--color-concrete)" }}
                >
                  <span
                    className="font-display tabular text-right shrink-0"
                    style={{ width: "52px", fontSize: "20px", color: cfg.color }}
                  >
                    +{pts}
                  </span>
                  <div className="min-w-0">
                    <span style={{ fontSize: "15px", color: "var(--color-platform)" }}>{cfg.label}</span>
                    <span className="ml-2" style={{ fontSize: "13px", color: "var(--color-newsprint)" }}>{desc}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="mt-4" style={{ fontSize: "13px", lineHeight: 1.5, color: "var(--color-newsprint)" }}>
            Alerts that name a direction split their points between uptown and downtown.
            The number is a snapshot of this exact minute, not a running total for the day.
          </p>
        </div>
      )}
    </div>
  );
}
