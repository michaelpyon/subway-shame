"use client";

import { LINE_COLORS, DARK_TEXT_LINES } from "@/lib/constants";

interface SubwayBulletProps {
  line: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeMap = {
  sm: "w-6 h-6 text-xs",
  md: "w-8 h-8 text-sm",
  lg: "w-12 h-12 text-lg",
  xl: "w-16 h-16 text-2xl",
};

export default function SubwayBullet({
  line,
  size = "md",
  className = "",
}: SubwayBulletProps) {
  const bgColor = LINE_COLORS[line] || "#808183";
  const textColor = DARK_TEXT_LINES.has(line) ? "#000000" : "#FFFFFF";

  return (
    <div
      className={`rounded-full flex items-center justify-center font-black shrink-0 select-none ${sizeMap[size]} ${className}`}
      style={{
        backgroundColor: bgColor,
        color: textColor,
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
      }}
      role="img"
      aria-label={`${line} train`}
    >
      {line}
    </div>
  );
}
