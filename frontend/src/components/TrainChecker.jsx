import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { LINE_DIRECTIONS, CATEGORY_CONFIG } from "../constants/lines";
import LineBadge from "./LineBadge";
import AlertText from "./AlertText";

const ALL_LINES = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7"],
  ["A", "C", "E"],
  ["B", "D", "F", "M"],
  ["N", "Q", "R", "W"],
  ["G"],
  ["J", "Z"],
  ["L"],
  ["S"],
  ["SI"],
];

const ALL_LINE_IDS = ALL_LINES.flat();

const GOOD_RESPONSES = [
  "Running on time. Don't overthink it.",
  "No delays reported. Check again in ten minutes if you need to be sure.",
  "Service is normal. That's the full update.",
  "Nothing wrong at this moment.",
  "Looks clear. The platform may tell a different story.",
  "No issues. This is unusual for a weekday.",
  "The train is running as scheduled. We noted it.",
  "Clean bill of health. For now.",
];

const BAD_RESPONSES = [
  "There are delays.",
  "The MTA reports a service disruption. They are working on it.",
  "It's not running well.",
  "Delays are in effect. Additional delays are possible.",
  "Something happened. The alerts below have the specifics.",
  "The train is running. Late.",
  "Service is disrupted. The MTA is aware.",
  "There are live issues on this line.",
];

const DIRECTION_BAD_RESPONSES = [
  "That direction is affected.",
  "Your direction has delays.",
  "Issues are concentrated in your direction.",
  "That way is part of this.",
];

const DIRECTION_GOOD_OTHER_BAD = [
  "Your direction is fine. The return trip may not be.",
  "Going that way, service is normal. The other direction has delays.",
  "Clear in your direction. The opposite is not.",
  "You'll get there. Getting back is the open question.",
];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function parseHash() {
  const hash = window.location.hash.slice(1);
  if (!hash) return { line: null, dir: null };

  const params = new URLSearchParams(hash);
  const line = params.get("line");
  const dirStr = params.get("dir");
  const dir = dirStr === "uptown" ? 0 : dirStr === "downtown" ? 1 : null;

  return {
    line: line && ALL_LINE_IDS.includes(line) ? line : null,
    dir,
  };
}

function getFocusableElements(container) {
  if (!container) return [];
  return [...container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )].filter((element) => !element.hasAttribute("disabled"));
}

