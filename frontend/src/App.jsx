import { useState } from "react";
import { useSubwayData } from "./hooks/useSubwayData";
import Header from "./components/Header";
import Trophy from "./components/Trophy";
import SystemHealth from "./components/SystemHealth";
import LeaderboardTicker from "./components/LeaderboardTicker";
import ShameChart from "./components/ShameChart";
import LineGrid from "./components/LineGrid";
import ScoringExplainer from "./components/ScoringExplainer";
import TrainChecker from "./components/TrainChecker";
import AlertMarquee from "./components/AlertMarquee";
import OfflineState from "./components/OfflineState";
import SkeletonLoader from "./components/SkeletonLoader";
import "./App.css";

export default function App() {
  const { data, loading, error, lastUpdated, refreshing, secondsUntilRefresh, refresh } = useSubwayData();

  const [checkerOpen, setCheckerOpen] = useState(false);

  // Full offline state
  if (error && !data) {
    return <OfflineState onRetry={refresh} loading={loading} />;
  }

  return (
    <div
      className="min-h-dvh antialiased"
      style={{
        backgroundColor: 'var(--color-tunnel)',
        color: 'var(--color-cream)',
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

      {/* Alert marquee */}
      {data && data.lines && (
        <AlertMarquee lines={data.lines} />
      )}

      {/* Soft error banner */}
      {error && data && (
        <div className="max-w-2xl mx-auto px-4 mb-2">
          <div className="px-4 py-2 flex items-center justify-between gap-3" style={{ backgroundColor: 'rgba(233, 196, 0, 0.12)', border: '1px solid rgba(233, 196, 0, 0.25)' }}>
            <p className="text-xs" style={{ color: 'var(--color-gold-dim)' }}>
              Showing last known data. Auto-retries every 5 min.
            </p>
            <button
              onClick={refresh}
              disabled={loading}
              className="text-xs underline disabled:opacity-40 shrink-0 press-scale"
              style={{ color: 'var(--color-gold-dim)' }}
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && !data && (
        <SkeletonLoader />
      )}

      {/* Main content */}
      {data && (
        <>
          {/* System health summary */}
          <div className="stagger-section">
            <SystemHealth lines={data.lines || []} />
          </div>

          {/* Leaderboard ticker (replaces podium) */}
          {data.winner && (
            <div className="stagger-section">
              <LeaderboardTicker podium={data.podium || []} />
            </div>
          )}

          {/* Trophy / winner card */}
          {data.winner && (
            <div className="stagger-section">
              <Trophy winner={data.winner} lines={data.lines || []} />
            </div>
          )}

          {/* Shame chart */}
          {data.timeseries && data.timeseries.length > 0 && (
            <div className="stagger-section">
              <ShameChart timeseries={data.timeseries} />
            </div>
          )}

          {/* Scoring explainer */}
          <div className="stagger-section">
            <ScoringExplainer />
          </div>

          {/* Line grid — severity grouped */}
          <div className="stagger-section">
            <LineGrid lines={data.lines} />
          </div>
        </>
      )}

      {/* TrainChecker modal */}
      {data && checkerOpen && (
        <TrainChecker lines={data.lines} isModal={true} onClose={() => setCheckerOpen(false)} />
      )}

      {/* Footer */}
      <footer className="stagger-section max-w-2xl mx-auto px-4 py-8">
        {/* Terminal footer */}
        <div
          className="text-center py-4 mb-4"
          style={{ border: '2px dashed var(--color-outline-variant)' }}
        >
          <p
            className="text-xs leading-relaxed mb-2 font-label"
            style={{
              fontWeight: 800,
              color: 'var(--color-outline)',
              textTransform: 'uppercase',
            }}
          >
            All service is theoretical.<br />
            Do not rely on schedules.
          </p>
          <p
            className="text-[10px] uppercase tracking-widest"
            style={{
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-outline-variant)',
            }}
          >
            DATA: MTA GTFS-RT · REFRESH: 300s · COVERAGE: 24 LINES
          </p>
        </div>

        {/* FML easter egg */}
        <div className="text-center" style={{ color: 'var(--color-outline)' }}>
          <div className="flex items-center justify-center gap-1.5 mb-3" title="F*** My Life" aria-label="F M L train lines">
            {[
              { id: "F", color: "var(--mta-bdfm)" },
              { id: "M", color: "var(--mta-bdfm)" },
              { id: "L", color: "var(--mta-l)" },
            ].map(({ id, color }) => (
              <div
                key={id}
                className="w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] shrink-0"
                style={{ backgroundColor: color, color: "#fff", fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}
              >
                {id}
              </div>
            ))}
            <span className="text-[9px] tracking-widest uppercase ml-1" style={{ fontFamily: 'var(--font-mono)' }}>14 St · 6 Av</span>
          </div>
          <p className="text-xs">
            Built by{" "}
            <a
              href="https://pyon.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
              style={{ color: 'var(--color-on-surface-variant)' }}
            >
              Michael Pyon
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
