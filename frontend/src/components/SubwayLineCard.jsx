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
import Sparkline from "./Sparkline";

function BreakdownBar({ breakdown, total }) {
  if (!breakdown || total <= 0) return null;

  const sorted = CATEGORY_ORDER.filter((cat) => breakdown[cat] > 0);
  if (sorted.length === 0) return null;

  return (
    <div className="space-y-1.5">
      {/* Stacked bar */}
      <div className="h-3 rounded-full overflow-hidden flex" style={{ backgroundColor: '#2A2A2A' }}>
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
              <span style={{ color: 'rgba(245, 240, 232, 0.45)' }}>{cfg.label}</span>
              <span style={{ color: 'rgba(245, 240, 232, 0.3)', fontFamily: 'var(--font-mono)' }}>{pts} pts</span>
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
    <div className="rounded-lg p-2.5" style={{ backgroundColor: '#0A0A0A' }}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px]" style={{ color: 'rgba(245, 240, 232, 0.3)' }}>
          {arrow} {label}
        </span>
        <div className="text-right">
          <span
            className="text-sm font-bold tabular-nums"
            style={{
              fontFamily: 'var(--font-display)',
              letterSpacing: '-0.04em',
              color: data.score > 0 ? '#F5F0E8' : 'rgba(245, 240, 232, 0.2)',
            }}
          >
            {data.score}
          </span>
          {data.score > 0 && (
            <span className="text-[9px] ml-0.5" style={{ color: 'rgba(245, 240, 232, 0.3)', fontFamily: 'var(--font-mono)' }}>pts</span>
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
                  <span style={{ color: 'rgba(245, 240, 232, 0.3)' }}>{cfg.label}</span>
                </span>
                <span style={{ color: 'rgba(245, 240, 232, 0.25)', fontFamily: 'var(--font-mono)' }}>{data.breakdown[cat]} pts</span>
              </div>
            );
          })}
        </div>
      )}
      {sorted.length === 0 && (
        <span className="text-[10px]" style={{ color: 'rgba(245, 240, 232, 0.15)' }}>No issues</span>
      )}
    </div>
  );
}

