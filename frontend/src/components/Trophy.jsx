import { useMemo, useState, useCallback } from "react";
import {
  LINE_COLORS,
  SHAME_HEADLINES,
  QUIET_DAY_HEADLINES,
  getScoreTier,
  CATEGORY_CONFIG,
  CATEGORY_ORDER,
  LINE_DIRECTIONS,
} from "../constants/lines";
import LineBadge from "./LineBadge";
import AlertText from "./AlertText";
import ShareCard from "./ShareCard";
import { buildShareText } from "../utils/shareText";

// The Trophy card is the share moment and the hero of the redesign. Everything
// that lands in a screenshot lives inside the card frame: wordmark (via the page
// masthead is not enough for a lazy crop, so the card repeats it), true-color
// bullet, hero score + "shame points", severity stamp, and the receipt line.
//
// Page job 1 is "is the F fucked" in 0 scrolls, so the verdict block paints with
// the data and never participates in entrance animation. The breakdown,
// direction split, and verbatim MTA alert text stay collapsed behind 1 tap.

const DARK_TEXT_LINES = new Set(["N", "Q", "R", "W", "L"]);

export default function Trophy({ winner, lines = [], lastUpdated }) {
  const color = LINE_COLORS[winner.id] || "#808183";
  const tier = getScoreTier(winner.daily_score);
  const [shareState, setShareState] = useState("idle");
  const [expanded, setExpanded] = useState(false);

  const headline = useMemo(() => {
    // Deterministic by line + score so the card does not reshuffle on re-render.
    const seed = (winner.id || "F").charCodeAt(0) + (winner.daily_score || 0);
    // On a quiet day the worst line is barely scoring, so a "villain certified"
    // line reads wrong. Lean into clean-board energy so a calm day still has a
    // deadpan hook that matches the share text.
    if (winner.daily_score < 30) {
      return QUIET_DAY_HEADLINES[seed % QUIET_DAY_HEADLINES.length];
    }
    return SHAME_HEADLINES[seed % SHAME_HEADLINES.length];
  }, [winner.id, winner.daily_score]);

  const clockStr = useMemo(() => {
    const d = lastUpdated ? new Date(lastUpdated) : new Date();
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }, [lastUpdated]);

  const shareDateShort = useMemo(
    () => new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    []
  );

  const alertsToShow =
    winner.alerts && winner.alerts.length > 0 ? winner.alerts : winner.peak_alerts || [];
  const breakdown = winner.breakdown || {};
  const sortedCats = CATEGORY_ORDER.filter((cat) => breakdown[cat] > 0);
  const dirs = LINE_DIRECTIONS[winner.id] || ["Uptown", "Downtown"];
  const byDir = winner.by_direction || {};

  const handleShare = useCallback(async () => {
    setShareState("working");
    const shareText = buildShareText(winner, clockStr);

    try {
      const { default: html2canvas } = await import("html2canvas");
      const el = document.getElementById("shame-share-card");
      if (!el) throw new Error("Card element not found");

      const canvas = await html2canvas(el, {
        backgroundColor: "#000000",
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const blob = await new Promise((res) => canvas.toBlob((b) => res(b), "image/png", 1.0));
      const file = new File([blob], "the-low-line.png", { type: "image/png" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ title: "The Low Line", text: shareText, files: [file] });
        setShareState("shared");
        setTimeout(() => setShareState("idle"), 2500);
        return;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "the-low-line.png";
      a.click();
      URL.revokeObjectURL(url);
      setShareState("shared");
      setTimeout(() => setShareState("idle"), 2500);
      return;
    } catch {
      // Fall through to text share if the canvas grab fails.
    }

    try {
      if (navigator.share) {
        await navigator.share({ text: shareText, title: "The Low Line" });
        setShareState("shared");
      } else {
        await navigator.clipboard.writeText(shareText);
        setShareState("copied");
      }
    } catch {
      try {
        await navigator.clipboard.writeText(shareText);
        setShareState("copied");
      } catch {
        setShareState("error");
      }
    }
    setTimeout(() => setShareState("idle"), 2500);
  }, [winner, clockStr]);

  const shareLabel =
    shareState === "working"
      ? "CAPTURING"
      : shareState === "copied"
      ? "COPIED"
      : shareState === "shared"
      ? "SHARED"
      : shareState === "error"
      ? "TRY AGAIN"
      : "SCREENSHOT THIS";

  return (
    <>
      {/* Off-screen capture target, identical 5 elements to this card. */}
      <ShareCard winner={winner} lines={lines} date={shareDateShort} clock={clockStr} />

      <section className="px-4 max-w-[672px] mx-auto">
        <div
          className="relative overflow-hidden"
          style={{
            backgroundColor: "var(--color-ballast)",
            // 1px Concrete border + shame shadow at Meltdown and above.
            boxShadow:
              winner.daily_score >= 60
                ? "var(--shadow-card-shame)"
                : "0 0 0 1px var(--color-concrete), 3px 3px 0 0 rgba(0,0,0,0.5)",
          }}
        >
          {/* The 1 permitted glow in the whole product: villain line color
              behind the bullet, radial, 20% opacity max. */}
          <div
            className="absolute pointer-events-none"
            aria-hidden="true"
            style={{
              top: "-40px",
              left: "-20px",
              width: "240px",
              height: "240px",
              background: `radial-gradient(circle, ${color}33 0%, transparent 70%)`,
              opacity: 0.6,
            }}
          />

          <div className="relative z-10 p-5">
            {/* Wordmark inside the card frame so a lazy iOS screenshot cropped to
                just this card still carries the brand, matching ShareCard's
                top-left placement. The in-page hero and the captured card are the
                same brand object regardless of how the user grabs it. */}
            <div
              className="font-display mb-3"
              style={{ fontSize: "15px", letterSpacing: "0.3em", color: "var(--color-platform)", lineHeight: 1 }}
            >
              THE LOW LINE
            </div>

            {/* Live label + share */}
            <div className="flex items-center justify-between gap-2 mb-4">
              <span className="flex items-center gap-2">
                <span className="live-dot" />
                <span className="receipt" style={{ color: "var(--color-newsprint)" }}>
                  Live &middot; Worst line right now
                </span>
              </span>
              <button
                type="button"
                onClick={handleShare}
                disabled={shareState === "working"}
                className="press-scale shrink-0 inline-flex items-center"
                style={{
                  fontFamily: "var(--font-text)",
                  fontSize: "13px",
                  fontWeight: 700,
                  letterSpacing: "0.02em",
                  textTransform: "uppercase",
                  minHeight: "44px",
                  padding: "0 14px",
                  borderRadius: "0",
                  backgroundColor: "transparent",
                  // Monochrome chrome per the Buttons law: Concrete border,
                  // Platform text. Signal Red is reserved for severity and
                  // villain data, never for UI chrome.
                  border: "1px solid var(--color-concrete)",
                  color: "var(--color-platform)",
                  cursor: "pointer",
                }}
              >
                {shareLabel}
              </button>
            </div>

            {/* Bullet + giant score. The number never count-ups; it is just there. */}
            <div className="flex items-center gap-4">
              <div className="shrink-0">
                <LineBadge lineId={winner.id} size="xl" decorative />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span
                    className="font-display tabular leading-none"
                    style={{
                      color: tier.color,
                      fontSize: "clamp(64px, 18vw, 96px)",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {winner.daily_score.toLocaleString()}
                  </span>
                  <span
                    className="receipt"
                    style={{ color: "var(--color-newsprint)", fontSize: "13px" }}
                  >
                    shame points
                  </span>
                </div>
                <div
                  className="mt-1"
                  style={{
                    fontFamily: "var(--font-text)",
                    fontSize: "13px",
                    color: "var(--color-platform)",
                  }}
                >
                  The {winner.id} {headline}
                </div>
              </div>
            </div>

            {/* Severity stamp slams in on data paint, runs once. */}
            <div className="mt-4 flex items-center gap-3 flex-wrap">
              <span className={`stamp ${tier.stamp} stamp-slam`}>
                {tier.emoji ? `${tier.emoji} ` : ""}
                {tier.label}
              </span>
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                aria-controls="trophy-details-panel"
                aria-expanded={expanded}
                className="press-scale ml-auto inline-flex items-center shrink-0"
                style={{
                  fontFamily: "var(--font-text)",
                  fontSize: "13px",
                  fontWeight: 700,
                  letterSpacing: "0.02em",
                  textTransform: "uppercase",
                  color: "var(--color-newsprint)",
                  minHeight: "44px",
                  padding: "0 4px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {expanded ? "Hide receipts" : "See receipts"}
              </button>
            </div>

            {/* Receipt line lives INSIDE the card frame so a lazy screenshot
                still carries the citation. The timestamp turns a meme into a
                source. */}
            <p className="receipt mt-3" style={{ color: "var(--color-newsprint)" }}>
              Data as of {clockStr} &middot; Updates every 5 min
            </p>
          </div>

          {/* Collapsed details: breakdown, direction split, verbatim MTA text. */}
          {expanded && (
            <div
              id="trophy-details-panel"
              className="relative z-10 px-5 pb-5 pt-4"
              style={{ borderTop: "1px solid var(--color-concrete)" }}
            >
              {/* Breakdown bar */}
              {sortedCats.length > 0 && winner.daily_score > 0 && (
                <div className="mb-5">
                  <p className="receipt mb-2" style={{ color: "var(--color-newsprint)" }}>
                    Where the points came from
                  </p>
                  <div
                    className="h-3 flex mb-2"
                    style={{ backgroundColor: "var(--color-concrete)" }}
                  >
                    {sortedCats.map((cat) => {
                      const pts = breakdown[cat];
                      const pct = (pts / winner.daily_score) * 100;
                      const cfg = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG.Other;
                      return (
                        <div
                          key={cat}
                          className="h-full"
                          style={{ width: `${Math.max(pct, 5)}%`, backgroundColor: cfg.color }}
                          title={`${cfg.label}: ${pts} points`}
                        />
                      );
                    })}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {sortedCats.map((cat) => {
                      const cfg = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG.Other;
                      return (
                        <span
                          key={cat}
                          className="flex items-center gap-1.5"
                          style={{ fontSize: "13px" }}
                        >
                          <span
                            className="inline-block w-2.5 h-2.5"
                            style={{ backgroundColor: cfg.color }}
                          />
                          <span style={{ color: "var(--color-platform)" }}>{cfg.label}</span>
                          <span className="tabular" style={{ color: "var(--color-newsprint)" }}>
                            {breakdown[cat].toLocaleString()}
                          </span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Direction split */}
              {(byDir.uptown?.score > 0 || byDir.downtown?.score > 0) && (
                <div className="grid grid-cols-2 gap-3 mb-5">
                  {["uptown", "downtown"].map((d, i) => {
                    const dd = byDir[d] || { score: 0 };
                    return (
                      <div
                        key={d}
                        className="p-3"
                        style={{
                          backgroundColor: "var(--color-tunnel)",
                          border: "1px solid var(--color-concrete)",
                        }}
                      >
                        <span
                          className="receipt block mb-1"
                          style={{ color: "var(--color-newsprint)" }}
                        >
                          {dirs[i]}
                        </span>
                        <span
                          className="font-display tabular"
                          style={{
                            fontSize: "24px",
                            color: dd.score > 0 ? "var(--color-platform)" : "var(--color-newsprint)",
                          }}
                        >
                          {dd.score}
                        </span>
                        <span
                          className="receipt ml-1"
                          style={{ color: "var(--color-newsprint)" }}
                        >
                          pts
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Verbatim MTA alert text: the receipts under the snark. */}
              {alertsToShow.length > 0 && (
                <div className="space-y-2">
                  <p className="receipt" style={{ color: "var(--color-newsprint)" }}>
                    Straight from the MTA
                  </p>
                  {alertsToShow.map((alert, i) => {
                    const a = typeof alert === "string" ? { text: alert } : alert;
                    const cfg = a.category
                      ? CATEGORY_CONFIG[a.category] || CATEGORY_CONFIG.Other
                      : null;
                    return (
                      <div
                        key={i}
                        className="p-3"
                        style={{
                          backgroundColor: "var(--color-tunnel)",
                          border: "1px solid var(--color-concrete)",
                          fontSize: "13px",
                          lineHeight: 1.5,
                          color: "var(--color-platform)",
                        }}
                      >
                        {cfg && (
                          <span
                            className="receipt mr-2"
                            style={{ color: cfg.color }}
                          >
                            {cfg.label}
                          </span>
                        )}
                        <AlertText text={a.text || alert} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
