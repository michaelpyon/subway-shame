import { useState } from "react";
import {
  LINE_COLORS,
  getScoreTier,
  CATEGORY_CONFIG,
  CATEGORY_ORDER,
  LINE_DIRECTIONS,
} from "../constants/lines";
import LineBadge from "./LineBadge";
import AlertText from "./AlertText";

function BreakdownBar({ breakdown, total }) {
  if (!breakdown || total <= 0) return null;

  const sorted = CATEGORY_ORDER.filter((cat) => breakdown[cat] > 0);
  if (sorted.length === 0) return null;

  return (
    <div className="space-y-1.5">
      {/* Stacked bar */}
      <div className="h-3 rounded-full overflow-hidden flex bg-gray-800">
        {sorted.map((cat) => {
          const pts = breakdown[cat];
          const pct = (pts / total) * 100;
          const cfg = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG["Other"];
          return (
            <div
              key={cat}
              className="h-full transition-all"
              style={{
                width: `${Math.max(pct, 4)}%`,
                backgroundColor: cfg.color,
              }}
              title={`${cfg.label}: ${pts} pts`}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {sorted.map((cat) => {
          const pts = breakdown[cat];
          const cfg = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG["Other"];
          return (
            <span key={cat} className="text-[11px] flex items-center gap-1">
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ backgroundColor: cfg.color }}
              />
              <span className="text-gray-400">{cfg.label}</span>
              <span className="text-gray-600">{pts}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

function DirectionSplit({ byDirection, lineId }) {
  const dirs = LINE_DIRECTIONS[lineId] || ["Uptown", "Downtown"];
  const up = byDirection?.uptown || { score: 0, breakdown: {} };
  const down = byDirection?.downtown || { score: 0, breakdown: {} };

  if (up.score === 0 && down.score === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-2">
      <DirectionColumn label={dirs[0]} arrow="↑" data={up} />
      <DirectionColumn label={dirs[1]} arrow="↓" data={down} />
    </div>
  );
}

function DirectionColumn({ label, arrow, data }) {
  const sorted = CATEGORY_ORDER.filter(
    (cat) => data.breakdown[cat] && data.breakdown[cat] > 0
  );

  return (
    <div className="bg-gray-950 rounded-lg p-2.5">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] text-gray-500">
          {arrow} {label}
        </span>
        <span
          className={`text-sm font-bold tabular-nums ${
            data.score > 0 ? "text-white" : "text-gray-700"
          }`}
        >
          {data.score}
        </span>
      </div>
      {sorted.length > 0 && (
        <div className="space-y-0.5">
          {sorted.map((cat) => {
            const cfg = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG["Other"];
            return (
              <div
                key={cat}
                className="flex items-center justify-between text-[10px]"
              >
                <span className="flex items-center gap-1">
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: cfg.color }}
                  />
                  <span className="text-gray-500">{cfg.label}</span>
                </span>
                <span className="text-gray-600">{data.breakdown[cat]}</span>
              </div>
            );
          })}
        </div>
      )}
      {sorted.length === 0 && (
        <span className="text-[10px] text-gray-700">No issues</span>
      )}
    </div>
  );
}

export default function SubwayLineCard({ line }) {
  const [expanded, setExpanded] = useState(false);
  const color = LINE_COLORS[line.id] || "#808183";
  const dailyScore = line.daily_score || 0;
  const tier = getScoreTier(dailyScore);
  const hasContent = dailyScore > 0;

  return (
    <div
      className="bg-gray-900 rounded-lg overflow-hidden cursor-pointer hover:bg-gray-800/80 transition-colors"
      style={{ borderLeft: `4px solid ${color}` }}
      onClick={() => hasContent && setExpanded(!expanded)}
    >
      <div className="p-4 flex items-center gap-3">
        <LineBadge lineId={line.id} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">
              {line.id === "SI" ? "SIR" : `${line.id} Train`}
            </span>
            {line.trip_count > 0 && (
              <span className="text-xs text-gray-500">
                {line.trip_count} trains
              </span>
            )}
          </div>
          <span className="text-sm" style={{ color: tier.color }}>
            {dailyScore > 0 ? line.status : "Good Service"}
          </span>
        </div>
        <div className="text-right flex items-center gap-1.5 shrink-0">
          {dailyScore > 0 && (
            <>
              <span className="text-base">{tier.emoji}</span>
              <div className="text-right">
                <span
                  className="text-xl font-black tabular-nums block leading-none"
                  style={{ color: tier.color }}
                >
                  {dailyScore}
                </span>
                <span
                  className="text-[9px] font-semibold uppercase tracking-wide"
                  style={{ color: `${tier.color}90` }}
                >
                  {tier.label}
                </span>
              </div>
            </>
          )}
          {dailyScore === 0 && (
            <div className="text-right">
              <span className="text-green-500 text-lg">✓</span>
              <span className="text-[9px] font-semibold uppercase tracking-wide text-green-700 block">
                On time
              </span>
            </div>
          )}
        </div>
        {hasContent && (
          <svg
            className={`w-4 h-4 text-gray-500 transition-transform ${
              expanded ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        )}
      </div>

      {expanded && hasContent && (
        <div className="px-4 pb-4 space-y-3">
          {/* Score breakdown bar */}
          <BreakdownBar breakdown={line.breakdown} total={dailyScore} />

          {/* Direction split */}
          <DirectionSplit byDirection={line.by_direction} lineId={line.id} />

          {/* Alert texts */}
          {line.alerts && line.alerts.length > 0 && (
            <div className="space-y-1.5 pt-1">
              {line.alerts.map((alert, i) => {
                const a = typeof alert === "string" ? { text: alert } : alert;
                const cfg = CATEGORY_CONFIG[a.category] || CATEGORY_CONFIG["Other"];
                return (
                  <div
                    key={i}
                    className="text-sm text-gray-400 bg-gray-950 rounded p-2.5 leading-relaxed"
                  >
                    {a.category && (
                      <span
                        className="text-[10px] font-medium uppercase tracking-wider mr-2 px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: `${cfg.color}20`,
                          color: cfg.color,
                        }}
                      >
                        {cfg.label}
                      </span>
                    )}
                    {a.direction && a.direction !== "both" && (
                      <span className="text-[10px] text-gray-600 mr-2">
                        {a.direction === "uptown" ? "↑" : "↓"} {a.direction}
                      </span>
                    )}
                    <span className="text-gray-400"><AlertText text={a.text} /></span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
