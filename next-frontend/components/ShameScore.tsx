"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface ShameScoreProps {
  score: number;
  duration?: number;
  delay?: number;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "text-lg font-bold",
  md: "text-3xl font-black",
  lg: "text-5xl font-black",
};

export default function ShameScore({
  score,
  duration = 1.2,
  delay = 0,
  className = "",
  size = "md",
}: ShameScoreProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const prefersReduced = useReducedMotion();
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (prefersReduced) {
      setDisplayValue(score);
      return;
    }

    const startTime = performance.now() + delay * 1000;
    let started = false;

    function animate(now: number) {
      if (now < startTime) {
        frameRef.current = requestAnimationFrame(animate);
        return;
      }

      if (!started) {
        started = true;
      }

      const elapsed = (now - startTime) / 1000;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic for satisfying deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(eased * score));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    }

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [score, duration, delay, prefersReduced]);

  const isHighShame = score >= 100;

  return (
    <motion.span
      className={`tabular-nums tracking-tight ${sizeClasses[size]} ${isHighShame ? "shame-glow text-[#dc2626]" : ""} ${className}`}
      initial={prefersReduced ? {} : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration: 0.3 }}
      aria-label={`Shame score: ${score}`}
    >
      {displayValue.toLocaleString()}
    </motion.span>
  );
}
