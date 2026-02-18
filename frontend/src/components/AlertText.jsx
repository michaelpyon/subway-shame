import { LINE_COLORS } from "../constants/lines";

// All valid MTA line IDs for matching
const VALID_LINES = new Set([
  "1","2","3","4","5","6","7",
  "A","C","E","B","D","F","M",
  "N","Q","R","W","G","J","Z",
  "L","S","SI",
]);

/**
 * Renders MTA alert text, replacing [X] line references with
 * inline colored circle badges (like the real MTA does on signs).
 */
export default function AlertText({ text }) {
  if (!text) return null;

  // Match patterns like [7], [A], [SI], [1] — bracketed train IDs
  const parts = text.split(/(\[[A-Z0-9]{1,2}\])/g);

  return (
    <span className="inline">
      {parts.map((part, i) => {
        // Check if this part is a train reference like [7] or [SI]
        const match = part.match(/^\[([A-Z0-9]{1,2})\]$/);
        if (match && VALID_LINES.has(match[1])) {
          const lineId = match[1];
          const bgColor = LINE_COLORS[lineId] || "#808183";
          const isYellow = ["N", "Q", "R", "W"].includes(lineId);

          return (
            <span
              key={i}
              className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold mx-0.5 align-middle"
              style={{
                backgroundColor: bgColor,
                color: isYellow ? "#000" : "#fff",
              }}
            >
              {lineId}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}
