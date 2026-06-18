import LineCard from "./LineCard";
import LineBadge from "./LineBadge";

// Grouped by severity, worst group first, display-face kickers as group headers.
// The Good Service lines collapse into 1 quiet row; they are not the story.
const GROUPS = [
  { key: "dumpster", label: "Dumpster Fire", color: "var(--tier-dumpster)", min: 120, max: Infinity },
  { key: "meltdown", label: "Full Meltdown", color: "var(--tier-meltdown)", min: 60, max: 119 },
  { key: "pain", label: "Pain Train", color: "var(--tier-pain)", min: 30, max: 59 },
  { key: "limping", label: "Limping Along", color: "var(--tier-limping)", min: 1, max: 29 },
];

export default function LineGrid({ lines }) {
  const sorted = [...lines].sort((a, b) => (b.daily_score || 0) - (a.daily_score || 0));
  const goodLines = sorted.filter((l) => (l.daily_score || 0) === 0);
  const problemLines = sorted.filter((l) => (l.daily_score || 0) > 0);

  return (
    <section className="px-4 max-w-[672px] mx-auto" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div className="flex items-baseline justify-between">
        <h2 className="kicker" style={{ color: "var(--color-platform)" }}>
          Every line
        </h2>
        <span className="receipt" style={{ color: "var(--color-newsprint)" }}>
          {problemLines.length} acting up &middot; {goodLines.length} fine
        </span>
      </div>

      {/* Severity groups, worst first */}
      {GROUPS.map((group) => {
        const groupLines = problemLines.filter((l) => {
          const s = l.daily_score || 0;
          return s >= group.min && s <= group.max;
        });
        if (groupLines.length === 0) return null;
        return (
          <div key={group.key}>
            <div
              className="flex items-center gap-2 mb-3 pl-3"
              style={{ borderLeft: `4px solid ${group.color}` }}
            >
              <span className="kicker" style={{ color: "var(--color-platform)" }}>
                {group.label}
              </span>
              <span className="receipt" style={{ color: "var(--color-newsprint)" }}>
                {groupLines.length} line{groupLines.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {groupLines.map((line) => (
                <LineCard key={line.id} line={line} />
              ))}
            </div>
          </div>
        );
      })}

      {/* Good Service: 1 quiet row. Not the story. */}
      {goodLines.length > 0 && (
        <div>
          <div
            className="flex items-center gap-2 mb-3 pl-3"
            style={{ borderLeft: "4px solid var(--tier-good)" }}
          >
            <span className="kicker" style={{ color: "var(--color-platform)" }}>
              {problemLines.length === 0 ? "All clear" : "These ones work"}
            </span>
            <span className="receipt" style={{ color: "var(--color-newsprint)" }}>
              {goodLines.length} fine right now
            </span>
          </div>
          <div
            className="flex flex-wrap items-center gap-2 p-4"
            style={{
              backgroundColor: "var(--color-ballast)",
              boxShadow: "0 0 0 1px var(--color-concrete), 3px 3px 0 0 rgba(0,0,0,0.5)",
            }}
          >
            {goodLines.map((line) => (
              <LineBadge key={line.id} lineId={line.id} size="sm" />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
