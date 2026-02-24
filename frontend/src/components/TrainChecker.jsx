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
  "Your train is running fine. Enjoy it while it lasts.",
  "Somehow, it's not fucked. Mark your calendar.",
  "All clear. This is the MTA's version of a miracle.",
  "You're good — for now. Don't get comfortable.",
  "Shockingly, your train is behaving today.",
  "Nothing wrong. Screenshot this — nobody will believe you.",
];

const BAD_RESPONSES = [
  "Oh yeah, it's fucked.",
  "lol. lmao, even.",
  "Buddy, your train is having a day.",
  "RIP to your commute.",
  "Short answer: yes. Long answer: absolutely yes.",
  "The MTA has personally chosen violence against you today.",
  "You might want to consider a bike.",
  "Hope you weren't in a hurry.",
];

const DIRECTION_BAD_RESPONSES = [
  "That direction specifically? Extra fucked.",
  "Going that way? The MTA says no.",
  "That direction is cooked. Maybe try the other way?",
  "Your specific route is experiencing what we call 'a situation.'",
];

const DIRECTION_GOOD_OTHER_BAD = [
  "Your direction is fine but the other way is a mess. So... good luck getting home later.",
  "That direction is clear! Just don't plan on coming back the same way.",
  "You're fine going that way. Coming back? That's a different story.",
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

export default function TrainChecker({ lines }) {
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

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">
      <div className="bg-gray-900 rounded-2xl p-5 sm:p-6 border border-gray-800">
        <h2 className="text-xl sm:text-2xl font-black text-center mb-1 text-white">
          Is My Train Fucked?
        </h2>
        <p className="text-xs text-gray-600 text-center mb-5">
          The only question that matters.
        </p>

        {/* Line selector */}
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Pick your line</p>
          <div className="flex flex-wrap gap-1.5 justify-center">
            {ALL_LINES.flat().map(lineId => (
              <button
                key={lineId}
                onClick={() => handleLineSelect(lineId)}
                aria-label={`${lineId} train`}
                className={`p-1.5 rounded-full transition-all min-w-[44px] min-h-[44px] flex items-center justify-center ${
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
            <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Which direction? <span className="text-gray-700">(optional)</span></p>
            <div className="flex gap-2 justify-center">
              {directions.map((dir, i) => (
                <button
                  key={dir}
                  onClick={() => setSelectedDirection(selectedDirection === i ? null : i)}
                  className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all border min-h-[44px] flex items-center ${
                    selectedDirection === i
                      ? "bg-white/10 border-white/30 text-white"
                      : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-300"
                  }`}
                >
                  {i === 0 ? "↑" : "↓"} {dir}
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
              className="px-8 py-3 bg-white text-black font-bold rounded-full text-sm hover:bg-gray-200 transition-colors active:scale-95"
            >
              Tell me the truth
            </button>
          </div>
        )}

        {/* Verdict */}
        {showResult && verdict && (
          <div
            key={animKey}
            className={`mt-5 rounded-xl p-5 text-center border ${
              verdict.isBad
                ? "bg-red-950/30 border-red-900/40 verdict-shake"
                : "bg-green-950/30 border-green-900/40 verdict-pulse-green"
            }`}
          >
            {/* Icon */}
            <div className="text-4xl mb-3">
              {verdict.isBad ? "💀" : "✅"}
            </div>

            {/* Verdict text */}
            <p className={`text-lg font-bold mb-2 ${
              verdict.isBad ? "text-red-400" : "text-green-400"
            }`}>
              {verdict.message}
            </p>

            {/* Score */}
            {verdict.score > 0 && (
              <p className="text-sm text-gray-500 mb-3">
                The{" "}
                <span className="inline-flex items-center mx-0.5 align-middle">
                  <LineBadge lineId={selectedLine} size="sm" />
                </span>
                {" "}has racked up <span className="font-bold text-white">{verdict.score}</span> shame points today.
              </p>
            )}

            {/* Share button */}
            <button
              onClick={handleShare}
              className="mt-1 mb-3 px-4 py-1.5 rounded-full text-xs font-medium bg-white/10 hover:bg-white/20 text-gray-300 transition-colors"
            >
              Share this verdict
            </button>

            {/* Relevant alerts */}
            {relevantAlerts.length > 0 && verdict.isBad && (
              <div className="mt-3 space-y-1.5 text-left max-w-md mx-auto">
                <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-1">Here's why:</p>
                {relevantAlerts.map((alert, i) => {
                  const a = typeof alert === "string" ? { text: alert } : alert;
                  const cfg = a.category ? (CATEGORY_CONFIG[a.category] || CATEGORY_CONFIG["Other"]) : null;
                  return (
                    <div
                      key={i}
                      className="text-xs text-gray-400 bg-gray-950/60 rounded p-2 leading-relaxed"
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
    </div>
  );
}
