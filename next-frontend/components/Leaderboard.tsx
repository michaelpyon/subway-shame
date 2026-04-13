"use client";

import { motion, useReducedMotion } from "framer-motion";
import LineCard from "./LineCard";
import ConfettiEffect from "./ConfettiEffect";
import SubwayBullet from "./SubwayBullet";
import { SubwayLine } from "@/lib/types";

interface LeaderboardProps {
  lines: SubwayLine[];
  podiumLineIds: string[];
}

export default function Leaderboard({
  lines,
  podiumLineIds,
}: LeaderboardProps) {
  const prefersReduced = useReducedMotion();

  // Split into ranked (non-podium, has score) and clean (score = 0)
  const ranked = lines.filter(
    (l) => l.daily_score > 0 && !podiumLineIds.includes(l.id)
  );
  const clean = lines.filter((l) => l.daily_score === 0);

  const hasCleanLines = clean.length > 0;

  return (
    <motion.section
      className="w-full max-w-2xl mx-auto px-4 mt-8"
      initial={prefersReduced ? {} : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 2.5, duration: 0.5 }}
      aria-label="Full leaderboard"
    >
      {/* Section header */}
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-sm font-black uppercase tracking-widest text-zinc-500">
          Full Rankings
        </h2>
        <div className="flex-1 h-px bg-white/5" />
      </div>

      {/* Ranked lines (below the podium top 3) */}
      <ol className="space-y-0.5" role="list">
        {ranked.map((line, idx) => (
          <li key={line.id}>
            <LineCard
              line={line}
              rank={podiumLineIds.length + idx + 1}
            />
          </li>
        ))}
      </ol>

      {/* Clean lines section */}
      {hasCleanLines && (
        <div className="mt-8 relative">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-sm font-black uppercase tracking-widest text-emerald-500/60">
              Running Clean
            </h2>
            <div className="flex-1 h-px bg-emerald-500/10" />
          </div>

          {/* Confetti burst */}
          <div className="relative">
            <ConfettiEffect />
          </div>

          <div className="flex flex-wrap gap-2">
            {clean.map((line) => (
              <motion.div
                key={line.id}
                className="flex items-center gap-2 bg-emerald-500/5 border border-emerald-500/10 rounded-full px-3 py-1.5"
                initial={prefersReduced ? {} : { scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 2.8 + Math.random() * 0.3 }}
              >
                <SubwayBullet line={line.id} size="sm" className="w-5 h-5 text-[10px]" />
                <span className="text-xs text-emerald-400/80 font-medium">
                  0 pts
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.section>
  );
}
