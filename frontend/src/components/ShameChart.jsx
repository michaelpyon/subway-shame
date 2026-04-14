import { useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { LINE_COLORS } from "../constants/lines";
import LineBadge from "./LineBadge";

function getActiveLines(timeseries) {
  const seen = new Set();
  for (const point of timeseries) {
    for (const lineId of Object.keys(point.scores || {})) {
      seen.add(lineId);
    }
  }
  return [...seen];
}

function buildChartData(timeseries, activeLines) {
  const cumulative = {};
  for (const lineId of activeLines) {
    cumulative[lineId] = 0;
  }

  return timeseries.map((point) => {
    const row = { time: point.time };
    for (const lineId of activeLines) {
      cumulative[lineId] += point.scores[lineId] || 0;
      row[lineId] = cumulative[lineId];
    }
    return row;
  });
}

function getLineColor(lineId) {
  const isYellow =
    lineId === "N" || lineId === "Q" || lineId === "R" || lineId === "W";
  return isYellow ? "#D4A50A" : LINE_COLORS[lineId] || "#808183";
}

function EndpointBadge({ cx, cy, index, dataLength, lineId, offsetMap }) {
  if (index !== dataLength - 1) return null;
  if (cx == null || cy == null) return null;

  const isYellow =
    lineId === "N" || lineId === "Q" || lineId === "R" || lineId === "W";
  const bgColor = LINE_COLORS[lineId] || "#808183";
  const r = 12;

  const offset = offsetMap?.[lineId] || 0;
  const adjustedCx = cx + offset;

  return (
    <g>
      {offset !== 0 && (
        <line x1={cx} y1={cy} x2={adjustedCx} y2={cy} stroke={bgColor} strokeWidth={1.5} strokeDasharray="3 2" opacity={0.5} />
      )}
      <circle cx={adjustedCx} cy={cy} r={r + 3} fill={bgColor} opacity={0.25} />
      <circle cx={adjustedCx} cy={cy} r={r} fill={bgColor} stroke="var(--color-tunnel)" strokeWidth={2} />
      <text
        x={adjustedCx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        fill={isYellow ? "#000" : "#fff"}
        fontSize={lineId.length > 1 ? 9 : 12}
        fontWeight="bold"
        fontFamily="'Helvetica Neue', Helvetica, Arial, sans-serif"
      >
        {lineId}
      </text>
    </g>
  );
}

function buildOffsetMap(chartData, activeLines) {
  if (chartData.length === 0) return {};
  const lastPoint = chartData[chartData.length - 1];

  const groups = {};
  for (const lineId of activeLines) {
    const val = lastPoint[lineId] || 0;
    if (!groups[val]) groups[val] = [];
    groups[val].push(lineId);
  }

  const offsetMap = {};
  const badgeDiameter = 28;

  for (const val in groups) {
    const members = groups[val];
    if (members.length <= 1) continue;
    const totalWidth = (members.length - 1) * badgeDiameter;
    members.forEach((lineId, i) => {
      offsetMap[lineId] = -totalWidth / 2 + i * badgeDiameter;
    });
  }

  return offsetMap;
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null;

  const sorted = [...payload]
    .filter((p) => p.value > 0)
    .sort((a, b) => b.value - a.value);

  if (sorted.length === 0) return null;

  return (
    <div className="rounded-lg p-3 shadow-xl text-sm max-w-[220px]" style={{ backgroundColor: 'var(--color-ballast)', border: '1px solid var(--color-outline-variant)' }}>
      <p className="text-xs mb-2" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-outline)' }}>{label}</p>
      <div className="space-y-1.5">
        {sorted.slice(0, 10).map((entry) => {
          const bgColor = LINE_COLORS[entry.dataKey] || "#808183";
          const isYellow = ["N", "Q", "R", "W"].includes(entry.dataKey);
          return (
            <div
              key={entry.dataKey}
              className="flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-1.5">
                <span
                  className="w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px] font-bold shrink-0"
                  style={{
                    backgroundColor: bgColor,
                    color: isYellow ? "#000" : "#fff",
                  }}
                >
                  {entry.dataKey}
                </span>
                <span className="text-xs" style={{ color: 'var(--color-outline)' }}>
                  {entry.dataKey.length <= 1 ? `${entry.dataKey} Train` : entry.dataKey}
                </span>
              </div>
              <span className="font-bold tabular-nums" style={{ color: 'var(--color-cream)', fontFamily: 'var(--font-mono)' }}>
                {entry.value.toLocaleString()} pts
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ShameChart({ timeseries }) {
  const [hoveredLine, setHoveredLine] = useState(null);

  const activeLines = useMemo(() => getActiveLines(timeseries), [timeseries]);
  const chartData = useMemo(
    () => buildChartData(timeseries, activeLines),
    [timeseries, activeLines]
  );

  const sortedLines = useMemo(() => {
    if (chartData.length === 0) return activeLines;
    const lastPoint = chartData[chartData.length - 1];
    return [...activeLines].sort(
      (a, b) => (lastPoint[b] || 0) - (lastPoint[a] || 0)
    );
  }, [activeLines, chartData]);

  const offsetMap = useMemo(
    () => buildOffsetMap(chartData, activeLines),
    [chartData, activeLines]
  );

  const rightMargin = useMemo(() => {
    if (chartData.length === 0) return 55;
    const lastPoint = chartData[chartData.length - 1];
    const groups = {};
    for (const lineId of activeLines) {
      const val = lastPoint[lineId] || 0;
      if (!groups[val]) groups[val] = 0;
      groups[val]++;
    }
    const maxGroupSize = Math.max(...Object.values(groups));
    const maxOffset = Math.ceil((maxGroupSize - 1) / 2) * 28 + 12 + 10;
    return Math.max(55, maxOffset);
  }, [chartData, activeLines]);

  if (timeseries.length < 2) {
    return (
      <div className="px-4 py-6 max-w-2xl mx-auto">
        <h2
          className="text-lg font-semibold mb-3"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--color-on-surface-variant)', letterSpacing: '0.04em', fontSize: '22px' }}
        >
          TODAY'S SHAME RACE
        </h2>
        <div className="p-8 text-center" style={{ backgroundColor: 'var(--color-ballast)', boxShadow: 'var(--shadow-card)' }}>
          <p className="text-sm" style={{ color: 'var(--color-outline)' }}>
            Chart builds throughout the day as data is collected.
          </p>
          <p className="text-xs mt-2" style={{ color: 'var(--color-outline-variant)' }}>
            {timeseries.length === 1
              ? "1 reading captured. Check back in ~15 min for the trend line."
              : "No readings yet. The chart will appear once data starts coming in."}
          </p>
        </div>
      </div>
    );
  }

  const dataLength = chartData.length;

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">
      <h2
        className="text-lg font-semibold mb-1"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-on-surface-variant)', letterSpacing: '0.04em', fontSize: '22px' }}
      >
        TODAY'S SHAME RACE
      </h2>
      <p className="text-xs mb-4" style={{ color: 'var(--color-outline)' }}>
        How shame points have accumulated since midnight. Higher line = worse performance today.
        Points reset at midnight.
      </p>

      <div className="p-4 sm:p-6 overflow-x-auto" style={{ backgroundColor: 'var(--color-ballast)', boxShadow: 'var(--shadow-card)' }}>
        <div className="min-w-[320px]">
        <ResponsiveContainer width="100%" height={300} minHeight={240}>
          <AreaChart
            data={chartData}
            margin={{ top: 5, right: rightMargin, bottom: 5, left: 0 }}
          >
            <defs>
              {sortedLines.map((lineId) => {
                const color = getLineColor(lineId);
                return (
                  <linearGradient key={lineId} id={`grad-${lineId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={color} stopOpacity={0.02} />
                  </linearGradient>
                );
              })}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(245, 240, 232, 0.06)" />
            <XAxis
              dataKey="time"
              stroke="rgba(245, 240, 232, 0.15)"
              tick={{ fill: "rgba(245, 240, 232, 0.3)", fontSize: 10 }}
              tickLine={false}
            />
            <YAxis
              stroke="rgba(245, 240, 232, 0.15)"
              tick={{ fill: "rgba(245, 240, 232, 0.3)", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              width={45}
              tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v}
              label={{
                value: "shame pts",
                angle: -90,
                position: "insideLeft",
                offset: 12,
                style: { fill: "rgba(245, 240, 232, 0.15)", fontSize: 9, textAnchor: "middle" },
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            {sortedLines.map((lineId) => {
              const color = getLineColor(lineId);
              const isHovered = hoveredLine === lineId;
              const isDimmed = hoveredLine && !isHovered;

              return (
                <Area
                  key={lineId}
                  type="monotone"
                  dataKey={lineId}
                  stroke={color}
                  strokeWidth={isHovered ? 3.5 : 2}
                  strokeOpacity={isDimmed ? 0.12 : 1}
                  fill={`url(#grad-${lineId})`}
                  fillOpacity={isDimmed ? 0.05 : 1}
                  dot={(props) => (
                    <EndpointBadge
                      {...props}
                      dataLength={dataLength}
                      lineId={lineId}
                      offsetMap={offsetMap}
                    />
                  )}
                  activeDot={{ r: 5, fill: color, stroke: "var(--color-tunnel)", strokeWidth: 2 }}
                  isAnimationActive={false}
                />
              );
            })}
          </AreaChart>
        </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-2 mt-4 justify-center">
          {sortedLines.map((lineId) => {
            const lastVal =
              chartData.length > 0
                ? chartData[chartData.length - 1][lineId] || 0
                : 0;
            return (
              <button
                type="button"
                key={lineId}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs transition-opacity press-scale ${
                  hoveredLine && hoveredLine !== lineId
                    ? "opacity-30"
                    : "opacity-100"
                }`}
                aria-label={`${hoveredLine === lineId ? "Show all lines" : `Highlight ${lineId} train`} in the chart`}
                aria-pressed={hoveredLine === lineId}
                style={{ backgroundColor: 'var(--color-concrete)' }}
                onMouseEnter={() => setHoveredLine(lineId)}
                onMouseLeave={() => setHoveredLine(null)}
                onClick={() =>
                  setHoveredLine(hoveredLine === lineId ? null : lineId)
                }
              >
                <LineBadge lineId={lineId} size="sm" />
                <span className="tabular-nums font-medium" style={{ color: 'var(--color-outline)', fontFamily: 'var(--font-mono)' }}>
                  {lastVal}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
