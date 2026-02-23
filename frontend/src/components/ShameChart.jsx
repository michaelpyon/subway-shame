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

// Only show lines that have data (score > 0 at any point)
function getActiveLines(timeseries) {
  const seen = new Set();
  for (const point of timeseries) {
    for (const lineId of Object.keys(point.scores || {})) {
      seen.add(lineId);
    }
  }
  return [...seen];
}

// Transform API timeseries into Recharts-friendly data
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

// Custom dot that renders an MTA-style badge at the last data point.
// Accepts an `offsetMap` that maps lineId → pixel offset to separate overlapping badges.
function EndpointBadge({ cx, cy, index, dataLength, lineId, color, offsetMap }) {
  if (index !== dataLength - 1) return null;
  if (cx == null || cy == null) return null;

  const isYellow =
    lineId === "N" || lineId === "Q" || lineId === "R" || lineId === "W";
  const bgColor = LINE_COLORS[lineId] || "#808183";
  const r = 12;

  // Apply offset to separate overlapping badges
  const offset = offsetMap?.[lineId] || 0;
  const adjustedCx = cx + offset;

  return (
    <g>
      {/* Connector line from actual data point to offset badge */}
      {offset !== 0 && (
        <line x1={cx} y1={cy} x2={adjustedCx} y2={cy} stroke={bgColor} strokeWidth={1.5} strokeDasharray="3 2" opacity={0.5} />
      )}
      {/* Outer glow */}
      <circle cx={adjustedCx} cy={cy} r={r + 3} fill={bgColor} opacity={0.25} />
      {/* Badge circle */}
      <circle cx={adjustedCx} cy={cy} r={r} fill={bgColor} stroke="#030712" strokeWidth={2} />
      {/* Letter/number */}
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

/**
 * Build a map of lineId → horizontal pixel offset for lines whose last data point
 * is at the same value. This prevents badge overlap on the chart.
 */
function buildOffsetMap(chartData, activeLines) {
  if (chartData.length === 0) return {};
  const lastPoint = chartData[chartData.length - 1];

  // Group lines by their final value
  const groups = {};
  for (const lineId of activeLines) {
    const val = lastPoint[lineId] || 0;
    if (!groups[val]) groups[val] = [];
    groups[val].push(lineId);
  }

  const offsetMap = {};
  const badgeDiameter = 28; // spacing between overlapping badges

  for (const val in groups) {
    const members = groups[val];
    if (members.length <= 1) continue;
    // Spread badges horizontally around the data point
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
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl text-sm max-w-[220px]">
      <p className="text-gray-400 text-xs mb-2 font-mono">{label}</p>
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
                <span className="text-gray-400 text-xs">
                  {entry.dataKey.length <= 1 ? `${entry.dataKey} Train` : entry.dataKey}
                </span>
              </div>
              <span className="text-white font-bold tabular-nums">
                {entry.value}
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

  if (timeseries.length < 2) {
    return (
      <div className="px-4 py-6 max-w-5xl mx-auto">
        <h2 className="text-lg font-semibold text-gray-400 mb-3">
          Shame Race
        </h2>
        <div className="bg-gray-900 rounded-lg p-8 text-center">
          <p className="text-gray-600 text-sm">
            Collecting data points... Chart appears after 2+ intervals (15 min
            each).
          </p>
          <p className="text-gray-700 text-xs mt-2">
            {timeseries.length === 1
              ? "1 data point so far. Next one in ~15 min."
              : "No data yet. Check back soon."}
          </p>
        </div>
      </div>
    );
  }

  const dataLength = chartData.length;

  return (
    <div className="px-4 py-6 max-w-5xl mx-auto">
      <h2 className="text-lg font-semibold text-gray-400 mb-1">Shame Race</h2>
      <p className="text-xs text-gray-600 mb-4">
        Cumulative shame points over time — which line is pulling ahead?
      </p>

      <div className="bg-gray-900 rounded-lg p-4 sm:p-6 overflow-x-auto">
        <div className="min-w-[320px]">
        <ResponsiveContainer width="100%" height={300} minHeight={240}>
          <AreaChart
            data={chartData}
            margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
          >
            {/* Gradient defs for each active line */}
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
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis
              dataKey="time"
              stroke="#4b5563"
              tick={{ fill: "#6b7280", fontSize: 10 }}
              tickLine={false}
            />
            <YAxis
              stroke="#4b5563"
              tick={{ fill: "#6b7280", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              width={30}
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
                      color={color}
                      offsetMap={offsetMap}
                    />
                  )}
                  activeDot={{ r: 5, fill: color, stroke: "#030712", strokeWidth: 2 }}
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
                key={lineId}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs transition-opacity ${
                  hoveredLine && hoveredLine !== lineId
                    ? "opacity-30"
                    : "opacity-100"
                }`}
                style={{ backgroundColor: "#111827" }}
                onMouseEnter={() => setHoveredLine(lineId)}
                onMouseLeave={() => setHoveredLine(null)}
                onClick={() =>
                  setHoveredLine(hoveredLine === lineId ? null : lineId)
                }
              >
                <LineBadge lineId={lineId} size="sm" />
                <span className="text-gray-400 tabular-nums font-medium">
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
