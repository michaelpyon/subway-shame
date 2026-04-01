"use client";

import { motion, useReducedMotion } from "framer-motion";
import SubwayBullet from "./SubwayBullet";
import ShameScore from "./ShameScore";
import FlameEffect from "./FlameEffect";
import { SubwayLine } from "@/lib/types";

interface PodiumProps {
  top3: SubwayLine[];
}

// Podium reveal order: 3rd, 2nd, 1st (builds tension)
const PODIUM_CONFIG = [
  {
    position: 1,
    label: "1ST",
    barHeight: "h-40",
    glowColor: "rgba(255, 215, 0, 0.3)",
    bulletSize: "xl" as const,
    scoreSize: "lg" as const,
    order: 2, // animates last
    medalColor: "#FFD700",
  },
  {
    position: 2,
    label: "2ND",
    barHeight: "h-28",
    glowColor: "rgba(192, 192, 192, 0.2)",
    bulletSize: "lg" as const,
    scoreSize: "md" as const,
    order: 1, // animates second
    medalColor: "#C0C0C0",
  },
  {
    position: 3,
    label: "3RD",
    barHeight: "h-20",
    glowColor: "rgba(205, 127, 50, 0.15)",
    bulletSize: "lg" as const,
    scoreSize: "md" as const,
    order: 0, // animates first
    medalColor: "#CD7F32",
  },
];

// Visual ordering: 2nd | 1st | 3rd (classic podium layout)
const VISUAL_ORDER = [1, 0, 2]; // indices into PODIUM_CONFIG

export default function Podium({ top3 }: PodiumProps) {
  const prefersReduced = useReducedMotion();

  if (top3.length === 0) return null;

  // Pad to exactly 3 if fewer (shouldn't happen with mock data, but safe)
  const padded = [...top3];
  while (padded.length < 3) {
    padded.push(padded[padded.length - 1]);
  }

  return (
    <div className="flex items-end justify-center gap-3 sm:gap-6 px-4 mt-2">
      {VISUAL_ORDER.map((configIdx) => {
        const config = PODIUM_CONFIG[configIdx];
        const line = padded[configIdx];
        if (!line) return null;

        const stagger = config.order * 0.3; // 0s, 0.3s, 0.6s
        const baseDelay = 0.5; // after title + date
        const entryDelay = baseDelay + stagger;

        return (
          <motion.div
            key={line.id + config.position}
            className="flex flex-col items-center gap-2"
            initial={
              prefersReduced
                ? { opacity: 1 }
                : { opacity: 0, y: 60 }
            }
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: entryDelay,
              duration: 0.4,
              ease: [0.22, 1, 0.36, 1], // ease-out expo
            }}
          >
            {/* Medal label */}
            <motion.span
              className="text-xs font-black tracking-widest uppercase"
              style={{ color: config.medalColor }}
              initial={prefersReduced ? {} : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: entryDelay + 0.2 }}
            >
              {config.label}
            </motion.span>

            {/* Subway bullet */}
            <SubwayBullet line={line.id} size={config.bulletSize} />

            {/* Score counter */}
            <ShameScore
              score={line.daily_score}
              delay={entryDelay + 0.3}
              size={config.scoreSize}
            />

            {/* Podium bar */}
            <motion.div
              className={`${config.barHeight} w-20 sm:w-24 rounded-t-lg relative overflow-hidden ${config.position === 1 ? "gold-glow" : ""}`}
              style={{
                background: `linear-gradient(to top, rgba(255,255,255,0.03), rgba(255,255,255,0.08))`,
                boxShadow: `0 0 30px ${config.glowColor}`,
                borderTop: `2px solid ${config.medalColor}`,
                transformOrigin: "bottom center",
              }}
              initial={
                prefersReduced
                  ? { scaleY: 1 }
                  : { scaleY: 0 }
              }
              animate={{ scaleY: 1 }}
              transition={{
                delay: entryDelay,
                duration: 0.5,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {/* Flame effect on #1 only */}
              {config.position === 1 && <FlameEffect />}

              {/* Shimmer overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}