export default function SubwayLineCard({ line, rank = null, maxScore = 1, sparkData = null, record = null }) {
  const [expanded, setExpanded] = useState(false);
  const color = LINE_COLORS[line.id] || "#808183";
  const dailyScore = line.daily_score || 0;
  const liveScore = line.score || 0;
  const tier = getScoreTier(dailyScore);
  const hasContent = dailyScore > 0;
  const scorePercent = maxScore > 0 ? (dailyScore / maxScore) * 100 : 0;

  const statusText =
    dailyScore === 0
      ? "Good Service"
      : liveScore > 0
      ? line.status
      : "Issues earlier today";

  return (
    <div
      className={`rounded-xl overflow-hidden transition-shadow relative ${
        hasContent ? "cursor-pointer" : ""
      }`}
      style={{
        backgroundColor: '#1A1A1A',
        boxShadow: 'var(--shadow-card)',
        borderLeft: `3px solid ${hasContent ? color : 'rgba(245, 240, 232, 0.06)'}`,
      }}
      onMouseEnter={(e) => hasContent && (e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)')}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'var(--shadow-card)')}
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
        {/* Rank column */}
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
            <span className="font-semibold" style={{ color: '#F5F0E8' }}>
              {line.id === "SI" ? "SIR" : `${line.id} Train`}
            </span>
          </div>
          <span className="text-sm" style={{ color: liveScore === 0 && dailyScore > 0 ? "#9CA3AF" : tier.color }}>
            {statusText}
          </span>
          {/* Interruption badges */}
          {hasContent && line.breakdown && (
            <div className="flex flex-wrap gap-1 mt-1">
              {CATEGORY_ORDER.filter((cat) => (line.breakdown[cat] || 0) > 0).map((cat) => {
                const cfg = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG["Other"];
                return (
                  <span
                    key={cat}
                    className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: `${cfg.color}20`, color: cfg.color }}
                  >
                    {cfg.icon} {cfg.label}
                  </span>
                );
              })}
            </div>
          )}
        </div>
        <div className="text-right flex items-center gap-1.5 shrink-0">
          {/* Sparkline */}
          {!expanded && sparkData && sparkData.length >= 2 && (
            <Sparkline data={sparkData} color={color} />
          )}
          {dailyScore > 0 && (
            <>
              <span className="text-base">{tier.emoji}</span>
              <div className="text-right">
                <div className="flex items-baseline gap-0.5 justify-end">
                  <span
                    className="text-xl font-black tabular-nums leading-none"
                    style={{ color: tier.color, fontFamily: 'var(--font-display)', letterSpacing: '-0.04em' }}
                  >
                    {dailyScore.toLocaleString()}
                  </span>
                  <span
                    className="text-[9px] font-medium"
                    style={{ color: `${tier.color}80`, fontFamily: 'var(--font-mono)' }}
                  >
                    pts
                  </span>
                </div>
                <div className="flex items-center justify-end gap-1">
                  {/* Severity label as styled pill */}
                  <span className={`severity-label ${tier.severityClass}`}>
                    {tier.label.toUpperCase()}
                  </span>
                  {/* Record badge */}
                  {record && dailyScore >= record.worst_score && (
                    <span
                      className="text-[9px] font-bold px-1 py-0.5 rounded"
                      style={{ backgroundColor: "#7f1d1d", color: "#fca5a5" }}
                      title={`Worst score in the last ${record.days_back} day${record.days_back !== 1 ? "s" : ""}`}
                    >
                      worst in {record.days_back}d
                    </span>
                  )}
                </div>
                {/* Top-2 category pts breakdown */}
                {line.breakdown && (() => {
                  const topCats = CATEGORY_ORDER
                    .filter((cat) => (line.breakdown[cat] || 0) > 0)
                    .sort((a, b) => (line.breakdown[b] || 0) - (line.breakdown[a] || 0))
                    .slice(0, 2);
                  return topCats.length > 0 ? (
                    <div className="mt-0.5">
                      {topCats.map((cat) => {
                        const cfg = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG["Other"];
                        const totalPts = line.breakdown[cat];
                        return (
                          <div key={cat} className="text-[9px] text-right" style={{ color: 'rgba(245, 240, 232, 0.25)', fontFamily: 'var(--font-mono)' }}>
                            {cfg.label} +{totalPts}pts
                          </div>
                        );
                      })}
                    </div>
                  ) : null;
                })()}
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
            className={`w-4 h-4 transition-transform shrink-0 ${
              expanded ? "rotate-180" : ""
            }`}
            style={{ color: 'rgba(245, 240, 232, 0.3)' }}
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
          {/* Live vs daily context */}
          {liveScore > 0 && (
            <div className="flex items-center justify-between text-xs rounded-lg px-3 py-2" style={{ backgroundColor: 'rgba(10, 10, 10, 0.5)', color: 'rgba(245, 240, 232, 0.35)' }}>
              <span>🔴 Live (right now)</span>
              <span className="font-bold" style={{ color: 'rgba(245, 240, 232, 0.5)', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>{liveScore.toLocaleString()} pts this snapshot</span>
            </div>
          )}

          {/* Score breakdown bar */}
          <div>
            <p className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: 'rgba(245, 240, 232, 0.25)' }}>Today's breakdown</p>
            <BreakdownBar breakdown={line.breakdown} total={dailyScore} />
          </div>

          {/* Direction split */}
          {line.by_direction && (
            <div>
              <p className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: 'rgba(245, 240, 232, 0.25)' }}>By direction</p>
              <DirectionSplit byDirection={line.by_direction} lineId={line.id} />
            </div>
          )}

          {/* Alert texts */}
          {line.alerts && line.alerts.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] uppercase tracking-wider" style={{ color: 'rgba(245, 240, 232, 0.25)' }}>Current alerts</p>
              {line.alerts.map((alert, i) => {
                const a = typeof alert === "string" ? { text: alert } : alert;
                const cfg = CATEGORY_CONFIG[a.category] || CATEGORY_CONFIG["Other"];
                return (
                  <div
                    key={i}
                    className="text-sm rounded-lg p-2.5 leading-relaxed"
                    style={{ backgroundColor: '#0A0A0A', color: 'rgba(245, 240, 232, 0.5)' }}
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
                      <span className="text-[10px] mr-2" style={{ color: 'rgba(245, 240, 232, 0.25)' }}>
                        {a.direction === "uptown" ? "↑" : "↓"} {a.direction}
                      </span>
                    )}
                    <span style={{ color: 'rgba(245, 240, 232, 0.5)' }}><AlertText text={a.text} /></span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Peak alerts */}
          {(!line.alerts || line.alerts.length === 0) && line.peak_alerts && line.peak_alerts.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] uppercase tracking-wider" style={{ color: 'rgba(245, 240, 232, 0.25)' }}>Earlier today (resolved)</p>
              {line.peak_alerts.map((alert, i) => {
                const a = typeof alert === "string" ? { text: alert } : alert;
                const cfg = CATEGORY_CONFIG[a.category] || CATEGORY_CONFIG["Other"];
                return (
                  <div
                    key={i}
                    className="text-sm rounded-lg p-2.5 leading-relaxed"
                    style={{ backgroundColor: 'rgba(10, 10, 10, 0.5)', border: '1px solid rgba(245, 240, 232, 0.06)', color: 'rgba(245, 240, 232, 0.35)' }}
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
                    <span style={{ color: 'rgba(245, 240, 232, 0.35)' }}><AlertText text={a.text} /></span>
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
