import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { LINE_DIRECTIONS, CATEGORY_CONFIG, getScoreTier } from "../constants/lines";
import LineBadge from "./LineBadge";
import AlertText from "./AlertText";

// "Is my train fucked?" The single-line lookup. Answer pattern, in order:
// severity stamp, score, then 1 deadpan line. Verdict first, joke second.
// Used two ways: as a launcher card on the page (onOpen) and as the modal it
// opens (isModal). The persona checks 1 line at 7:40 AM, so the lookup is fast
// and the verdict is the loud part.

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

function parseHash() {
  const hash = window.location.hash.slice(1);
  if (!hash) return { line: null, dir: null };
  const params = new URLSearchParams(hash);
  const line = params.get("line");
  const dirStr = params.get("dir");
  const dir = dirStr === "uptown" ? 0 : dirStr === "downtown" ? 1 : null;
  return { line: line && ALL_LINE_IDS.includes(line) ? line : null, dir };
}

function getFocusable(container) {
  if (!container) return [];
  return [...container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )].filter((el) => !el.hasAttribute("disabled"));
}

export default function TrainChecker({ lines, isModal = false, onClose, onOpen }) {
  // Launcher card: render the prompt + a single tap that opens the modal.
  if (!isModal && onOpen) {
    return (
      <section className="px-4 max-w-[672px] mx-auto">
        <button
          type="button"
          onClick={onOpen}
          className="press-scale w-full flex items-center justify-between gap-3 px-4 py-4"
          style={{
            backgroundColor: "var(--color-signal-red)",
            border: "none",
            boxShadow: "var(--shadow-card)",
            cursor: "pointer",
          }}
        >
          <span
            className="font-display text-left"
            style={{ fontSize: "24px", letterSpacing: "0.04em", color: "var(--color-platform)" }}
          >
            Is my train fucked?
          </span>
          <span className="receipt" style={{ color: "var(--color-platform)" }}>
            Check 1 line &rarr;
          </span>
        </button>
      </section>
    );
  }

  return <TrainCheckerBody lines={lines} isModal={isModal} onClose={onClose} />;
}

function TrainCheckerBody({ lines, isModal, onClose }) {
  const initial = useMemo(() => parseHash(), []);
  const [selectedLine, setSelectedLine] = useState(initial.line);
  const [selectedDir, setSelectedDir] = useState(initial.dir);
  const [verdict, setVerdict] = useState(null);
  const [animKey, setAnimKey] = useState(0);
  const [shareFeedback, setShareFeedback] = useState("");
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    const onHashChange = () => {
      const { line, dir } = parseHash();
      setSelectedLine(line);
      setSelectedDir(dir);
      setVerdict(null);
      setShareFeedback("");
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

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

  useEffect(() => {
    if (!isModal) return undefined;
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = dialogRef.current;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusable = getFocusable(dialog);
    (focusable[0] || dialog)?.focus();

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose?.();
        return;
      }
      if (e.key !== "Tab") return;
      const nodes = getFocusable(dialog);
      if (nodes.length === 0) {
        e.preventDefault();
        dialog?.focus();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKeyDown);
      previousFocusRef.current?.focus?.();
    };
  }, [isModal, onClose]);

  const directions = useMemo(() => {
    if (!selectedLine) return null;
    return LINE_DIRECTIONS[selectedLine] || ["Uptown", "Downtown"];
  }, [selectedLine]);

  const lineData = useMemo(() => {
    if (!selectedLine || !lines) return null;
    return lines.find((l) => l.id === selectedLine) || null;
  }, [selectedLine, lines]);

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
    setVerdict(null);
    setShareFeedback("");
  }, []);

  const handleCheck = useCallback(() => {
    if (!lineData) return;
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
    setVerdict({ message, isBad, dailyScore });
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
      ref={dialogRef}
      aria-describedby={isModal ? "tc-desc" : undefined}
      aria-labelledby={isModal ? "tc-title" : undefined}
      aria-modal={isModal ? "true" : undefined}
      className="p-5 relative"
      role={isModal ? "dialog" : undefined}
      style={{ backgroundColor: "var(--color-ballast)", boxShadow: "var(--shadow-card)" }}
      tabIndex={isModal ? -1 : undefined}
    >
      {isModal && (
        <button
          aria-label="Close"
          className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center text-xl leading-none press-scale"
          onClick={onClose}
          style={{ backgroundColor: "var(--color-concrete)", color: "var(--color-newsprint)", borderRadius: 0 }}
          type="button"
        >
          &times;
        </button>
      )}

      <h2
        className="font-display pr-8"
        id="tc-title"
        style={{ fontSize: "24px", letterSpacing: "0.04em", color: "var(--color-platform)" }}
      >
        Is my train fucked?
      </h2>
      <p className="receipt mt-1 mb-4" id="tc-desc" style={{ color: "var(--color-newsprint)" }}>
        Pick a line. Get the verdict.
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
            <LineBadge lineId={id} size="sm" />
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
                onClick={() => setSelectedDir(selectedDir === i ? null : i)}
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

      {selectedLine && (
        <button
          className="font-display w-full mt-4 press-scale"
          onClick={handleCheck}
          style={{
            backgroundColor: "var(--color-signal-red)",
            color: "var(--color-platform)",
            fontSize: "20px",
            letterSpacing: "0.04em",
            minHeight: "48px",
            border: "none",
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

  if (isModal) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose?.();
        }}
        style={{ backgroundColor: "rgba(0, 0, 0, 0.85)" }}
      >
        <div className="max-h-[88vh] overflow-y-auto w-full sm:max-w-[672px]">{inner}</div>
      </div>
    );
  }

  return <div className="px-4 max-w-[672px] mx-auto">{inner}</div>;
}
