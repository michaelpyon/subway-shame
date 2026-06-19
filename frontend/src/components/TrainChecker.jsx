import { useState, useMemo, useEffect, useCallback } from "react";
import { LINE_DIRECTIONS, CATEGORY_CONFIG, getScoreTier } from "../constants/lines";
import LineBadge from "./LineBadge";
import AlertText from "./AlertText";

// "Is my train fucked?" The single-line lookup. Answer pattern, in order:
// severity stamp, score, then 1 deadpan line. Verdict first, joke second.
// The persona checks 1 line at 7:40 AM, so this is her personal job (Job 2) and
// it must be zero taps, the same as the top verdict. The checker renders open in
// place with a line pre-selected and its verdict already painted: a deep link
// (#line=F) wins, otherwise the worst-scoring line is chosen so the answer is
// there on first load. It sits below the hero verdict so the personal answer
// costs 0 taps without pushing "is the F fucked" below the fold.

const ALL_LINE_IDS = [
  "1", "2", "3", "4", "5", "6", "7",
  "A", "C", "E", "B", "D", "F", "M",
  "N", "Q", "R", "W", "G", "J", "Z", "L", "S", "SI",
];

const GOOD_LINES = [
  "Running. Don't overthink it.",
  "No alerts on this one right now.",
  "Clean board. Unusual, but real.",
  "Nothing wrong this minute. The platform may disagree.",
  "Clear right now. Check again before you leave.",
];

const BAD_LINES = [
  "It is not running well.",
  "Delays are live. More are possible.",
  "The MTA is aware. That is all they will say.",
  "Running. Late.",
  "Something is wrong. The alerts below have it.",
];

const DIR_BAD = [
  "Your direction is in it.",
  "That way is affected right now.",
  "The trouble is on your side.",
];

