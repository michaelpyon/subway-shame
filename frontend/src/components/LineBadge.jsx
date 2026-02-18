import { LINE_COLORS } from "../constants/lines";

const SIZES = {
  sm: "w-8 h-8 text-lg",
  md: "w-10 h-10 text-xl",
  lg: "w-16 h-16 text-3xl",
  xl: "w-24 h-24 text-5xl",
};

export default function LineBadge({ lineId, size = "md" }) {
  const color = LINE_COLORS[lineId] || "#808183";
  const isYellow = lineId === "N" || lineId === "Q" || lineId === "R" || lineId === "W";

  return (
    <div
      className={`${SIZES[size]} rounded-full flex items-center justify-center font-bold shrink-0`}
      style={{
        backgroundColor: color,
        color: isYellow ? "#000" : "#fff",
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
      }}
    >
      {lineId}
    </div>
  );
}
