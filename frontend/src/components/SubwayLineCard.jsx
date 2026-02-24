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
              <span className="text-gray-500">{pts} pts</span>
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
        <div className="text-right">
          <span
            className={`text-sm font-bold tabular-nums ${
              data.score > 0 ? "text-white" : "text-gray-700"
            }`}
          >
            {data.score}
          </span>
          {data.score > 0 && (
            <span className="text-[9px] text-gray-600 ml-0.5">pts</span>
          )}
        </div>
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
                <span className="text-gray-600">{data.breakdown[cat]} pts</span>
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

export default function SubwayLineCard({ line, rank = null, maxScore = 1 }) {
  const [expanded, setExpanded] = useState(false);
  const color = LINE_COLORS[line.id] || "#808183";
  const dailyScore = line.daily_score || 0;
  const liveScore = line.score || 0;
  const tier = getScoreTier(dailyScore);
  const hasContent = dailyScore > 0;
  const scorePercent = maxScore > 0 ? (dailyScore / maxScore) * 100 : 0;

  return (
    <div
      className={`bg-gray-900 rounded-lg overflow-hidden transition-colors relative ${
        hasContent ? "cursor-pointer hover:bg-gray-800/80" : ""
      }`}
      style={{ borderLeft: `4px solid ${color}` }}
      onClick={() => hasContent && setExpanded(!expanded)}
      role={hasContent ? "button" : undefined}
      aria-expanded={hasContent ? expanded : undefined}
    >
      {/* Relative score background bar */}
      {dailyScore > 0 && (
        <div
          className="absolute inset-y-0 left-0 opacity-[0.07] pointer-events-none transition-all duration-500"
          style={{
            width: `${scorePercent}%`,
            background: `linear-gradient(90deg, ${color}, transparent)`,
          }}
        />
      )}
      <div className="p-4 flex items-center gap-3">
        {/* Rank column — left side, only visible for top 3 */}
        <div className="w-6 shrink-0 text-center">
          {rank !== null && rank <= 3 && dailyScore > 0 && (
            <span
              className="text-xs font-black leading-none"
              style={{
                color: rank === 1 ? "#EF4444" : rank === 2 ? "#F97316" : "#EAB308",
              }}
            >
              #{rank}
            </span>
          )}
        </div>
        <LineBadge lineId={line.id} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-white">
              {line.id === "SI" ? "SIR" : `${line.id} Train`}
            </span>
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
                <div className="flex items-baseline gap-0.5 justify-end">
                  <span
                    className="text-xl font-black tabular-nums leading-none"
                    style={{ color: tier.color }}
                  >
                    {dailyScore}
                  </span>
                  <span
                    className="text-[9px] font-medium"
                    style={{ color: `${tier.color}80` }}
                  >
                    pts
                  </span>
                </div>
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
            className={`w-4 h-4 text-gray-500 transition-transform shrink-0 ${
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

      {/* Tap-to-expand hint — only when not expanded */}
      {hasContent && !expanded && (
        <div className="px-4 pb-2 flex items-center gap-1 text-[10px] text-gray-700">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          <span>Tap to see breakdown &amp; alerts</span>
        </div>
      )}

      {expanded && hasContent && (
        <div className="px-4 pb-4 space-y-3">
          {/* Live vs daily context */}
          {liveScore > 0 && (
            <div className="flex items-center justify-between text-xs text-gray-600 bg-gray-950/50 rounded-lg px-3 py-2">
              <span>🔴 Live (right now)</span>
              <span className="font-bold text-gray-400">{liveScore} pts this snapshot</span>
            </div>
          )}

          {/* Score breakdown bar */}
          <div>
            <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-1.5">Today's breakdown</p>
            <BreakdownBar breakdown={line.breakdown} total={dailyScore} />
          </div>

          {/* Direction split */}
          {line.by_direction && (
            <div>
              <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-1.5">By direction</p>
              <DirectionSplit byDirection={line.by_direction} lineId={line.id} />
            </div>
          )}

          {/* Alert texts */}
          {line.alerts && line.alerts.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] text-gray-600 uppercase tracking-wider">Current alerts</p>
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

          {/* Peak alerts — show if no current alerts */}
          {(!line.alerts || line.alerts.length === 0) && line.peak_alerts && line.peak_alerts.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] text-gray-600 uppercase tracking-wider">Earlier today (resolved)</p>
              {line.peak_alerts.map((alert, i) => {
                const a = typeof alert === "string" ? { text: alert } : alert;
                const cfg = CATEGORY_CONFIG[a.category] || CATEGORY_CONFIG["Other"];
                return (
                  <div
                    key={i}
                    className="text-sm text-gray-500 bg-gray-950/50 rounded p-2.5 leading-relaxed border border-gray-800/50"
                  >
                    {a.category && (
                      <span
                        className="text-[10px] font-medium uppercase tracking-wider mr-2 px-1.5 py-0.5 rounded opacity-60"
                        style={{
                          backgroundColor: `${cfg.color}20`,
                          color: cfg.color,
                        }}
                      >
                        {cfg.label}
                      </span>
                    )}
                    <span className="text-gray-500"><AlertText text={a.text} /></span>
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
