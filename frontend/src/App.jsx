import { useMemo } from "react";
import { useSubwayData } from "./hooks/useSubwayData";
import { ALL_GOOD_MESSAGES } from "./constants/lines";
import Header from "./components/Header";
import Trophy from "./components/Trophy";
import Podium from "./components/Podium";
import ShameChart from "./components/ShameChart";
import LineGrid from "./components/LineGrid";
import ScoringExplainer from "./components/ScoringExplainer";
import TrainChecker from "./components/TrainChecker";
import "./App.css";

export default function App() {
  const { data, loading, error, secondsUntilRefresh, refresh } = useSubwayData();

  const allGoodMsg = useMemo(
    () => ALL_GOOD_MESSAGES[Math.floor(Math.random() * ALL_GOOD_MESSAGES.length)],
    []
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white antialiased">
      <Header
        lastUpdated={data?.timestamp}
        secondsUntilRefresh={secondsUntilRefresh}
        onRefresh={refresh}
        loading={loading}
      />

      {/* Loading state (first load only) */}
      {loading && !data && (
        <div className="text-center py-20">
          <div className="inline-block w-8 h-8 border-2 border-gray-700 border-t-white rounded-full animate-spin" />
          <p className="text-gray-500 mt-4 text-sm">
            Checking which train is disappointing everyone...
          </p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="max-w-md mx-auto px-4 py-8">
          <div className="bg-red-950/50 border border-red-900 rounded-lg p-4 text-center">
            <p className="text-red-400 text-sm">
              Couldn't reach the MTA feeds. Even the data is delayed.
            </p>
            <button
              onClick={refresh}
              className="mt-3 px-4 py-1.5 bg-red-900/50 hover:bg-red-900 text-red-300 text-sm rounded transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Train checker — always show when data is loaded */}
      {data && <TrainChecker lines={data.lines} />}

      {/* Main content */}
      {data && (
        <>
          {data.winner ? (
            <>
              <Trophy winner={data.winner} />
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
          <LineGrid lines={data.lines} />
          <ScoringExplainer />
        </>
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
      </footer>
    </div>
  );
}
