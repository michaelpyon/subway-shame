import LineBadge from "./LineBadge";
import { getScoreTier } from "../constants/lines";

// The alert ticker. Default chrome is monochrome: Concrete bar, Platform text,
// per the color-as-data-only law. Signal Red is the villain channel, so it only
// enters when a line has actually crossed the Dumpster Fire tier today. On a
// calm or merely painful day the bar stays grey and does not compete with the
// gold verdict.
//
// The track holds exactly two identical runs and scrolls translateX(0) to
// translateX(-50%), so the loop is seamless with no visible tiling. The whole
// band is constrained to the 672px content column so on a 1440px desktop it
// reads as part of the page, not full-bleed section chrome that repeats.

export default function AlertMarquee({ lines }) {
  const disrupted = (lines || []).filter((l) => (l.score || 0) > 0);
  if (disrupted.length === 0) return null;

  const count = disrupted.length;
  const label = `${count} LINE${count !== 1 ? "S" : ""} ACTING UP RIGHT NOW`;
  const lineSummary = disrupted.map((line) => line.id).join(", ");

  // Red is reserved for the villain channel. Only light the bar red when a line
  // has actually reached the Dumpster Fire tier; otherwise stay monochrome.
  const villain = disrupted.some(
    (l) => getScoreTier(l.score || 0).label === "Dumpster Fire"
  );

  // One run of the content. The track holds two of these for a seamless -50%
  // loop. Built inline as elements (not a nested component) so it never remounts.
  const run = (key) => (
    <div className="alert-marquee-run" aria-hidden="true" key={key}>
      <span
        className="font-display"
        style={{ letterSpacing: "0.08em", fontSize: "16px" }}
      >
        {label}
      </span>
      <span className="inline-flex items-center gap-1">
        {disrupted.map((l) => (
          <LineBadge key={l.id} lineId={l.id} size="xs" />
        ))}
      </span>
    </div>
  );

  return (
    <div className="max-w-[672px] mx-auto">
      <p className="sr-only" aria-live="polite">
        {label}: {lineSummary}.
      </p>
      <div
        aria-hidden="true"
        className="alert-marquee"
        style={{
          backgroundColor: villain
            ? "var(--color-signal-red)"
            : "var(--color-concrete)",
          color: "var(--color-platform)",
          fontWeight: 700,
          padding: "6px 0",
        }}
      >
        <div className="alert-marquee-track">
          {/* Two identical runs so the -50% loop is seamless with no tiling. */}
          {run("a")}
          {run("b")}
        </div>
      </div>
    </div>
  );
}
