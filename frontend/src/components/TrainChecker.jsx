import { useState, useMemo, useEffect, useCallback } from "react";
import { LINE_COLORS, LINE_DIRECTIONS, getScoreTier, CATEGORY_CONFIG, CATEGORY_ORDER } from "../constants/lines";
import LineBadge from "./LineBadge";
import AlertText from "./AlertText";

const ALL_LINES = [
  ["1","2","3"],
  ["4","5","6"],
  ["7"],
  ["A","C","E"],
  ["B","D","F","M"],
  ["N","Q","R","W"],
  ["G"],
  ["J","Z"],
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
  "There are issues on this line today.",
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

// Parse hash into { line, dir } — dir is 0 (uptown) or 1 (downtown) or null
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

export default function TrainChecker({ lines, isModal = false, onClose }) {
  const [selectedLine, setSelectedLine] = useState(null);
  const [selectedDirection, setSelectedDirection] = useState(null);
  const [verdict, setVerdict] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [animKey, setAnimKey] = useState(0); // increment to re-trigger animation

  // On mount: restore state from URL hash
  useEffect(() => {
    const { line, dir } = parseHash();
    if (line) {
      setSelectedLine(line);
      if (dir !== null) setSelectedDirection(dir);
    }

    // Listen for back/forward navigation
    const onHashChange = () => {
      const { line: l, dir: d } = parseHash();
      setSelectedLine(l);
      setSelectedDirection(d !== null ? d : null);
      setVerdict(null);
      setShowResult(false);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  // Update hash when selection changes
  useEffect(() => {
    if (!selectedLine) {
      history.replaceState(null, "", window.location.pathname);
      return;
    }
    const dirStr = selectedDirection === 0 ? "uptown" : selectedDirection === 1 ? "downtown" : null;
    const hash = dirStr ? `#line=${selectedLine}&dir=${dirStr}` : `#line=${selectedLine}`;
    history.replaceState(null, "", hash);
  }, [selectedLine, selectedDirection]);

  const directions = useMemo(() => {
    if (!selectedLine) return null;
    return LINE_DIRECTIONS[selectedLine] || ["Uptown", "Downtown"];
  }, [selectedLine]);

  const lineData = useMemo(() => {
    if (!selectedLine || !lines) return null;
    return lines.find(l => l.id === selectedLine);
  }, [selectedLine, lines]);

  function handleLineSelect(lineId) {
    setSelectedLine(lineId);
    setSelectedDirection(null);
    setVerdict(null);
    setShowResult(false);
  }

  function handleCheck() {
    if (!lineData) return;

    const dailyScore = lineData.daily_score || 0;
    const byDir = lineData.by_direction || {};
    const dirKey = selectedDirection === 0 ? "uptown" : selectedDirection === 1 ? "downtown" : null;

    let message, isBad;

    if (dailyScore === 0) {
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

    setVerdict({ message, isBad, score: dailyScore });
    setShowResult(true);
    setAnimKey(k => k + 1); // re-trigger animation on each check
  }

  const handleShare = useCallback(() => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: "Is My Train Fucked?", url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => {
        alert("Link copied!");
      });
    }
  }, []);

  // Get relevant alerts for the selected direction
  const relevantAlerts = useMemo(() => {
    if (!lineData || !lineData.alerts) return [];
    if (selectedDirection === null) return lineData.alerts;

    const dirKey = selectedDirection === 0 ? "uptown" : "downtown";
    return lineData.alerts.filter(a => {
      const alert = typeof a === "string" ? { text: a } : a;
      return !alert.direction || alert.direction === dirKey || alert.direction === "both";
    });
  }, [lineData, selectedDirection]);

  const innerContent = (
    <div className="rounded-2xl p-5 sm:p-6 relative" style={{ backgroundColor: '#1A1A1A', boxShadow: 'var(--shadow-card)' }}>
      {/* Close button (only in modal mode) */}
      {isModal && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full transition-colors text-lg leading-none press-scale"
          style={{ backgroundColor: '#2A2A2A', color: 'rgba(245, 240, 232, 0.4)' }}
          aria-label="Close"
        >
          ×
        </button>
      )}

      <h2
        className="text-center mb-1 pr-8"
        style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: '#F5F0E8', letterSpacing: '0.04em' }}
      >
        IS MY TRAIN FUCKED?
      </h2>
      <p className="text-xs text-center mb-5" style={{ color: 'rgba(245, 240, 232, 0.25)' }}>
        The only question that matters.
      </p>

      {/* Line selector */}
      <div className="mb-4">
        <p className="text-xs mb-2 uppercase tracking-wider" style={{ color: 'rgba(245, 240, 232, 0.3)' }}>Pick your line</p>
        <div className="flex flex-wrap gap-1.5 justify-center">
          {ALL_LINES.flat().map(lineId => (
            <button
              key={lineId}
              onClick={() => handleLineSelect(lineId)}
              aria-label={`${lineId} train`}
              className={`p-1.5 rounded-full transition-all min-w-[44px] min-h-[44px] flex items-center justify-center press-scale ${
                selectedLine === lineId
                  ? "scale-110 ring-2 ring-white/40"
                  : selectedLine
                    ? "opacity-40 hover:opacity-70"
                    : "hover:scale-105"
              }`}
            >
              <LineBadge lineId={lineId} size="sm" />
            </button>
          ))}
        </div>
      </div>

      {/* Direction selector — appears after line is picked */}
      {selectedLine && directions && (
        <div className="mb-4">
          <p className="text-xs mb-2 uppercase tracking-wider" style={{ color: 'rgba(245, 240, 232, 0.3)' }}>
            Which direction? <span style={{ color: 'rgba(245, 240, 232, 0.15)' }}>(optional)</span>
          </p>
          <div className="flex gap-2 justify-center">
            {directions.map((dir, i) => (
              <button
                key={dir}
                onClick={() => setSelectedDirection(selectedDirection === i ? null : i)}
                className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all min-h-[44px] flex items-center press-scale`}
                style={
                  selectedDirection === i
                    ? { backgroundColor: 'rgba(245, 240, 232, 0.1)', border: '1px solid rgba(245, 240, 232, 0.3)', color: '#F5F0E8' }
                    : { backgroundColor: '#2A2A2A', border: '1px solid rgba(245, 240, 232, 0.08)', color: 'rgba(245, 240, 232, 0.4)' }
                }
              >
                {i === 0 ? "\u2191" : "\u2193"} {dir}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Check button */}
      {selectedLine && (
        <div className="text-center mb-2">
          <button
            onClick={handleCheck}
            className="px-8 py-3 font-bold rounded-full text-sm transition-colors press-scale"
            style={{ backgroundColor: '#E8353A', color: '#F5F0E8', fontFamily: 'var(--font-display)', fontSize: '16px', letterSpacing: '0.04em' }}
          >
            TELL ME THE TRUTH
          </button>
        </div>
      )}

      {/* Verdict */}
      {showResult && verdict && (
        <div
          key={animKey}
          className={`mt-5 rounded-xl p-5 text-center ${
            verdict.isBad ? "verdict-shake" : "verdict-pulse-green"
          }`}
          style={
            verdict.isBad
              ? { backgroundColor: 'rgba(232, 53, 58, 0.08)', border: '1px solid rgba(232, 53, 58, 0.2)' }
              : { backgroundColor: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.2)' }
          }
        >
          {/* Icon */}
          <div className="text-4xl mb-3">
            {verdict.isBad ? "\uD83D\uDC80" : "\u2705"}
          </div>

          {/* Verdict text */}
          <p className="text-lg font-bold mb-2" style={{ color: verdict.isBad ? '#E8353A' : '#22C55E' }}>
            {verdict.message}
          </p>

          {/* Score */}
          {verdict.score > 0 && (
            <p className="text-sm mb-3" style={{ color: 'rgba(245, 240, 232, 0.3)' }}>
              The{" "}
              <span className="inline-flex items-center mx-0.5 align-middle">
                <LineBadge lineId={selectedLine} size="sm" />
              </span>
              {" "}has racked up <span className="font-bold" style={{ color: '#F5F0E8', fontFamily: 'var(--font-display)' }}>{verdict.score}</span> shame points today.
            </p>
          )}

          {/* Share button */}
          <button
            onClick={handleShare}
            className="mt-1 mb-3 px-4 py-1.5 rounded-full text-xs font-medium transition-colors press-scale"
            style={{ backgroundColor: 'rgba(245, 240, 232, 0.1)', color: 'rgba(245, 240, 232, 0.5)' }}
          >
            Share this verdict
          </button>

          {/* Relevant alerts */}
          {relevantAlerts.length > 0 && verdict.isBad && (
            <div className="mt-3 space-y-1.5 text-left max-w-md mx-auto">
              <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'rgba(245, 240, 232, 0.2)' }}>Here's why:</p>
              {relevantAlerts.map((alert, i) => {
                const a = typeof alert === "string" ? { text: alert } : alert;
                const cfg = a.category ? (CATEGORY_CONFIG[a.category] || CATEGORY_CONFIG["Other"]) : null;
                return (
                  <div
                    key={i}
                    className="text-xs rounded p-2 leading-relaxed"
                    style={{ backgroundColor: 'rgba(10, 10, 10, 0.6)', color: 'rgba(245, 240, 232, 0.4)' }}
                  >
                    {cfg && (
                      <span
                        className="text-[9px] font-medium uppercase tracking-wider mr-1.5 px-1 py-0.5 rounded"
                        style={{ backgroundColor: `${cfg.color}20`, color: cfg.color }}
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
  );

  if (isModal) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center backdrop-blur-sm"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
      >
        <div className="rounded-t-2xl sm:rounded-2xl max-h-[85vh] overflow-y-auto w-full sm:max-w-lg">
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
