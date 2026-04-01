import { ApiStatusResponse, SubwayLine } from "./types";

// Mock data matching the Flask /api/status response shape.
// Structured so it's easy to swap for the real endpoint.

function makeLine(
  id: string,
  dailyScore: number,
  liveScore: number,
  status: string,
  alerts: { text: string; category: string }[] = [],
  breakdown: Record<string, number> = {}
): SubwayLine {
  return {
    id,
    score: liveScore,
    daily_score: dailyScore,
    status,
    alerts: alerts.map((a) => ({ ...a, direction: "both", timestamp: new Date().toISOString() })),
    peak_alerts: alerts.map((a) => ({ ...a, direction: "both", timestamp: new Date().toISOString() })),
    breakdown,
    live_breakdown: breakdown,
    by_direction: {
      uptown: { score: Math.floor(dailyScore * 0.6), breakdown: {} },
      downtown: { score: Math.floor(dailyScore * 0.4), breakdown: {} },
    },
    live_by_direction: {
      uptown: { score: Math.floor(liveScore * 0.5), breakdown: {} },
      downtown: { score: Math.floor(liveScore * 0.5), breakdown: {} },
    },
    trip_count: Math.floor(Math.random() * 200) + 50,
  };
}

const mockLines: SubwayLine[] = [
  makeLine("F", 847, 120, "Delays", [
    { text: "F trains are running with delays in both directions", category: "Delays" },
    { text: "Service suspended between Jay St and Church Av", category: "No Service" },
    { text: "Expect longer travel times", category: "Slow Speeds" },
  ], { "Delays": 420, "No Service": 300, "Slow Speeds": 127 }),

  makeLine("A", 612, 85, "Delays", [
    { text: "A trains are running with delays northbound", category: "Delays" },
    { text: "Signal problems at 59 St-Columbus Circle", category: "Delays" },
  ], { "Delays": 512, "Slow Speeds": 100 }),

  makeLine("G", 489, 0, "Delays", [
    { text: "G trains running local due to track work", category: "Runs Local" },
    { text: "Reduced service between Court Sq and Hoyt-Schermerhorn", category: "Reduced Freq" },
  ], { "Runs Local": 289, "Reduced Freq": 200 }),

  makeLine("7", 334, 60, "Slow Speeds", [
    { text: "7 trains moving slowly due to switch problems", category: "Slow Speeds" },
  ], { "Slow Speeds": 234, "Delays": 100 }),

  makeLine("L", 287, 45, "Delays", [
    { text: "L trains running with delays", category: "Delays" },
  ], { "Delays": 287 }),

  makeLine("2", 201, 30, "Slow Speeds", [
    { text: "Slow speeds between 96 St and Chambers St", category: "Slow Speeds" },
  ], { "Slow Speeds": 201 }),

  makeLine("B", 156, 0, "Delays", [
    { text: "B trains running with delays downtown", category: "Delays" },
  ], { "Delays": 156 }),

  makeLine("N", 134, 25, "Skip Stop", [
    { text: "N trains skipping 49 St station", category: "Skip Stop" },
  ], { "Skip Stop": 134 }),

  makeLine("D", 98, 0, "Planned Work", [
    { text: "D trains rerouted via the F line in Brooklyn", category: "Rerouted" },
  ], { "Rerouted": 98 }),

  makeLine("E", 67, 15, "Delays", [
    { text: "Minor delays E line", category: "Delays" },
  ], { "Delays": 67 }),

  makeLine("J", 45, 0, "Good Service", [
    { text: "Earlier delays have cleared", category: "Delays" },
  ], { "Delays": 45 }),

  makeLine("Q", 23, 0, "Good Service", [], { "Platform Change": 23 }),

  makeLine("1", 12, 0, "Good Service", [], { "Slow Speeds": 12 }),

  makeLine("4", 8, 0, "Good Service", [], { "Delays": 8 }),

  makeLine("R", 5, 0, "Good Service", [], { "Platform Change": 5 }),

  // Clean lines (score = 0)
  makeLine("3", 0, 0, "Good Service"),
  makeLine("5", 0, 0, "Good Service"),
  makeLine("6", 0, 0, "Good Service"),
  makeLine("C", 0, 0, "Good Service"),
  makeLine("M", 0, 0, "Good Service"),
  makeLine("W", 0, 0, "Good Service"),
  makeLine("Z", 0, 0, "Good Service"),
  makeLine("S", 0, 0, "Good Service"),
  makeLine("SI", 0, 0, "Good Service"),
];

// Sort by daily_score descending
mockLines.sort((a, b) => b.daily_score - a.daily_score || a.id.localeCompare(b.id));

const scored = mockLines.filter((l) => l.daily_score > 0);

export const MOCK_DATA: ApiStatusResponse = {
  timestamp: new Date().toISOString(),
  date: new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "America/New_York",
  }).format(new Date()),
  winner: scored[0] || null,
  podium: scored.slice(0, 3),
  lines: mockLines,
  timeseries: [],
};

// Use mock data for local dev, real API for production
export function getUseMock(): boolean {
  return process.env.USE_MOCK_DATA === "true" || process.env.NODE_ENV === "development";
}
