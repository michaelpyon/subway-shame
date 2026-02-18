import { useState } from "react";
import { CATEGORY_CONFIG, CATEGORY_ORDER } from "../constants/lines";

const SCORING_DATA = [
  { cat: "No Service", pts: 50, desc: "Line gave up. Not even pretending to run." },
  { cat: "Delays", pts: 30, desc: "Running late — as is tradition." },
  { cat: "Slow Speeds", pts: 20, desc: "Moving at a pace that insults the concept of transit." },
  { cat: "Skip Stop", pts: 15, desc: "Your stop? Never heard of it." },
  { cat: "Rerouted", pts: 15, desc: "Taking the scenic route nobody asked for." },
  { cat: "Runs Local", pts: 10, desc: "Express train having an identity crisis." },
  { cat: "Reduced Freq", pts: 10, desc: "Trains arriving on a 'whenever we feel like it' schedule." },
  { cat: "Platform Change", pts: 2, desc: "Surprise! Go find another platform." },
  { cat: "Other", pts: 5, desc: "Something's wrong but even the MTA isn't sure what." },
];

export default function ScoringExplainer() {
  const [open, setOpen] = useState(false);

  return (
    <div className="px-4 py-2 max-w-5xl mx-auto">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-400 transition-colors mx-auto"
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
        <div className="mt-3 bg-gray-900 rounded-lg p-4 sm:p-6 max-w-2xl mx-auto">
          <h3 className="text-sm font-semibold text-gray-300 mb-1">
            The Shame Point System
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            Each active MTA alert earns shame points based on severity. Points
            accumulate throughout the day — a line with problems all morning
            racks up way more shame than one with a brief hiccup. Resets at
            midnight.
          </p>

          <div className="space-y-1.5">
            {SCORING_DATA.map(({ cat, pts, desc }) => {
              const cfg = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG["Other"];
              return (
                <div
                  key={cat}
                  className="flex items-center gap-3 py-1.5 border-b border-gray-800 last:border-0"
                >
                  <span
                    className="w-12 text-right text-sm font-bold tabular-nums shrink-0"
                    style={{ color: cfg.color }}
                  >
                    +{pts}
                  </span>
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0"
                    style={{ backgroundColor: `${cfg.color}20` }}
                  >
                    {cfg.icon}
                  </span>
                  <div className="min-w-0">
                    <span className="text-xs text-gray-300 font-medium">
                      {cfg.label}
                    </span>
                    <span className="text-xs text-gray-600 ml-2">{desc}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-gray-800 space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-gray-600 text-xs mt-0.5">📊</span>
              <p className="text-xs text-gray-500">
                <strong className="text-gray-400">Stacking:</strong> A line
                with 3 simultaneous alerts adds all their points. Suspended +
                Delays + Skip Stop = 95 pts per snapshot.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-gray-600 text-xs mt-0.5">⏱️</span>
              <p className="text-xs text-gray-500">
                <strong className="text-gray-400">Accumulation:</strong> Points
                are added every ~60 seconds while the alert is active. A 30-minute delay
                earns way more shame than a 2-minute blip.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-gray-600 text-xs mt-0.5">↕️</span>
              <p className="text-xs text-gray-500">
                <strong className="text-gray-400">Direction:</strong> Alerts
                specify uptown/downtown. "Both directions" splits points 50/50.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