const DIR_GOOD_OTHER_BAD = [
  "Your direction is fine. The way back is not.",
  "Clear going that way. The opposite has delays.",
  "You will get there. Getting back is the open question.",
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// The line with the highest live snapshot score, so the personal job has an
// answer with 0 taps on first load. Returns null if nothing is scoring.
function pickWorstLineId(lines) {
  if (!lines || lines.length === 0) return null;
  let worst = null;
  for (const l of lines) {
    const s = l.score || 0;
    if (s > 0 && (!worst || s > (worst.score || 0))) worst = l;
  }
  return worst ? worst.id : null;
}

// Pure verdict from a line + optional direction. Shared by the on-mount
// pre-computed verdict and the manual re-check, so a tap and a default render
// produce the exact same answer. Scores off the LIVE snapshot (score), never an
// implied daily total.
function computeVerdict(lineData, selectedDir) {
  if (!lineData) return null;
  const liveScore = lineData.score || 0;
  const dailyScore = lineData.daily_score || 0;
  const byDir = lineData.live_by_direction || {};
  const dirKey = selectedDir === 0 ? "uptown" : selectedDir === 1 ? "downtown" : null;

  let message;
  let isBad;
  if (liveScore === 0) {
    isBad = false;
    message = pick(GOOD_LINES);
  } else if (dirKey) {
    const dd = byDir[dirKey] || { score: 0 };
    const other = byDir[dirKey === "uptown" ? "downtown" : "uptown"] || { score: 0 };
    if (dd.score > 0) {
      isBad = true;
      message = pick([...BAD_LINES, ...DIR_BAD]);
    } else if (other.score > 0) {
      isBad = false;
      message = pick(DIR_GOOD_OTHER_BAD);
    } else {
      isBad = false;
      message = pick(GOOD_LINES);
    }
  } else {
    isBad = true;
    message = pick(BAD_LINES);
  }
  return { message, isBad, dailyScore };
}

function parseHash() {
  const hash = window.location.hash.slice(1);
  if (!hash) return { line: null, dir: null };
  const params = new URLSearchParams(hash);
  const line = params.get("line");
  const dirStr = params.get("dir");
  const dir = dirStr === "uptown" ? 0 : dirStr === "downtown" ? 1 : null;
  return { line: line && ALL_LINE_IDS.includes(line) ? line : null, dir };
}

export default function TrainChecker({ lines }) {
  return <TrainCheckerBody lines={lines} />;
}

function TrainCheckerBody({ lines }) {
  // Seed the line: a deep link wins, otherwise the worst-scoring line, so the
  // personal job is answered with 0 taps on first load. Pre-compute its verdict
  // from the same pure function the manual re-check uses, so the default render
  // and a tap give the identical answer.
  const initial = useMemo(() => {
    const fromHash = parseHash();
    const line = fromHash.line || pickWorstLineId(lines);
    const lineData = line && lines ? lines.find((l) => l.id === line) || null : null;
    return { line, dir: fromHash.dir, verdict: computeVerdict(lineData, fromHash.dir) };
    // Seed once on mount; live refreshes update the verdict via the data effect
    // below, not by reseeding (which would stomp a line the rider just picked).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [selectedLine, setSelectedLine] = useState(initial.line);
  const [selectedDir, setSelectedDir] = useState(initial.dir);
  const [verdict, setVerdict] = useState(initial.verdict);
  const [animKey, setAnimKey] = useState(0);
  const [shareFeedback, setShareFeedback] = useState("");

  useEffect(() => {
    const onHashChange = () => {
      const { line, dir } = parseHash();
      setSelectedLine(line);
      setSelectedDir(dir);
      // Recompute, do not blank: a deep-linked line still answers with 0 taps.
      const ld = line && lines ? lines.find((l) => l.id === line) || null : null;
      setVerdict(computeVerdict(ld, dir));
      setShareFeedback("");
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [lines]);

  useEffect(() => {
    if (!selectedLine) {
      history.replaceState(null, "", window.location.pathname);
      return;
    }
    const dirStr = selectedDir === 0 ? "uptown" : selectedDir === 1 ? "downtown" : null;
    const hash = dirStr ? `#line=${selectedLine}&dir=${dirStr}` : `#line=${selectedLine}`;
    history.replaceState(null, "", hash);
  }, [selectedLine, selectedDir]);

  useEffect(() => {
    if (!shareFeedback) return undefined;
    const t = window.setTimeout(() => setShareFeedback(""), 2500);
    return () => window.clearTimeout(t);
  }, [shareFeedback]);

  const directions = useMemo(() => {
    if (!selectedLine) return null;
    return LINE_DIRECTIONS[selectedLine] || ["Uptown", "Downtown"];
  }, [selectedLine]);

  const lineData = useMemo(() => {
    if (!selectedLine || !lines) return null;
    return lines.find((l) => l.id === selectedLine) || null;
  }, [selectedLine, lines]);

  // Keep the verdict live: when a 5 min poll changes the selected line's score,
  // re-answer so a stale verdict never sits on screen. Keyed on the score so it
  // fires only on real data changes, not every render. Skips when nothing is
  // showing yet (the on-mount seed and tap handlers own that path).
  const liveScore = lineData?.score ?? null;
  useEffect(() => {
    if (!verdict || !lineData) return;
    setVerdict(computeVerdict(lineData, selectedDir));
    // verdict and selectedDir are intentionally out of deps: this fires on a new
    // poll (liveScore change) only, and reading verdict here would re-roll the
    // deadpan line on every direction tap, which those handlers already own.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveScore, selectedLine]);

  const relevantAlerts = useMemo(() => {
    if (!lineData?.alerts) return [];
    if (selectedDir === null) return lineData.alerts;
    const dirKey = selectedDir === 0 ? "uptown" : "downtown";
    return lineData.alerts.filter((al) => {
      const a = typeof al === "string" ? { text: al } : al;
      return !a.direction || a.direction === dirKey || a.direction === "both";
    });
  }, [lineData, selectedDir]);

  const handleSelect = useCallback((id) => {
    setSelectedLine(id);
    setSelectedDir(null);
    setShareFeedback("");
    // Answer on tap: picking a line is the whole interaction, so the verdict
    // paints immediately instead of waiting for a second button press.
    const ld = lines ? lines.find((l) => l.id === id) || null : null;
    setVerdict(computeVerdict(ld, null));
    setAnimKey((v) => v + 1);
  }, [lines]);

  const handleCheck = useCallback(() => {
    if (!lineData) return;
    setVerdict(computeVerdict(lineData, selectedDir));
    setAnimKey((v) => v + 1);
  }, [lineData, selectedDir]);

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Is my train fucked?", url });
        setShareFeedback("Shared.");
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareFeedback("Link copied.");
    } catch {
      setShareFeedback("Share failed.");
    }
  }, []);

  const verdictTier = verdict ? getScoreTier(verdict.dailyScore) : null;

  const inner = (
    <div
      className="p-5 relative"
      style={{ backgroundColor: "var(--color-ballast)", boxShadow: "var(--shadow-card)" }}
    >
      <h2
        className="font-display"
        style={{ fontSize: "24px", letterSpacing: "0.04em", color: "var(--color-platform)" }}
      >
        Is my train fucked?
      </h2>
      <p className="receipt mt-1 mb-4" style={{ color: "var(--color-newsprint)" }}>
        Your line is checked already. Tap another to switch.
      </p>

      <div className="flex flex-wrap gap-1.5">
        {ALL_LINE_IDS.map((id) => (
          <button
            key={id}
            aria-label={`${id} train`}
            aria-pressed={selectedLine === id}
            className={`min-w-[44px] min-h-[44px] flex items-center justify-center press-scale ${
              selectedLine && selectedLine !== id ? "opacity-40" : ""
            }`}
            onClick={() => handleSelect(id)}
            style={{
              background: "transparent",
              border: selectedLine === id ? "2px solid var(--color-platform)" : "2px solid transparent",
              borderRadius: 0,
              cursor: "pointer",
            }}
            type="button"
          >
            <LineBadge lineId={id} size="sm" decorative />
          </button>
        ))}
      </div>

      {selectedLine && directions && (
        <div className="mt-4">
          <p className="receipt mb-2" style={{ color: "var(--color-newsprint)" }}>
            Which way? (optional)
          </p>
          <div className="flex flex-wrap gap-2">
            {directions.map((label, i) => (
              <button
                key={label}
                aria-pressed={selectedDir === i}
                className="px-4 py-2.5 min-h-[44px] flex items-center press-scale"
                onClick={() => {
                  const next = selectedDir === i ? null : i;
                  setSelectedDir(next);
                  // Re-answer on direction change: still 0 extra taps to read.
                  if (verdict) {
                    setVerdict(computeVerdict(lineData, next));
                    setAnimKey((v) => v + 1);
                  }
                }}
                style={
                  selectedDir === i
                    ? { backgroundColor: "var(--color-concrete)", border: "1px solid var(--color-platform)", color: "var(--color-platform)", borderRadius: 0, fontSize: "13px" }
                    : { backgroundColor: "var(--color-tunnel)", border: "1px solid var(--color-concrete)", color: "var(--color-newsprint)", borderRadius: 0, fontSize: "13px" }
                }
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* The verdict is pre-computed and re-answers on every line/direction tap,
          so the personal job is 0 taps. The button only appears in the rare case
          a line is selected with no verdict yet (so there is never a dangling CTA
          sitting under an answer that is already shown). */}
      {selectedLine && !verdict && (
        <button
          className="font-display w-full mt-4 press-scale"
          onClick={handleCheck}
          style={{
            // Primary action, still monochrome: Platform border on Ballast so it
            // reads as the dominant control without using red as chrome. Red is
            // reserved for the verdict stamp that lands below.
            backgroundColor: "var(--color-ballast)",
            color: "var(--color-platform)",
            fontSize: "20px",
            letterSpacing: "0.04em",
            minHeight: "48px",
            border: "1px solid var(--color-platform)",
            borderRadius: 0,
            cursor: "pointer",
          }}
          type="button"
        >
          TELL ME THE TRUTH
        </button>
      )}

      {verdict && verdictTier && (
        <div
          aria-live="polite"
          className="mt-5 p-4"
          key={animKey}
          style={{
            backgroundColor: "var(--color-tunnel)",
            border: `1px solid var(--color-concrete)`,
          }}
        >
          {/* Stamp first, then score, then the deadpan line. */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`stamp ${verdictTier.stamp} stamp-slam`}>
              {verdictTier.emoji ? `${verdictTier.emoji} ` : ""}
              {verdictTier.label}
            </span>
            {verdict.dailyScore > 0 && (
              <span className="flex items-baseline gap-1">
                <span className="font-display tabular" style={{ fontSize: "32px", color: verdictTier.color }}>
                  {verdict.dailyScore.toLocaleString()}
                </span>
                <span className="receipt" style={{ color: "var(--color-newsprint)" }}>shame points</span>
              </span>
            )}
          </div>

          <p className="mt-3" style={{ fontSize: "15px", color: "var(--color-platform)" }}>
            The {selectedLine}. {verdict.message}
          </p>

          {relevantAlerts.length > 0 && verdict.isBad && (
            <div className="mt-3 space-y-2">
              <p className="receipt" style={{ color: "var(--color-newsprint)" }}>Straight from the MTA</p>
              {relevantAlerts.map((al, i) => {
                const a = typeof al === "string" ? { text: al } : al;
                const cfg = a.category ? CATEGORY_CONFIG[a.category] || CATEGORY_CONFIG.Other : null;
                return (
                  <div
                    className="p-2.5"
                    key={i}
                    style={{ backgroundColor: "var(--color-ballast)", border: "1px solid var(--color-concrete)", fontSize: "13px", lineHeight: 1.4, color: "var(--color-platform)" }}
                  >
                    {cfg && <span className="receipt mr-2" style={{ color: cfg.color }}>{cfg.label}</span>}
                    <AlertText text={a.text || al} />
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-4 flex items-center gap-3">
            <button
              className="receipt press-scale"
              onClick={handleShare}
              style={{ color: "var(--color-newsprint)", textDecoration: "underline", background: "transparent", border: "none", cursor: "pointer", padding: "4px" }}
              type="button"
            >
              Share this verdict
            </button>
            <span aria-live="polite" className="receipt" style={{ color: "var(--color-newsprint)" }}>
              {shareFeedback}
            </span>
          </div>
        </div>
      )}
    </div>
  );

  return <div className="px-4 max-w-[672px] mx-auto">{inner}</div>;
}
