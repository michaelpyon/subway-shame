"use client";

import { useReducedMotion } from "framer-motion";

// CSS-only confetti burst for lines with a 0 shame score.
// Fires once on mount, then stops. No continuous animation.

const CONFETTI_COLORS = [
  "#EE352E", // red (1/2/3)
  "#0039A6", // blue (A/C/E)
  "#FF6319", // orange (B/D/F/M)
  "#00933C", // green (4/5/6)
  "#B933AD", // purple (7)
  "#FCCC0A", // yellow (N/Q/R/W)
  "#6CBE45", // lime (G)
];

export default function ConfettiEffect() {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) return null;

  return (
    <div className="confetti-container" aria-hidden="true">
      {Array.from({ length: 24 }).map((_, i) => (
        <div
          key={i}
          className="confetti-piece"
          style={{
            left: `${5 + Math.random() * 90}%`,
            backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            animationDelay: `${Math.random() * 0.6}s`,
            animationDuration: `${1 + Math.random() * 0.8}s`,
            width: `${4 + Math.random() * 4}px`,
            height: `${4 + Math.random() * 4}px`,
            borderRadius: Math.random() > 0.5 ? "50%" : "1px",
            transform: `rotate(${Math.random() * 360}deg)`,
          }}
        />
      ))}
    </div>
  );
}
