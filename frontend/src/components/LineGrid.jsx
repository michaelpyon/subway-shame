import LineCard from "./LineCard";
import LineBadge from "./LineBadge";

// Severity groups: CRITICAL (>= 1500), DEGRADED (1-1499), OPERATIONAL (0)
const SEVERITY_GROUPS = [
  {
    key: "critical",
    label: "CRITICAL",
    sublabel: "Severe Impact",
    borderColor: "var(--color-signal-red)",
    filter: (l) => (l.daily_score || 0) >= 1500,
  },
  {
    key: "degraded",
    label: "DEGRADED",
    sublabel: "Minor Delays",
    borderColor: "#EAB308",
    filter: (l) => {
      const s = l.daily_score || 0;
      return s > 0 && s < 1500;
    },
  },
];

export default function LineGrid({ lines }) {
  const sorted = [...lines].sort((a, b) => (b.daily_score || 0) - (a.daily_score || 0));
  const goodLines = sorted.filter((l) => (l.daily_score || 0) === 0);
  const problemCount = sorted.filter((l) => (l.daily_score || 0) > 0).length;

  return (
    <div className="px-4 pb-8 max-w-2xl mx-auto space-y-6">
      {/* Section header */}
      <div className="flex items-baseline justify-between px-1">
        <div className="flex items-center gap-2">
          <h2
            style={{
              fontFamily: 'var(--font-headline)',
              fontWeight: 900,
              fontStyle: 'italic',
              color: 'var(--color-on-surface-variant)',
              letterSpacing: '-0.02em',
              fontSize: '22px',
              textTransform: 'uppercase',
            }}
          >
            ALL LINES
          </h2>
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById("scoring-explainer");
              if (el) {
                const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
                el.scrollIntoView({
                  behavior: prefersReducedMotion ? "auto" : "smooth",
                  block: "start",
                });
              }
            }}
            className="w-4 h-4 flex items-center justify-center text-[10px] font-bold leading-none press-scale"
            style={{
              border: '1px solid var(--color-outline-variant)',
              color: 'var(--color-outline)',
            }}
            title="How are shame points calculated?"
            aria-label="How are shame points calculated?"
          >
            ?
          </button>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {problemCount > 0 && (
            <span style={{ color: 'var(--color-signal-red)' }}>{problemCount} with issues</span>
          )}
          {goodLines.length > 0 && (
            <span className="text-green-600">{goodLines.length} on time</span>
          )}
        </div>
      </div>

      {/* Severity-grouped sections */}
      {SEVERITY_GROUPS.map((group) => {
        const groupLines = sorted.filter(group.filter);
        if (groupLines.length === 0) return null;

        return (
          <div key={group.key}>
            {/* Section header with left border */}
            <div
              className="severity-section-header mb-3"
              style={{ borderLeft: `4px solid ${group.borderColor}` }}
            >
              <span style={{ color: 'var(--color-cream)' }}>{group.label}</span>
              <span
                className="text-xs font-normal"
                style={{
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--color-outline)',
                  fontStyle: 'normal',
                  textTransform: 'uppercase',
                }}
              >
                {group.sublabel}
              </span>
            </div>

            {/* Two-column card grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {groupLines.map((line, idx) => (
                <LineCard
                  key={line.id}
                  line={line}
                  halftone={idx % 2 === 0}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Dashed divider (only if there are problem lines) */}
      {problemCount > 0 && goodLines.length > 0 && (
        <div
          className="text-center py-2"
          style={{
            border: '2px dashed var(--color-outline-variant)',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-headline)',
              fontWeight: 800,
              fontStyle: 'italic',
              fontSize: '14px',
              letterSpacing: '-0.01em',
              textTransform: 'uppercase',
              color: 'var(--color-outline-variant)',
            }}
          >
            THE ONES THAT WORK (FOR NOW)
          </span>
        </div>
      )}

      {/* Operational grid — compact badge tiles with green dots */}
      {goodLines.length > 0 && (
        <div>
          <div
            className="severity-section-header mb-3"
            style={{ borderLeft: '4px solid #22C55E' }}
          >
            <span style={{ color: 'var(--color-cream)' }}>OPERATIONAL</span>
            <span
              className="text-xs font-normal"
              style={{
                fontFamily: 'var(--font-mono)',
                color: 'var(--color-outline)',
                fontStyle: 'normal',
                textTransform: 'uppercase',
              }}
            >
              Nominal Service
            </span>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {goodLines.map((line) => (
              <div
                key={line.id}
                className="flex flex-col items-center justify-center py-2.5 structural-card"
                style={{
                  backgroundColor: 'var(--color-ballast)',
                  borderColor: 'var(--color-outline-variant)',
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                <LineBadge lineId={line.id} size="sm" />
                <div
                  className="w-1.5 h-1.5 mt-2"
                  style={{ backgroundColor: '#22C55E' }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All clear (no problems at all) */}
      {problemCount === 0 && (
        <div className="text-center py-4 text-sm" style={{ color: 'var(--color-outline-variant)' }}>
          All lines running normally.
        </div>
      )}
    </div>
  );
}
