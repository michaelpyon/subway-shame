import { useState } from "react";
import { CATEGORY_CONFIG, CATEGORY_ORDER, SCORE_TIERS } from "../constants/lines";

const SCORING_DATA = [
  { cat: "No Service",     pts: 50, desc: "Line completely stopped. Maximum shame." },
  { cat: "Delays",         pts: 30, desc: "Running late — as is tradition." },
  { cat: "Slow Speeds",    pts: 20, desc: "Speed restrictions slowing all trains on this route." },
  { cat: "Skip Stop",      pts: 15, desc: "Trains bypassing certain stations without warning." },
  { cat: "Rerouted",       pts: 15, desc: "Running an alternate route instead of the normal one." },
  { cat: "Runs Local",     pts: 10, desc: "Express train making all local stops instead." },
  { cat: "Reduced Freq",   pts: 10, desc: "Fewer trains than scheduled — longer waits." },
  { cat: "Platform Change",pts: 2,  desc: "Trains using a different platform than expected." },
  { cat: "Other",          pts: 5,  desc: "MTA issued an alert but didn't specify the cause." },
];

export default function ScoringExplainer() {
  const [open, setOpen] = useState(false);

  return (
    <div id="scoring-explainer" className="px-4 py-2 max-w-2xl mx-auto">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-xs transition-colors mx-auto press-scale font-label"
        aria-controls="scoring-explainer-panel"
        aria-expanded={open}
        style={{ color: 'var(--color-outline)' }}
      >
        <span>How are shame points calculated?</span>
        <svg
          className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {open && (
        <div
          id="scoring-explainer-panel"
          className="mt-3 p-4 sm:p-6 max-w-2xl mx-auto"
          style={{ backgroundColor: 'var(--color-ballast)', boxShadow: 'var(--shadow-card)' }}
        >
          <h3
            className="text-sm font-semibold mb-1"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-cream)', letterSpacing: '0.04em', fontSize: '18px' }}
          >
            THE SHAME POINT SYSTEM
          </h3>

          {/* How it works */}
          <div className="rounded-lg px-3 py-2.5 mb-4 space-y-1" style={{ backgroundColor: 'var(--color-concrete)' }}>
            <p className="text-xs" style={{ color: 'var(--color-on-surface-variant)' }}>
              <strong style={{ color: 'var(--color-cream)' }}>How it works:</strong> Every 5 minutes the app polls the MTA
              and adds points for each active alert. A brief delay earns 30 pts per poll.
              A 1-hour delay earns ~360 pts. Scores reset at midnight ET.
            </p>
            <p className="text-xs" style={{ color: 'var(--color-outline)' }}>
              Think of it like a tab at a bar — the longer the MTA keeps messing up, the bigger the bill.
            </p>
          </div>

          {/* Tier legend */}
          <div className="mb-4">
            <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: 'var(--color-outline-variant)' }}>Score tiers (daily total)</p>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {[...SCORE_TIERS].reverse().slice(1).map((tier) => (
                <div
                  key={tier.label}
                  className="flex items-center gap-2 rounded px-2 py-1.5"
                  style={{ backgroundColor: `${tier.color}12`, border: `1px solid ${tier.color}25` }}
                >
                  <span className="text-sm">{tier.emoji}</span>
                  <div>
                    <p className="text-[11px] font-semibold" style={{ color: tier.color }}>{tier.label}</p>
                    <p className="text-[9px]" style={{ color: 'var(--color-outline-variant)' }}>{tier.min.toLocaleString()}+ pts</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Per-alert points */}
          <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: 'var(--color-outline-variant)' }}>Points per alert type (per poll)</p>
          <div className="space-y-1.5">
            {SCORING_DATA.map(({ cat, pts, desc }) => {
              const cfg = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG["Other"];
              return (
                <div
                  key={cat}
                  className="flex items-center gap-3 py-1.5"
                  style={{ borderBottom: '1px solid var(--color-outline-variant)' }}
                >
                  <span
                    className="w-14 text-right text-sm font-bold tabular-nums shrink-0"
                    style={{ color: cfg.color, fontFamily: 'var(--font-mono)' }}
                  >
                    +{pts} pts
                  </span>
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0"
                    style={{ backgroundColor: `${cfg.color}20` }}
                  >
                    {cfg.icon}
                  </span>
                  <div className="min-w-0">
                    <span className="text-xs font-medium" style={{ color: 'var(--color-on-surface)' }}>
                      {cfg.label}
                    </span>
                    <span className="text-xs ml-2" style={{ color: 'var(--color-outline-variant)' }}>{desc}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-3 space-y-2" style={{ borderTop: '1px solid var(--color-outline-variant)' }}>
            <div className="flex items-start gap-2">
              <span className="text-xs mt-0.5" style={{ color: 'var(--color-outline-variant)' }}>📊</span>
              <p className="text-xs" style={{ color: 'var(--color-outline)' }}>
                <strong style={{ color: 'var(--color-on-surface-variant)' }}>Stacking:</strong> A line
                with 3 simultaneous alerts adds all their points. Suspended +
                Delays + Skip Stop = 95 pts per snapshot.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-xs mt-0.5" style={{ color: 'var(--color-outline-variant)' }}>⏱️</span>
              <p className="text-xs" style={{ color: 'var(--color-outline)' }}>
                <strong style={{ color: 'var(--color-on-surface-variant)' }}>Accumulation:</strong> 300 pts ≈ 50 min of delays.
                1,500 pts ≈ 4 hours. 5,000+ pts means the line has been a disaster all day.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-xs mt-0.5" style={{ color: 'var(--color-outline-variant)' }}>↕️</span>
              <p className="text-xs" style={{ color: 'var(--color-outline)' }}>
                <strong style={{ color: 'var(--color-on-surface-variant)' }}>Direction:</strong> Alerts
                specify uptown/downtown. "Both directions" splits points 50/50.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
