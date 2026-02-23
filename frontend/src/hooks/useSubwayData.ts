import { useState, useEffect, useCallback, useRef } from "react";
import type { ApiResponse } from "../types/api";

const POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes

/** Return type for the useSubwayData hook. */
export interface UseSubwayDataReturn {
  /** Full API response, or null before the first successful fetch. */
  data: ApiResponse | null;
  /** True while a fetch is in-flight. */
  loading: boolean;
  /** Error message string, or null when no error. */
  error: string | null;
  /** Seconds until the next automatic refresh. */
  secondsUntilRefresh: number;
  /** Manually trigger an immediate refresh. */
  refresh: () => void;
}

/**
 * Fetches subway status from /api/status and re-polls every 5 minutes.
 * Also maintains a live countdown to the next refresh.
 */
export function useSubwayData(): UseSubwayDataReturn {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [secondsUntilRefresh, setSecondsUntilRefresh] = useState<number>(
    POLL_INTERVAL / 1000
  );
  const lastFetchRef = useRef<number>(Date.now());

  const fetchData = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/status");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: ApiResponse = await res.json();
      setData(json);
      lastFetchRef.current = Date.now();
      setSecondsUntilRefresh(POLL_INTERVAL / 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch + polling
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Countdown timer
  useEffect(() => {
    const tick = setInterval(() => {
      const elapsed = Math.floor((Date.now() - lastFetchRef.current) / 1000);
      const remaining = Math.max(0, POLL_INTERVAL / 1000 - elapsed);
      setSecondsUntilRefresh(remaining);
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  return { data, loading, error, secondsUntilRefresh, refresh: fetchData };
}
