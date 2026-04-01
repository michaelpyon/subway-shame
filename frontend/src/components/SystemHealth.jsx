import { ALL_GOOD_MESSAGES } from "../constants/lines";
import { useState } from "react";

export default function SystemHealth({ lines }) {
  const total = lines.length;
  const disrupted = lines.filter((l) => (l.score || 0) > 0).length;
  const pct = total > 0 ? Math.round((disrupted / total) * 100) : 0;

  const [allGoodMsg] = useState(
    () => ALL_GOOD_MESSAGES[Math.floor(Math.random() * ALL_GOOD_MESSAGES.length)]
  );

  if (disrupted === 0) {
    return (
      <div className="text-center py-8 px-4">
        <div className="text-4xl mb-3">🎉</div>
        <p
          className="text-lg font-semibold max-w-md mx-auto"
          style={{ color: '#F5F0E8' }}
        >
          {allGoodMsg}
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 max-w-2xl mx-auto">
      <div
        className="p-4 structural-card"
        style={{
          backgroundColor: 'rgba(232, 53, 58, 0.12)',
          borderColor: '#E8353A',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2
            style={{
              fontFamily: 'var(--font-headline)',
              fontWeight: 900,
              fontStyle: 'italic',
              fontSize: '20px',
              letterSpacing: '-0.03em',
              textTransform: 'uppercase',
              color: '#F5F0E8',
            }}
          >
            {disrupted} / {total} LINES IMPACTED RIGHT NOW
          </h2>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              color: '#E8353A',
              textTransform: 'uppercase',
              fontWeight: 700,
            }}
          >
            {pct}% failure
          </span>
        </div>
        <div
          aria-label={`${pct}% of subway lines currently have live alerts`}
          className="h-3 flex"
          role="img"
          style={{ backgroundColor: '#2A2A2A' }}
        >
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              backgroundColor: '#E8353A',
            }}
          />
        </div>
      </div>
    </div>
  );
}
