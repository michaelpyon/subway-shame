"use client";

import { useReducedMotion } from "framer-motion";

// Pure CSS flame particle effect for the #1 shamed line.
// No canvas, no JS animation loop. Lightweight and motion-safe.

export default function FlameEffect() {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) return null;

  return (
    <div className="flame-container" aria-hidden="true">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="flame-particle"
          style={{
            // Spread particles across the width
            left: `${10 + (i * 80) / 12}%`,
            // Stagger animation start
            animationDelay: `${i * 0.15}s`,
            // Vary size
            width: `${3 + (i % 3) * 2}px`,
            height: `${3 + (i % 3) * 2}px`,
          }}
        />
      ))}
    </div>
  );
}
