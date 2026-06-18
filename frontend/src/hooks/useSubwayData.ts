import { useState, useEffect, useCallback, useRef } from "react";
import type { ApiResponse } from "../types/api";

const POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes
// Default to same-origin API calls so the frontend can move between deploy
// targets without hardcoding one backend host.
const API_BASE = import.meta.env.VITE_API_URL || "";

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
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    // Backoff only smooths over real cold starts (502/503). A hard 500 or a
    // network error is a definitive outage, so we bail immediately and let the
    // honest OfflineState take over. The persona bounces if nothing meaningful
    // resolves in about 2 seconds on platform LTE, so the down screen must
    // arrive fast, not after a long retry loop.
    const RETRYABLE = new Set([502, 503]);
    const MAX_ATTEMPTS = 3;
    const BACKOFF_MS = [800, 1200]; // short waits, only between cold-start retries.

    // Hard total-timeout cap. No matter what, the loading skeleton can never
    // persist past this, so the verdict or the down screen always paints inside
    // the persona's attention window.
    const TOTAL_TIMEOUT_MS = 3500;
    const startedAt = Date.now();
    const timeLeft = () => TOTAL_TIMEOUT_MS - (Date.now() - startedAt);

    let lastErr: Error | null = null;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      try {
        // Per-request abort so a hanging fetch cannot outlive the total cap.
        const controller = new AbortController();
        const reqTimer = setTimeout(() => controller.abort(), Math.max(0, timeLeft()));
        let res: Response;
        try {
          res = await fetch(`${API_BASE}/api/status`, { signal: controller.signal });
        } finally {
          clearTimeout(reqTimer);
        }
        if (!res.ok) {
          // Only cold-start codes are worth a retry. Everything else (500, 4xx)
          // is a hard failure: stop now so the down screen paints fast.
          const backoff = BACKOFF_MS[attempt];
          if (RETRYABLE.has(res.status) && attempt < MAX_ATTEMPTS - 1 && timeLeft() > backoff) {
            await new Promise((r) => setTimeout(r, backoff));
            continue;
          }
          throw new Error(`HTTP ${res.status}`);
        }
        const json: ApiResponse = await res.json();
        setData(json);
        setLastUpdated(json.timestamp ? new Date(json.timestamp) : new Date());
        lastFetchRef.current = Date.now();
        setSecondsUntilRefresh(POLL_INTERVAL / 1000);
        hasLoadedRef.current = true;
        lastErr = null;
        break; // success
      } catch (err) {
        lastErr = err instanceof Error ? err : new Error(String(err));
        // A network error or abort is a hard failure too: do not keep spinning.
        // We have already paid one request; bail so OfflineState renders fast.
        break;
      }
    }

    if (lastErr) setError(lastErr.message);

    if (isRefresh) {
      setRefreshing(false);
    } else {
      setLoading(false);
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