export default function TrainChecker({ lines, isModal = false, onClose }) {
  const initialHashState = useMemo(() => parseHash(), []);
  const [selectedLine, setSelectedLine] = useState(initialHashState.line);
  const [selectedDirection, setSelectedDirection] = useState(initialHashState.dir);
  const [verdict, setVerdict] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const [shareFeedback, setShareFeedback] = useState("");
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    const onHashChange = () => {
      const { line, dir } = parseHash();
      setSelectedLine(line);
      setSelectedDirection(dir);
      setVerdict(null);
      setShowResult(false);
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

    const dirStr =
      selectedDirection === 0
        ? "uptown"
        : selectedDirection === 1
          ? "downtown"
          : null;
    const hash = dirStr ? `#line=${selectedLine}&dir=${dirStr}` : `#line=${selectedLine}`;
    history.replaceState(null, "", hash);
  }, [selectedLine, selectedDirection]);

  useEffect(() => {
    if (!shareFeedback) return undefined;
    const timer = window.setTimeout(() => setShareFeedback(""), 2500);
    return () => window.clearTimeout(timer);
  }, [shareFeedback]);

  useEffect(() => {
    if (!isModal) return undefined;

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusable = getFocusableElements(dialog);
    (focusable[0] || dialog)?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose?.();
        return;
      }

      if (event.key !== "Tab") return;

      const nodes = getFocusableElements(dialog);
      if (nodes.length === 0) {
        event.preventDefault();
        dialog?.focus();
        return;
      }

      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey && activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      previousFocusRef.current?.focus?.();
    };
  }, [isModal, onClose]);

  const directions = useMemo(() => {
    if (!selectedLine) return null;
    return LINE_DIRECTIONS[selectedLine] || ["Uptown", "Downtown"];
  }, [selectedLine]);

  const lineData = useMemo(() => {
    if (!selectedLine || !lines) return null;
    return lines.find((line) => line.id === selectedLine) || null;
  }, [selectedLine, lines]);

  const relevantAlerts = useMemo(() => {
    if (!lineData?.alerts) return [];
    if (selectedDirection === null) return lineData.alerts;

    const dirKey = selectedDirection === 0 ? "uptown" : "downtown";
    return lineData.alerts.filter((alertLike) => {
      const alert = typeof alertLike === "string" ? { text: alertLike } : alertLike;
      return !alert.direction || alert.direction === dirKey || alert.direction === "both";
    });
  }, [lineData, selectedDirection]);

  const handleLineSelect = useCallback((lineId) => {
    setSelectedLine(lineId);
    setSelectedDirection(null);
    setVerdict(null);
    setShowResult(false);
    setShareFeedback("");
  }, []);

  const handleCheck = useCallback(() => {
    if (!lineData) return;

    const liveScore = lineData.score || 0;
    const dailyScore = lineData.daily_score || 0;
    const byDir = lineData.live_by_direction || {};
    const dirKey =
      selectedDirection === 0
        ? "uptown"
        : selectedDirection === 1
          ? "downtown"
          : null;

    let message;
    let isBad;

    if (liveScore === 0) {
      isBad = false;
      message = pickRandom(GOOD_RESPONSES);
    } else if (dirKey) {
      const dirData = byDir[dirKey] || { score: 0 };
      const otherKey = dirKey === "uptown" ? "downtown" : "uptown";
      const otherData = byDir[otherKey] || { score: 0 };

      if (dirData.score > 0) {
        isBad = true;
        message = pickRandom([...BAD_RESPONSES, ...DIRECTION_BAD_RESPONSES]);
      } else if (otherData.score > 0) {
        isBad = false;
        message = pickRandom(DIRECTION_GOOD_OTHER_BAD);
      } else {
        isBad = false;
        message = pickRandom(GOOD_RESPONSES);
      }
    } else {
      isBad = true;
      message = pickRandom(BAD_RESPONSES);
    }

    setVerdict({ message, isBad, dailyScore });
    setShowResult(true);
    setAnimKey((value) => value + 1);
  }, [lineData, selectedDirection]);

  const handleShare = useCallback(async () => {
    const url = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({ title: "Is My Train Fucked?", url });
        setShareFeedback("Verdict shared.");
        return;
      }

      await navigator.clipboard.writeText(url);
      setShareFeedback("Link copied.");
    } catch {
      setShareFeedback("Share failed.");
    }
  }, []);

  const innerContent = (
    <div
      ref={dialogRef}
      aria-describedby={isModal ? "train-checker-description" : undefined}
      aria-labelledby={isModal ? "train-checker-title" : undefined}
      aria-modal={isModal ? "true" : undefined}
      className="p-5 sm:p-6 relative"
      role={isModal ? "dialog" : undefined}
      style={{ backgroundColor: "var(--color-ballast)", boxShadow: "var(--shadow-card)" }}
      tabIndex={isModal ? -1 : undefined}
    >
      {isModal && (
        <button
          aria-label="Close train checker"
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full transition-colors text-lg leading-none press-scale"
          onClick={onClose}
          style={{ backgroundColor: "var(--color-concrete)", color: "var(--color-outline)" }}
          type="button"
        >
          ×
        </button>
      )}

      <h2
        className="text-center mb-1 pr-8"
        id="train-checker-title"
        style={{ fontFamily: "var(--font-display)", fontSize: "24px", color: "var(--color-cream)", letterSpacing: "0.04em" }}
      >
        IS MY TRAIN FUCKED?
      </h2>
      <p className="text-xs text-center mb-5" id="train-checker-description" style={{ color: "var(--color-outline-variant)" }}>
        The only question that matters.
      </p>

      <div className="mb-4">
        <p className="text-xs mb-2 uppercase tracking-wider font-label" style={{ color: "var(--color-outline)" }}>
          Pick your line
        </p>
        <div className="flex flex-wrap gap-1.5 justify-center">
          {ALL_LINE_IDS.map((lineId) => (
            <button
              key={lineId}
              aria-label={`${lineId} train`}
              aria-pressed={selectedLine === lineId}
              className={`p-1.5 rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center press-scale ${
                selectedLine === lineId
                  ? "scale-110 ring-2 ring-white/40"
                  : selectedLine
                    ? "opacity-40 hover:opacity-70"
                    : "hover:scale-105"
              }`}
              onClick={() => handleLineSelect(lineId)}
              type="button"
            >
              <LineBadge lineId={lineId} size="sm" />
            </button>
          ))}
        </div>
      </div>

      {selectedLine && directions && (
        <div className="mb-4">
          <p className="text-xs mb-2 uppercase tracking-wider font-label" style={{ color: "var(--color-outline)" }}>
            Which direction? <span style={{ color: "var(--color-outline-variant)" }}>(optional)</span>
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {directions.map((directionLabel, index) => (
              <button
                key={directionLabel}
                aria-pressed={selectedDirection === index}
                className="px-5 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px] flex items-center press-scale"
                onClick={() => setSelectedDirection(selectedDirection === index ? null : index)}
                style={
                  selectedDirection === index
                    ? { backgroundColor: "var(--color-outline-variant)", border: "1px solid var(--color-outline)", color: "var(--color-cream)" }
                    : { backgroundColor: "var(--color-concrete)", border: "1px solid var(--color-outline-variant)", color: "var(--color-outline)" }
                }
                type="button"
              >
                {index === 0 ? "\u2191" : "\u2193"} {directionLabel}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedLine && (
        <div className="text-center mb-2">
          <button
            className="px-8 py-3 font-bold rounded-full text-sm transition-colors press-scale"
            onClick={handleCheck}
            style={{ backgroundColor: "var(--color-signal-red)", color: "var(--color-cream)", fontFamily: "var(--font-display)", fontSize: "16px", letterSpacing: "0.04em" }}
            type="button"
          >
            TELL ME THE TRUTH
          </button>
        </div>
      )}

      {showResult && verdict && (
        <div
          aria-live="polite"
          className={`mt-5 p-5 text-center ${verdict.isBad ? "verdict-shake" : "verdict-pulse-green"}`}
          key={animKey}
          style={
            verdict.isBad
              ? { backgroundColor: "rgba(232, 53, 58, 0.08)", border: "1px solid rgba(232, 53, 58, 0.2)" }
              : { backgroundColor: "rgba(34, 197, 94, 0.08)", border: "1px solid rgba(34, 197, 94, 0.2)" }
          }
        >
          <div className="text-4xl mb-3">
            {verdict.isBad ? "\uD83D\uDC80" : "\u2705"}
          </div>

          <p className="text-lg font-bold mb-2" style={{ color: verdict.isBad ? "var(--color-signal-red)" : "#22C55E" }}>
            {verdict.message}
          </p>

          {verdict.dailyScore > 0 && (
            <p className="text-sm mb-3" style={{ color: "var(--color-outline)" }}>
              The{" "}
              <span className="inline-flex items-center mx-0.5 align-middle">
                <LineBadge lineId={selectedLine} size="sm" />
              </span>
              {" "}has racked up <span className="font-bold" style={{ color: "var(--color-cream)", fontFamily: "var(--font-display)" }}>{verdict.dailyScore}</span> shame points today.
            </p>
          )}

          <button
            className="mt-1 mb-1 px-4 py-1.5 rounded-full text-xs font-medium transition-colors press-scale"
            onClick={handleShare}
            style={{ backgroundColor: "var(--color-outline-variant)", color: "var(--color-on-surface-variant)" }}
            type="button"
          >
            Share this verdict
          </button>
          <p aria-live="polite" className="text-[10px] min-h-4" style={{ color: "var(--color-outline-variant)" }}>
            {shareFeedback}
          </p>

          {relevantAlerts.length > 0 && verdict.isBad && (
            <div className="mt-3 space-y-1.5 text-left max-w-md mx-auto">
              <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--color-outline-variant)" }}>
                Here's why:
              </p>
              {relevantAlerts.map((alertLike, index) => {
                const alert = typeof alertLike === "string" ? { text: alertLike } : alertLike;
                const config = alert.category
                  ? (CATEGORY_CONFIG[alert.category] || CATEGORY_CONFIG.Other)
                  : null;

                return (
                  <div
                    className="text-xs rounded p-2 leading-relaxed"
                    key={index}
                    style={{ backgroundColor: "var(--color-surface)", color: "var(--color-outline)" }}
                  >
                    {config && (
                      <span
                        className="text-[9px] font-medium uppercase tracking-wider mr-1.5 px-1 py-0.5 rounded"
                        style={{ backgroundColor: `${config.color}20`, color: config.color }}
                      >
                        {config.label}
                      </span>
                    )}
                    <AlertText text={alert.text || alertLike} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (isModal) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center backdrop-blur-sm"
        onClick={(event) => {
          if (event.target === event.currentTarget) onClose?.();
        }}
        style={{ backgroundColor: "rgba(0, 0, 0, 0.75)" }}
      >
        <div className="max-h-[85vh] overflow-y-auto w-full sm:max-w-lg">
          {innerContent}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">
      {innerContent}
    </div>
  );
}
