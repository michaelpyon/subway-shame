import { ALL_GOOD_MESSAGES } from "../constants/lines";
import { useState } from "react";

// One quantified line about the whole system. Every claim carries a number.
export default function SystemHealth({ lines }) {
  const total = lines.length;
  const disrupted = lines.filter((l) => (l.score || 0) > 0).length;
  const pct = total > 0 ? Math.round((disrupted / total) * 100) : 0;

  const [allGoodMsg] = useState(
    () => ALL_GOOD_MESSAGES[Math.floor(Math.random() * ALL_GOOD_MESSAGES.length)]
  );

  // Rare by design: a green day should feel like an event, not confetti.
  if (disrupted === 0) {
    return (
      <div className="px-4 max-w-[672px] mx-auto">
        <div
          className="px-4 py-3 flex items-center gap-3"
          style={{
            backgroundColor: "var(--color-ballast)",
            boxShadow: "0 0 0 1px var(--color-concrete)",
          }}
        >
          <span className="stamp stamp-good">Good service</span>
          <p style={{ fontSize: "15px", color: "var(--color-platform)" }}>{allGoodMsg}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 max-w-[672px] mx-auto">
      <div
        className="p-4"
        style={{
          backgroundColor: "var(--color-ballast)",
          boxShadow: "var(--shadow-card-shame)",
        }}
      >
        <div className="flex items-baseline justify-between mb-3 gap-2">
          <h2 className="kicker" style={{ color: "var(--color-platform)" }}>
            {disrupted} of {total} lines acting up right now
          </h2>
          <span className="receipt" style={{ color: "var(--color-signal-red)" }}>
            {pct}% of the system
          </span>
        </div>
        <div
          role="img"
          aria-label={`${pct} percent of subway lines currently have live alerts`}
          className="h-2 flex"
          style={{ backgroundColor: "var(--color-concrete)" }}
        >
          <div style={{ width: `${pct}%`, backgroundColor: "var(--color-signal-red)" }} />
        </div>
      </div>
    </div>
  );
}
