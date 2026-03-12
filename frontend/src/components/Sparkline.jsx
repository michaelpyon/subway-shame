/**
 * Sparkline — tiny inline SVG chart for score history.
 * Props:
 *   data  — array of { t: string, score: number }
 *   color — hex color string (e.g. "#EF4444")
 */
export default function Sparkline({ data, color = "#6B7280" }) {
  if (!data || data.length < 2) return null;

  const scores = data.map((d) => d.score);
  const allZero = scores.every((s) => s === 0);
  if (allZero) return null;

  const W = 60;
  const H = 24;
  const PAD = 2;

  const min = 0; // always start from 0
  const max = Math.max(...scores);
  if (max === 0) return null;

  const xStep = (W - PAD * 2) / (scores.length - 1);

  const points = scores.map((s, i) => {
    const x = PAD + i * xStep;
    const y = PAD + (1 - (s - min) / (max - min)) * (H - PAD * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0 }}
      aria-hidden="true"
    >
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.75"
      />
    </svg>
  );
}
