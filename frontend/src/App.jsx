import { useState } from "react";
import { useSubwayData } from "./hooks/useSubwayData";
import Header from "./components/Header";
import Trophy from "./components/Trophy";
import SystemHealth from "./components/SystemHealth";
import Leaderboard from "./components/Leaderboard";
import LineGrid from "./components/LineGrid";
import ScoringExplainer from "./components/ScoringExplainer";
import TrainChecker from "./components/TrainChecker";
import HallOfShame from "./components/HallOfShame";
import AlertMarquee from "./components/AlertMarquee";
import OfflineState from "./components/OfflineState";
import SkeletonLoader from "./components/SkeletonLoader";
import Footer from "./components/Footer";
import "./App.css";

export default function App() {
  const { data, loading, error, lastUpdated, refresh } = useSubwayData();
  const [checkerOpen, setCheckerOpen] = useState(false);

  // Full offline state: no data at all. The honest down screen takes over.
  if (error && !data) {
    return <OfflineState onRetry={refresh} loading={loading} lastUpdated={lastUpdated} />;
  }

  return (
    // Flat black field. No gradients, no corner washes, no textures.
    <div className="min-h-dvh antialiased" style={{ backgroundColor: "var(--color-tunnel)", color: "var(--color-platform)" }}>
      {/* Keyboard skip link: jump past the masthead straight to the verdict. */}
      <a href="#verdict" className="skip-link">Skip to the verdict</a>

      <Header lastUpdated={lastUpdated} error={error} onRefresh={refresh} loading={loading} />

      {/* Alert marquee, only when something is actually wrong */}
      {data && data.lines && <AlertMarquee lines={data.lines} />}

      {/* Loading: structure-only skeleton below the masthead, never a spinner. */}
      {loading && !data && <SkeletonLoader />}

      {data && (
        <main id="verdict" className="pt-5" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* JOB 1: the verdict. Paints with the data, NO entrance animation,
              so "is the F fucked" is answered in 0 scrolls and 0 taps. */}
          {data.winner ? (
            <Trophy winner={data.winner} lines={data.lines || []} lastUpdated={lastUpdated} />
          ) : (
            <SystemHealth lines={data.lines || []} />
          )}

          {/* JOB 3: the standings, so the chat argument ends. */}
          {data.winner && (
            <div className="section-rise">
              <Leaderboard podium={data.podium || []} />
            </div>
          )}

          {/* JOB 2 support: every line, grouped by severity. */}
          <div className="section-rise">
            <LineGrid lines={data.lines} />
          </div>

          {/* Secondary tools below the verdict: the checker and the explainer. */}
          <div className="section-rise">
            <TrainChecker lines={data.lines} onOpen={() => setCheckerOpen(true)} />
          </div>

          <div className="section-rise">
            <HallOfShame winner={data.winner} />
          </div>

          <div className="section-rise">
            <ScoringExplainer />
          </div>
        </main>
      )}

      {/* TrainChecker modal */}
      {data && checkerOpen && (
        <TrainChecker lines={data.lines} isModal onClose={() => setCheckerOpen(false)} />
      )}

      <Footer />
    </div>
  );
}
