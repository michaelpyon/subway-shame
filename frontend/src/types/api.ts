// ---------------------------------------------------------------------------
// API Types — Subway Shame
// Mirrors the shape returned by GET /api/status (backend/app.py)
// ---------------------------------------------------------------------------

/** All valid NYC subway line identifiers used by the MTA GTFS-RT feeds. */
export type LineId =
  | "1" | "2" | "3" | "4" | "5" | "6" | "7"
  | "A" | "C" | "E"
  | "B" | "D" | "F" | "M"
  | "N" | "Q" | "R" | "W"
  | "G" | "J" | "Z" | "L"
  | "S" | "SI";

/** Alert severity categories (text-classified from MTA header text). */
export type AlertCategory =
  | "No Service"
  | "Delays"
  | "Slow Speeds"
  | "Skip Stop"
  | "Rerouted"
  | "Runs Local"
  | "Reduced Freq"
  | "Platform Change"
  | "Other";

/** Which direction an alert affects. "both" = both directions (split 50/50 in scoring). */
export type AlertDirection = "uptown" | "downtown" | "both";

/** Human-readable status label derived from the worst current alert. */
export type StatusLabel =
  | "Good Service"
  | "Suspended"
  | "Delays"
  | "Slow Speeds"
  | "Skip Stop"
  | "Rerouted"
  | "Runs Local"
  | "Fewer Trains"
  | "Platform Change"
  | "Issues";

// ---------------------------------------------------------------------------
// Nested shapes
// ---------------------------------------------------------------------------

/** A single MTA alert, classified by text analysis. */
export interface Alert {
  /** Raw MTA header text. */
  text: string;
  /** Classification derived from text pattern matching. */
  category: AlertCategory;
  /** Numeric shame score assigned to this category. */
  score: number;
  /** Which direction this alert applies to. */
  direction: AlertDirection;
}

/**
 * Breakdown of scores by category, e.g. { "Delays": 60, "Skip Stop": 15 }.
 * Uses Partial because most categories will be absent for any given line.
 */
export type ScoreBreakdown = Partial<Record<AlertCategory, number>>;

/** Score data for a single travel direction (uptown or downtown). */
export interface DirectionData {
  /** Accumulated shame score for this direction. */
  score: number;
  /** Per-category breakdown of that score. */
  breakdown: ScoreBreakdown;
}

/** Directional split — every LineData has one for both daily and live views. */
export interface ByDirection {
  uptown: DirectionData;
  downtown: DirectionData;
}

// ---------------------------------------------------------------------------
// Core entities
// ---------------------------------------------------------------------------

/**
 * Full data payload for a single subway line.
 * Returned in the `lines`, `winner`, and `podium` arrays.
 */
export interface LineData {
  /** Subway line identifier (e.g. "A", "6", "SI"). */
  id: LineId;
  /** Current snapshot shame score (resets each poll). */
  score: number;
  /** Accumulated shame score for the entire day (ET midnight reset). */
  daily_score: number;
  /** Worst current status label derived from live alerts. */
  status: StatusLabel;
  /** Active alerts (deduplicated by text). */
  alerts: Alert[];
  /** Peak (worst) alerts seen today — the daily low point. */
  peak_alerts: Alert[];
  /** Daily accumulated score breakdown by category. */
  breakdown: ScoreBreakdown;
  /** Live (current snapshot) score breakdown by category. */
  live_breakdown: ScoreBreakdown;
  /** Daily accumulated directional breakdown. */
  by_direction: ByDirection;
  /** Live (current snapshot) directional breakdown. */
  live_by_direction: ByDirection;
  /** Active trip count from GTFS-RT trip_update feeds. */
  trip_count: number;
}

/** A single 15-minute time-series bucket. */
export interface TimeSeriesPoint {
  /** Bucket start time in "HH:MM" format (ET, rounded to 15 min). */
  time: string;
  /** Per-line scores for lines with score > 0 in this bucket. */
  scores: Partial<Record<LineId, number>>;
}

// ---------------------------------------------------------------------------
// Top-level API response
// ---------------------------------------------------------------------------

/**
 * Full response shape from GET /api/status.
 *
 * @example
 * const res = await fetch("/api/status");
 * const data: ApiResponse = await res.json();
 */
export interface ApiResponse {
  /** UTC ISO 8601 timestamp of when the response was generated. */
  timestamp: string;
  /** Human-readable ET date string, e.g. "Monday, January 6". */
  date: string;
  /** The line with the highest daily_score, or null if no line has been scored today. */
  winner: LineData | null;
  /** Top 3 podium positions (includes ties — may be more than 3 entries). */
  podium: LineData[];
  /** All lines, sorted by daily_score DESC then score DESC then id ASC. */
  lines: LineData[];
  /** 15-minute buckets of per-line scores for today (ET). */
  timeseries: TimeSeriesPoint[];
}
