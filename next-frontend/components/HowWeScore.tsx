"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { SCORING_WEIGHTS } from "@/lib/constants";

export default function HowWeScore() {
  const [open, setOpen] = useState(false);
  const prefersReduced = useReducedMotion();

  return (
    <section className="w-full max-w-2xl mx-auto px-4 mt-12">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 rounded"
        aria-expanded={open}
      >
        <motion.svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          className="shrink-0"
          animate={{ rotate: open ? 90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <path
            d="M5 3L9 7L5 11"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </motion.svg>
        <span className="font-medium">How we score</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: prefersReduced ? 0 : 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-3 text-sm text-zinc-400 leading-relaxed">
              <p>
                Every 5 minutes, we pull live alert data from the MTA's GTFS-RT
                feeds. Each active alert adds points to a line's daily shame score.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                <ScoreRow
                  label="Full suspension"
                  points={SCORING_WEIGHTS.suspensionFull}
                  note="Your train literally isn't running."
                />
                <ScoreRow
                  label="Partial suspension"
                  points={SCORING_WEIGHTS.suspensionPartial}
                  note="Part of the line is down."
                />
                <ScoreRow
                  label="Service change"
                  points={SCORING_WEIGHTS.serviceChange}
                  note="Rerouted, skipping stops, etc."
                />
                <ScoreRow
                  label="Delay (per event)"
                  points={SCORING_WEIGHTS.delayPerEvent}
                  note="Each delay incident."
                />
                <ScoreRow
                  label="Delay (per minute)"
                  points={SCORING_WEIGHTS.delayPerMinute}
                  note="Longer delays score more."
                />
                <ScoreRow
                  label="Planned work"
                  points={SCORING_WEIGHTS.plannedWork}
                  note="Weekend/overnight work. Low weight."
                />
              </div>

              <p className="text-xs text-zinc-600 mt-4">
                Scores reset at midnight Eastern. Data from MTA GTFS-RT public feeds.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function ScoreRow({
  label,
  points,
  note,
}: {
  label: string;
  points: number;
  note: string;
}) {
  return (
    <div className="bg-white/[0.02] rounded-lg px-3 py-2">
      <div className="flex items-center justify-between">
        <span className="text-zinc-300 font-medium text-xs">{label}</span>
        <span className="text-xs font-mono text-zinc-500">+{points} pts</span>
      </div>
      <p className="text-[11px] text-zinc-600 mt-0.5">{note}</p>
    </div>
  );
}
