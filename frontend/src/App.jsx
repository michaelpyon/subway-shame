import { useMemo, useState, useEffect } from "react";
import { useSubwayData } from "./hooks/useSubwayData";
import { ALL_GOOD_MESSAGES } from "./constants/lines";
import Header from "./components/Header";
import Trophy from "./components/Trophy";
import Podium from "./components/Podium";
import ShameChart from "./components/ShameChart";
import LineGrid from "./components/LineGrid";
import ScoringExplainer from "./components/ScoringExplainer";
import TrainChecker from "./components/TrainChecker";
import OfflineState from "./components/OfflineState";
import SkeletonLoader from "./components/SkeletonLoader";
import "./App.css";

export default function App() {
  const { data, loading, error, lastUpdated, refreshing, secondsUntilRefresh, refresh } = useSubwayData();

  const allGoodMsg = useMemo(
    () => ALL_GOOD_MESSAGES[Math.floor(Math.random() * ALL_GOOD_MESSAGES.length)],
    []
  );

  const [historyData, setHistoryData] = useState(null);
  const [recordsData, setRecordsData] = useState(null);
  const [checkerOpen, setCheckerOpen] = useState(false);

  // Fetch history once data is available
  useEffect(() => {
    if (!data) return;
    const apiBase = import.meta.env.VITE_API_URL || "";
    fetch(`${apiBase}/api/history?hours=72`)
      .then((r) => r.ok ? r.json() : null)
      .then((json) => {
        if (json) {
          setHistoryData(json.history || null);
          setRecordsData(json.records || null);
        }
      })
      .catch(() => {
        // History fetch failure is silent — sparklines just won't appear
      });
  }, [data]);

  // Full offline state — backend is down, no data yet
  if (error && !data) {
    return <OfflineState onRetry={refresh} loading={loading} />;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white antialiased">
      <Header
        lastUpdated={lastUpdated}
        secondsUntilRefresh={secondsUntilRefresh}
        onRefresh={refresh}
        loading={loading}
        refreshing={refreshing}
        error={error}
        onOpenChecker={() => setCheckerOpen(true)}
      />

      {/* Soft error banner when we have stale data */}
      {error && data && (
        <div className="max-w-2xl mx-auto px-4 mb-2">
          <div className="bg-yellow-950/40 border border-yellow-900/50 rounded-lg px-4 py-2 flex items-center justify-between gap-3">
            <p className="text-yellow-600 text-xs">
              Showing last known data — live feed unavailable. Backend may be waking up; auto-retries every 5 min.
            </p>
            <button
              onClick={refresh}
              disabled={loading}
              className="text-yellow-600 text-xs underline hover:text-yellow-500 disabled:opacity-40 shrink-0"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Loading state (first load only) */}
      {loading && !data && (
        <SkeletonLoader />
      )}

      {/* Main content */}
      {data && (
        <>
          {data.winner ? (
            <>
              <Trophy winner={data.winner} lines={data.lines || []} />
              {data.podium && data.podium.length > 1 && (
                <Podium podium={data.podium} date={data.date} />
              )}
            </>
          ) : (
            <div className="text-center py-12 px-4">
              <div className="text-5xl mb-4">🎉</div>
              <p className="text-xl text-gray-300 font-semibold max-w-md mx-auto">
                {allGoodMsg}
              </p>
            </div>
          )}
          {data.timeseries && data.timeseries.length > 0 && (
            <ShameChart timeseries={data.timeseries} />
          )}
          <ScoringExplainer />
          <LineGrid lines={data.lines} history={historyData} records={recordsData} />
        </>
      )}

      {/* TrainChecker modal */}
      {data && checkerOpen && (
        <TrainChecker lines={data.lines} isModal={true} onClose={() => setCheckerOpen(false)} />
      )}

      {/* Footer */}
      <footer className="text-center text-xs text-gray-700 py-6 px-4">
        <p>
          Data from{" "}
          <a
            href="https://api.mta.info/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-gray-500"
          >
            MTA GTFS-RT feeds
          </a>
        </p>
        <p className="mt-1">
          For entertainment purposes. The MTA has enough problems.
        </p>
        <p className="mt-2">
          Built by{" "}
          <a
            href="https://pyon.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-gray-500"
          >
            Michael Pyon
          </a>
        </p>
      </footer>
    </div>
  );
}
