"use client";

import { useState, useCallback } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface ShareButtonProps {
  worstLine?: string;
  score?: number;
}

export default function ShareButton({ worstLine, score }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const prefersReduced = useReducedMotion();

  const shareText = worstLine
    ? `The ${worstLine} train is the worst in NYC today with a shame score of ${score?.toLocaleString()}. Check the full rankings:`
    : "Check today's NYC subway shame leaderboard:";

  const shareUrl = typeof window !== "undefined" ? window.location.href : "https://subwayshame.com";

  const handleShare = useCallback(async () => {
    // Try Web Share API first (mobile)
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "Subway Shame",
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch {
        // User cancelled or API failed, fall through to clipboard
      }
    }

    // Fallback: copy link to clipboard
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Last resort: select text
    }
  }, [shareText, shareUrl]);

  return (
    <motion.button
      onClick={handleShare}
      className="group flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/10 bg-white/[0.03] text-sm font-medium text-zinc-300 hover:text-white hover:border-white/20 hover:bg-white/[0.06] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
      initial={prefersReduced ? {} : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 3, duration: 0.4 }}
      whileHover={prefersReduced ? {} : { scale: 1.02 }}
      whileTap={prefersReduced ? {} : { scale: 0.98 }}
    >
      {copied ? (
        <>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="text-emerald-400"
          >
            <path
              d="M3 8L6.5 11.5L13 4.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-emerald-400">Link copied</span>
        </>
      ) : (
        <>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="text-zinc-400 group-hover:text-white transition-colors"
          >
            <path
              d="M5 3V2C5 1.44772 5.44772 1 6 1H14C14.5523 1 15 1.44772 15 2V10C15 10.5523 14.5523 11 14 11H13"
              stroke="currentColor"
              strokeWidth="1.25"
              strokeLinecap="round"
            />
            <rect
              x="1"
              y="5"
              width="10"
              height="10"
              rx="1"
              stroke="currentColor"
              strokeWidth="1.25"
            />
          </svg>
          <span>Share today's shame</span>
        </>
      )}
    </motion.button>
  );
}
