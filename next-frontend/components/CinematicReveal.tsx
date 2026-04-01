"use client";

import { motion, useReducedMotion } from "framer-motion";
import Podium from "./Podium";
import Leaderboard from "./Leaderboard";
import ShareButton from "./ShareButton";
import HowWeScore from "./HowWeScore";
import { ApiStatusResponse } from "@/lib/types";

interface CinematicRevealProps {
  data: ApiStatusResponse;
}

export default function CinematicReveal({ data }: CinematicRevealProps) {
  const prefersReduced = useReducedMotion();
  const top3 = data.podium.slice(0, 3);
  const podiumLineIds = top3.map((l) => l.id);
  const winner = data.winner;

  // If no lines have scores, show the unicorn state
  const allClean = data.lines.every((l) => l.daily_score === 0);

  return (
    <main className="min-h-dvh flex flex-col items-center pb-20">
      {/* 1. Title fade in (0s) */}
      <motion.h1
        className="mt-16 sm:mt-24 text-center"
        initial={prefersReduced ? {} : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <span
          className="text-4xl sm:text-6xl font-black uppercase tracking-tight block"
          style={{
            textShadow: "0 0 40px rgba(255, 255, 255, 0.08)",
          }}
        >
          Subway Shame
        </span>
      </motion.h1>

      {/* 2. Date stamp types in (0.3s) */}
      <motion.p
        className="mt-3 text-sm sm:text-base font-mono text-zinc-500 tracking-wide"
        initial={prefersReduced ? {} : { opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        {data.date}
      </motion.p>

      {/* Stale data banner */}
      {data.timestamp && (
        <StaleBanner timestamp={data.timestamp} />
      )}

      {/* 3-5. Podium or All Clean state */}
      {allClean ? (
        <AllCleanState />
      ) : (
        <>
          {/* Podium reveal (0.5-2s) */}
          <div className="mt-10 sm:mt-16 w-full max-w-lg mx-auto">
            <Podium top3={top3} />
          </div>

          {/* 6. Full leaderboard (2.5s) */}
          <Leaderboard
            lines={data.lines}
            podiumLineIds={podiumLineIds}
          />

          {/* 7. Share button (3s) */}
          <div className="mt-10">
            <ShareButton
              worstLine={winner?.id}
              score={winner?.daily_score}
            />
          </div>
        </>
      )}

      {/* How we score accordion */}
      <HowWeScore />

      {/* Footer */}
      <Footer />
    </main>
  );
}

function StaleBanner({ timestamp }: { timestamp: string }) {
  // Show banner only if data is older than 10 minutes
  const dataAge = Date.now() - new Date(timestamp).getTime();
  const stale = dataAge > 10 * 60 * 1000;

  if (!stale) return null;

  const ago = Math.round(dataAge / 60000);

  return (
    <motion.div
      className="mt-4 px-4 py-2 rounded-lg bg-amber-500/5 border border-amber-500/10 text-xs text-amber-500/80"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1 }}
    >
      Data from {ago} minutes ago. Live updates paused.
    </motion.div>
  );
}

function AllCleanState() {
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      className="mt-16 text-center px-4"
      initial={prefersReduced ? {} : { opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5, duration: 0.6 }}
    >
      <div className="relative inline-block">
        <p className="text-2xl sm:text-4xl font-black text-emerald-400">
          No shame today.
        </p>
        <p className="mt-2 text-zinc-500 text-sm">
          Every line is running clean. Enjoy it while it lasts.
        </p>
      </div>
    </motion.div>
  );
}

function Footer() {
  return (
    <footer className="w-full max-w-2xl mx-auto px-4 mt-16 pb-8">
      <div className="text-center py-4 border-t border-white/5">
        <p className="text-[10px] uppercase tracking-widest text-zinc-700 font-mono">
          Data: MTA GTFS-RT &middot; Refresh: 5 min &middot; Scores reset at midnight ET
        </p>
        <p className="mt-3 text-xs text-zinc-700">
          Built by{" "}
          <a
            href="https://pyon.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-zinc-500 transition-colors"
          >
            Michael Pyon
          </a>
        </p>
      </div>
    </footer>
  );
}
