import { useState, useMemo, useCallback } from "react";
import { getScoreTier } from "../constants/lines";
import LineBadge from "./LineBadge";

// The Hall of Shame. This is the only surface where Gold appears, and only as
// medals. It is collapsed by default so it never competes with the verdict.
// The record is private to this browser: it is the worst daily offender the
// visitor has personally seen, not a global database. We say so plainly.
const HOF_KEY = "subway-shame-hof";
const HOF_MAX = 50;

// Today in New York, as YYYY-MM-DD. The subway is an ET system and the masthead
// shows the ET date, so the Hall key must be ET too. Plain toISOString is UTC
// and rolls a day ahead after about 8pm ET, which would contradict the masthead.
function todayET() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date());
}

function loadHof() {
  try {
    const raw = localStorage.getItem(HOF_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToHof(winner) {
  try {
    const today = todayET();
    const existing = loadHof();
    const idx = existing.findIndex((e) => e.date === today);
    const entry = { date: today, lineId: winner.id, score: winner.daily_score };
    let updated;
    if (idx >= 0) {
      if (existing[idx].score < winner.daily_score) {
        updated = [...existing];
        updated[idx] = entry;
      } else {
        updated = existing;
      }
    } else {
      updated = [entry, ...existing].slice(0, HOF_MAX);
    }
    localStorage.setItem(HOF_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

function topHof(entries, n = 5) {
  return [...entries].sort((a, b) => b.score - a.score).slice(0, n);
}

const MEDAL = ["🥇", "🥈", "🥉"];

export default function HallOfShame({ winner }) {
  const [open, setOpen] = useState(false);
  // Bumping this re-derives the list after a reset, without an effect.
  const [resetCount, setResetCount] = useState(0);

  const winnerId = winner?.id;
  const winnerScore = winner?.daily_score || 0;

  // Persist today's villain (a localStorage write) and read the list back, in
  // one memo keyed on the winner. No effect, no cascading setState; the write is
  // idempotent so re-running it on a winner change is safe.
  const entries = useMemo(() => {
    // resetCount is a deliberate cache-bust: reading it forces a fresh load
    // after the user clears history.
    void resetCount;
    if (winnerScore > 0 && winnerId) {
      return saveToHof({ id: winnerId, daily_score: winnerScore });
    }
    return loadHof();
  }, [winnerId, winnerScore, resetCount]);

  const handleReset = useCallback(() => {
    localStorage.removeItem(HOF_KEY);
    setResetCount((n) => n + 1);
  }, []);

  const rows = topHof(entries);

  return (
    <section className="px-4 max-w-[672px] mx-auto">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="hall-of-shame-panel"
        className="press-scale w-full flex items-center justify-between gap-2 py-3 px-4"
        style={{
          backgroundColor: "var(--color-ballast)",
          border: "none",
          boxShadow: "0 0 0 1px var(--color-concrete)",
          cursor: "pointer",
        }}
      >
        <span className="kicker" style={{ color: "var(--color-gold)" }}>
          Hall of Shame
        </span>
        <span className="receipt" style={{ color: "var(--color-newsprint)" }}>
          {open ? "Hide" : `${entries.length} day${entries.length !== 1 ? "s" : ""} on record`}
        </span>
      </button>

      {open && (
        <div
          id="hall-of-shame-panel"
          className="p-4 mt-px"
          style={{ backgroundColor: "var(--color-ballast)", boxShadow: "0 0 0 1px var(--color-concrete)" }}
        >
          <p className="receipt mb-4" style={{ color: "var(--color-newsprint)" }}>
            Saved in your browser only. The worst line each day you visit, not a global record.
          </p>

          {rows.length === 0 ? (
            <p style={{ fontSize: "15px", color: "var(--color-newsprint)" }}>
              Nothing on record yet. Each day you check in, the worst line that day gets
              filed here. Come back tomorrow to start the list.
            </p>
          ) : (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {rows.map((entry, i) => {
                  const tier = getScoreTier(entry.score);
                  const d = new Date(entry.date + "T12:00:00");
                  const dateStr = d.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });
                  return (
                    <div
                      key={entry.date}
                      className="flex items-center gap-3 px-3 py-2.5"
                      style={{ backgroundColor: "var(--color-tunnel)", border: "1px solid var(--color-concrete)" }}
                    >
                      <span className="shrink-0 text-center" style={{ width: "24px", fontSize: "16px" }}>
                        {MEDAL[i] || (
                          <span className="font-display" style={{ color: "var(--color-newsprint)" }}>
                            {i + 1}
                          </span>
                        )}
                      </span>
                      <LineBadge lineId={entry.lineId} size="xs" />
                      <div className="flex-1 min-w-0">
                        <p style={{ fontSize: "15px", color: "var(--color-platform)" }}>The {entry.lineId}</p>
                        <p className="receipt" style={{ color: "var(--color-newsprint)" }}>{dateStr}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-display tabular" style={{ fontSize: "24px", color: tier.color }}>
                          {entry.score.toLocaleString()}
                        </span>
                        <span className="receipt ml-1" style={{ color: "var(--color-newsprint)" }}>pts</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              {entries.length > rows.length && (
                <p className="receipt mt-3" style={{ color: "var(--color-newsprint)" }}>
                  Top 5 of {entries.length} days on record
                </p>
              )}
              <button
                type="button"
                onClick={handleReset}
                className="receipt press-scale mt-4"
                style={{
                  color: "var(--color-newsprint)",
                  textDecoration: "underline",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px",
                }}
              >
                Reset history
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}
