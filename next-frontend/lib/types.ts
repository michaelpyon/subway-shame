// Types matching the Flask backend API response shape

export interface LineAlert {
  text: string;
  category: string;
  direction?: string;
  timestamp?: string;
}

export interface DirectionBreakdown {
  score: number;
  breakdown: Record<string, number>;
}

export interface SubwayLine {
  id: string;
  score: number;
  daily_score: number;
  status: string;
  alerts: LineAlert[];
  peak_alerts: LineAlert[];
  breakdown: Record<string, number>;
  live_breakdown: Record<string, number>;
  by_direction: {
    uptown: DirectionBreakdown;
    downtown: DirectionBreakdown;
  };
  live_by_direction: {
    uptown: DirectionBreakdown;
    downtown: DirectionBreakdown;
  };
  trip_count: number;
}

// Extended type for the new frontend (adds fields the design doc specifies)
export interface LeaderboardLine {
  line: string;
  score: number;
  rank: number;
  wowDelta: number;
  isClean: boolean;
}

export interface LineDetail {
  line: string;
  score: number;
  serviceChanges: { text: string; timestamp: string }[];
  delays: { count: number; avgMinutes: number };
  suspensions: { count: number; type: string }[];
  plannedWork: { text: string; timestamp: string }[];
  affectedStations: string[];
  shameCountLast30Days: number;
}

export interface ApiStatusResponse {
  timestamp: string;
  date: string;
  winner: SubwayLine | null;
  podium: SubwayLine[];
  lines: SubwayLine[];
  timeseries: Record<string, unknown>[];
}
