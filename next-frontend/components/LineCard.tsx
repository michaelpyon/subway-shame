"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import SubwayBullet from "./SubwayBullet";
import { SubwayLine } from "@/lib/types";
import { LINE_ROUTES, CATEGORY_CONFIG, CATEGORY_ORDER } from "@/lib/constants";

interface LineCardProps {
  line: SubwayLine;
  rank: number;
}

function WowDelta({ score }: { score: number }) {
  // Simulate a WoW delta (in real app, backend would provide this)
  const delta = Math.round(score * (Math.random() * 0.4 - 0.1));
  if (delta === 0) return null;

  const isWorse = delta > 0;
  return (
    <span
      className={`text-xs font-mono ${
        isWorse ? "text-red-400" : "text-green-400"
      }`}
    >
      {isWorse ? "\u25B2" : "\u25BC"} {Math.abs(delta)}
    </span>
  );
}

function BreakdownBar({
  category,
  points,
  maxPoints,
}: {
  category: string;
  points: number;
  maxPoints: number;
}) {
  const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG["Other"];
  const pct = maxPoints > 0 ? (points / maxPoints) * 100 : 0;

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-28 text-zinc-400 text-xs truncate">
        {config.label}
      </span>
      <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: config.color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
      <span className="w-12 text-right text-xs tabular-nums text-zinc-400">
        {points}
      </span>
    </div>
  );
}

export default function LineCard({ line, rank }: LineCardProps) {
  const [expanded, setExpanded] = useState(false);
  const prefersReduced = useReducedMotion();
  const isClean = line.daily_score === 0;
  const route = LINE_ROUTES[line.id] || "";

  // Sort breakdown categories by severity order, filter out zeros
  const breakdownEntries = CATEGORY_ORDER.filter(
    (cat) => (line.breakdown[cat] || 0) > 0
  ).map((cat) => ({
    category: cat,
    points: line.breakdown[cat],
  }));

  const maxPoints = Math.max(...breakdownEntries.map((e) => e.points), 1);

  return (
    <motion.div
      className="group"
      initial={prefersReduced ? {} : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * rank, duration: 0.3 }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
        aria-expanded={expanded}
        aria-label={`${line.id} train, rank ${rank}, shame score ${line.daily_score}. ${expanded ? "Collapse" : "Expand"} details.`}
      >
        {/* Rank number */}
        <span className="w-6 text-right text-sm tabular-nums text-zinc-500 font-mono">
          {isClean ? "" : rank}
        </span>

        {/* Bullet */}
        <SubwayBullet line={line.id} size="sm" />

        {/* Line info */}
        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm">
              {line.id} Train
            </span>
            <span className="text-xs text-zinc-500 truncate hidden sm:inline">
              {route}
            </span>
          </div>
          {line.alerts.length > 0 && (
            <p className="text-xs text-zinc-500 truncate mt-0.5">
              {line.alerts[0].text}
            </p>
          )}
        </div>

        {/* Score + delta */}
        <div className="flex items-center gap-2 shrink-0">
          {isClean ? (
            <span className="text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
              Clean
            </span>
          ) : (
            <>
              <WowDelta score={line.daily_score} />
              <span className="text-sm font-black tabular-nums">
                {line.daily_score.toLocaleString()}
              </span>
            </>
          )}
        </div>

        {/* Chevron */}
        <motion.svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className="text-zinc-500 shrink-0"
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <path
            d="M4 6L8 10L12 6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </motion.svg>
      </button>

      {/* Expanded details (the receipts) */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: prefersReduced ? 0 : 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 ml-9 border-l border-white/5">
              {/* Score breakdown */}
              {breakdownEntries.length > 0 && (
                <div className="mt-3 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                    The Receipts
                  </h4>
                  {breakdownEntries.map((entry) => (
                    <BreakdownBar
                      key={entry.category}
                      category={entry.category}
                      points={entry.points}
                      maxPoints={maxPoints}
                    />
                  ))}
                </div>
              )}

              {/* Active alerts */}
              {line.alerts.length > 0 && (
                <div className="mt-4 space-y-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Active Alerts
                  </h4>
                  {line.alerts.map((alert, i) => (
                    <div
                      key={i}
                      className="text-xs text-zinc-400 flex items-start gap-2"
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                        style={{
                          backgroundColor:
                            CATEGORY_CONFIG[alert.category]?.color || "#9CA3AF",
                        }}
                      />
                      {alert.text}
                    </div>
                  ))}
                </div>
              )}

              {/* Direction breakdown */}
              {line.daily_score > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="bg-white/[0.02] rounded-lg px-3 py-2">
                    <span className="text-[10px] uppercase tracking-wider text-zinc-500">
                      Uptown
                    </span>
                    <p className="text-sm font-bold tabular-nums mt-0.5">
                      {line.by_direction.uptown.score.toLocaleString()} pts
                    </p>
                  </div>
                  <div className="bg-white/[0.02] rounded-lg px-3 py-2">
                    <span className="text-[10px] uppercase tracking-wider text-zinc-500">
                      Downtown
                    </span>
                    <p className="text-sm font-bold tabular-nums mt-0.5">
                      {line.by_direction.downtown.score.toLocaleString()} pts
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
