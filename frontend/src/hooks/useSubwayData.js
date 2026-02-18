import { useState, useEffect, useCallback, useRef } from "react";

const POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function useSubwayData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [secondsUntilRefresh, setSecondsUntilRefresh] = useState(POLL_INTERVAL / 1000);
  const lastFetchRef = useRef(Date.now());

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/status");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      lastFetchRef.current = Date.now();
      setSecondsUntilRefresh(POLL_INTERVAL / 1000);
    } catch (err) {
      setError(err.message);
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
