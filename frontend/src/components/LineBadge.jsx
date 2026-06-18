import { LINE_COLORS } from "../constants/lines";

const SIZES = {
  xs: "w-5 h-5 text-[11px]",
  sm: "w-9 h-9 text-lg",
  md: "w-11 h-11 text-xl",
  lg: "w-16 h-16 text-3xl",
  xl: "w-[5.5rem] h-[5.5rem] text-[3.25rem]",
};

// Black glyph on light bullets (NQRW yellow, L gray); white everywhere else.
// This is a data rule from DESIGN.md, not a style choice.
const DARK_TEXT_LINES = new Set(["N", "Q", "R", "W", "L"]);

// A11y: the bullet is named for screen readers as "<id> train" so a standalone
// bullet (the good-lines wrap, the offline bullet row) is not announced as a
// lone letter. Where the line name is already spoken in adjacent text (the
// Trophy, the Leaderboard rows), pass decorative so it is skipped instead of
// double read. The visible glyph is always aria-hidden; the label carries it.
export default function LineBadge({ lineId, size = "md", decorative = false }) {
  const color = LINE_COLORS[lineId] || "#808183";
  const dark = DARK_TEXT_LINES.has(lineId);

  return (
    <div
      className={`${SIZES[size]} rounded-full flex items-center justify-center shrink-0`}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : `${lineId} train`}
      aria-hidden={decorative ? "true" : undefined}
      style={{
        backgroundColor: color,
        color: dark ? "#000" : "#fff",
        // The bullet glyph is system Helvetica, 700 to 900, like real MTA signage.
        fontFamily: "var(--font-text)",
        fontWeight: 800,
      }}
    >
      <span aria-hidden="true">{lineId}</span>
    </div>
  );
}
