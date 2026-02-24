import { useState, useEffect, useCallback, useRef } from "react";
import type { ApiResponse } from "../types/api";

const POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes
// Use Railway backend in production; fall back to local dev proxy on localhost
const API_BASE =
  typeof window !== "undefined" && window.location.hostname !== "localhost"
    ? "https://web-production-be47b.up.railway.app"
    : "";

/** Return type for the useSubwayData hook. */
export interface UseSubwayDataReturn {
  /** Full API response, or null before the first successful fetch. */
  data: ApiResponse | null;
  /** True while the initial fetch is in-flight. */
  loading: boolean;
  /** Error message string, or null when no error. */
  error: string | null;
  /** When the last successful fetch completed (local client time). */
  lastUpdated: Date | null;
  /** True while a background refresh is in flight (distinct from initial loading). */
  refreshing: boolean;
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
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [secondsUntilRefresh, setSecondsUntilRefresh] = useState<number>(
    POLL_INTERVAL / 1000
  );
  const lastFetchRef = useRef<number>(Date.now());
  const hasLoadedRef = useRef<boolean>(false);

  const fetchData = useCallback(async (): Promise<void> => {
    const isRefresh = hasLoadedRef.current;
    // For initial load use `loading`; for background refreshes use `refreshing`
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/status`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: ApiResponse = await res.json();
      setData(json);
      setLastUpdated(new Date());
      lastFetchRef.current = Date.now();
      setSecondsUntilRefresh(POLL_INTERVAL / 1000);
      hasLoadedRef.current = true;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, []);

  // Initial fetch + auto-polling every 5 minutes
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

  return { data, loading, error, lastUpdated, refreshing, secondsUntilRefresh, refresh: fetchData };
}
