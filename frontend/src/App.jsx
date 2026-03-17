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
      .catch(() => {});
  }, [data]);

  // Full offline state
  if (error && !data) {
    return <OfflineState onRetry={refresh} loading={loading} />;
  }

  return (
    <div
      className="min-h-screen antialiased"
      style={{
        backgroundColor: '#0A0A0A',
        color: '#F5F0E8',
        backgroundImage: [
          'radial-gradient(circle at 20% 80%, rgba(232, 53, 58, 0.04) 0%, transparent 50%)',
          'radial-gradient(circle at 80% 20%, rgba(0, 57, 166, 0.04) 0%, transparent 50%)',
        ].join(', '),
      }}
    >
      <div className="stagger-section">
        <Header
          lastUpdated={lastUpdated}
          secondsUntilRefresh={secondsUntilRefresh}
          onRefresh={refresh}
          loading={loading}
          refreshing={refreshing}
          error={error}
          onOpenChecker={() => setCheckerOpen(true)}
        />
      </div>

      {/* Soft error banner when we have stale data */}
      {error && data && (
        <div className="max-w-2xl mx-auto px-4 mb-2">
          <div className="rounded-lg px-4 py-2 flex items-center justify-between gap-3" style={{ backgroundColor: 'rgba(113, 63, 18, 0.25)', border: '1px solid rgba(113, 63, 18, 0.35)' }}>
            <p className="text-yellow-600 text-xs">
              Showing last known data — live feed unavailable. Backend may be waking up; auto-retries every 5 min.
            </p>
            <button
              onClick={refresh}
              disabled={loading}
              className="text-yellow-600 text-xs underline hover:text-yellow-500 disabled:opacity-40 shrink-0 press-scale"
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
            <div className="stagger-section">
              <div className="space-y-2">
                <Trophy winner={data.winner} lines={data.lines || []} />
                {data.podium && data.podium.length > 1 && (
                  <Podium podium={data.podium} date={data.date} />
                )}
              </div>
            </div>
          ) : (
            <div className="stagger-section text-center py-12 px-4">
              <div className="text-5xl mb-4">🎉</div>
              <p className="text-xl font-semibold max-w-md mx-auto" style={{ color: '#F5F0E8' }}>
                {allGoodMsg}
              </p>
            </div>
          )}
          {data.timeseries && data.timeseries.length > 0 && (
            <div className="stagger-section">
              <ShameChart timeseries={data.timeseries} />
            </div>
          )}
          <div className="stagger-section">
            <ScoringExplainer />
          </div>
          <div className="stagger-section">
            <LineGrid lines={data.lines} history={historyData} records={recordsData} />
          </div>
        </>
      )}

      {/* TrainChecker modal */}
      {data && checkerOpen && (
        <TrainChecker lines={data.lines} isModal={true} onClose={() => setCheckerOpen(false)} />
      )}

      {/* Footer */}
      <footer className="stagger-section text-center text-xs py-6 px-4" style={{ color: 'rgba(245, 240, 232, 0.25)' }}>
        {/* FML easter egg */}
        <div className="flex items-center justify-center gap-1.5 mb-3" title="F*** My Life" aria-label="F M L train lines — 14 St / 6 Av">
          {[
            { id: "F", color: "#FF6319" },
            { id: "M", color: "#FF6319" },
            { id: "L", color: "#A7A9AC" },
          ].map(({ id, color }) => (
            <div
              key={id}
              className="w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] shrink-0"
              style={{ backgroundColor: color, color: "#fff", fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}
            >
              {id}
            </div>
          ))}
          <span className="text-[9px] tracking-widest uppercase ml-1" style={{ fontFamily: 'var(--font-mono)', color: 'rgba(245, 240, 232, 0.2)' }}>14 St · 6 Av</span>
        </div>
        <p>
          Data from{" "}
          <a
            href="https://api.mta.info/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline transition-colors"
            style={{ color: 'rgba(245, 240, 232, 0.35)' }}
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
            className="underline transition-colors"
            style={{ color: 'rgba(245, 240, 232, 0.35)' }}
          >
            Michael Pyon
          </a>
        </p>
      </footer>
    </div>
  );
}
