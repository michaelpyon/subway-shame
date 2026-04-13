"""Database layer for subway-shame.

Owns connection pooling, schema migration, and all read/write queries.
All state lives in Postgres — no globals, no files.
"""

import hashlib
import json
import logging
import os
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone

log = logging.getLogger(__name__)

DATABASE_URL = os.environ.get("DATABASE_URL")

try:
    import psycopg2
    import psycopg2.extras
    import psycopg2.pool

    PSYCOPG2_AVAILABLE = True
except ImportError:
    PSYCOPG2_AVAILABLE = False

_pool = None


def _get_pool():
    """Lazily create a threaded connection pool."""
    global _pool
    if _pool is not None:
        return _pool
    if not PSYCOPG2_AVAILABLE or not DATABASE_URL:
        return None
    try:
        _pool = psycopg2.pool.ThreadedConnectionPool(
            minconn=1,
            maxconn=5,
            dsn=DATABASE_URL,
        )
        log.info("DB connection pool created")
        return _pool
    except Exception as e:
        log.warning("Failed to create DB pool: %s", e)
        return None


@contextmanager
def get_conn():
    """Context manager that checks out a connection from the pool.

    Usage:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(...)
    """
    pool = _get_pool()
    if pool is None:
        yield None
        return
    conn = pool.getconn()
    try:
        yield conn
    except Exception:
        conn.rollback()
        raise
    finally:
        pool.putconn(conn)


def db_available() -> bool:
    return PSYCOPG2_AVAILABLE and DATABASE_URL is not None


# ---------------------------------------------------------------------------
# Schema
# ---------------------------------------------------------------------------

_SCHEMA_SQL = """
-- Existing history table (kept for backward compat with /api/history)
CREATE TABLE IF NOT EXISTS scores_history (
    id SERIAL PRIMARY KEY,
    captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    line_id TEXT NOT NULL,
    score INTEGER NOT NULL DEFAULT 0,
    status TEXT,
    trip_count INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_scores_history_line_time
    ON scores_history(line_id, captured_at DESC);

-- Latest live snapshot (one row per line, upserted every ingest cycle)
CREATE TABLE IF NOT EXISTS mta_live_snapshot (
    line_id TEXT PRIMARY KEY,
    score INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Good Service',
    alerts JSONB NOT NULL DEFAULT '[]',
    breakdown JSONB NOT NULL DEFAULT '{}',
    by_direction JSONB NOT NULL DEFAULT '{}',
    trip_count INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Daily accumulation (one row per line per day)
CREATE TABLE IF NOT EXISTS mta_daily_scores (
    line_id TEXT NOT NULL,
    score_date DATE NOT NULL,
    daily_score INTEGER NOT NULL DEFAULT 0,
    breakdown JSONB NOT NULL DEFAULT '{}',
    by_direction JSONB NOT NULL DEFAULT '{}',
    peak_alerts JSONB NOT NULL DEFAULT '[]',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (line_id, score_date)
);

-- Timeseries (15-min buckets, one row per bucket per day)
CREATE TABLE IF NOT EXISTS mta_timeseries (
    score_date DATE NOT NULL,
    bucket TEXT NOT NULL,
    scores JSONB NOT NULL DEFAULT '{}',
    captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (score_date, bucket)
);

-- Raw snapshots for replay/debugging
CREATE TABLE IF NOT EXISTS raw_mta_snapshots (
    id SERIAL PRIMARY KEY,
    captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    content_hash TEXT NOT NULL,
    alerts_data JSONB NOT NULL,
    trip_counts JSONB NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_raw_snapshots_time
    ON raw_mta_snapshots(captured_at DESC);
"""


def init_db():
    """Run schema migration."""
    if not db_available():
        log.info("DATABASE_URL not set or psycopg2 unavailable — skipping DB init")
        return
    with get_conn() as conn:
        if conn is None:
            return
        conn.autocommit = True
        try:
            with conn.cursor() as cur:
                cur.execute(_SCHEMA_SQL)
            log.info("DB schema init complete")
        except Exception as e:
            log.warning("DB schema init failed: %s", e)


# ---------------------------------------------------------------------------
# Write helpers (used by ingest worker)
# ---------------------------------------------------------------------------

def write_raw_snapshot(alerts_data: dict, trip_counts: dict):
    """Store a raw MTA snapshot with content hash."""
    payload = json.dumps({"alerts": alerts_data, "trips": trip_counts}, sort_keys=True)
    content_hash = hashlib.sha256(payload.encode()).hexdigest()[:16]

    with get_conn() as conn:
        if conn is None:
            return
        conn.autocommit = True
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO raw_mta_snapshots (content_hash, alerts_data, trip_counts)
                   VALUES (%s, %s, %s)""",
                (content_hash, json.dumps(alerts_data), json.dumps(trip_counts)),
            )


def write_live_snapshot(lines: list[dict]):
    """Upsert the latest live snapshot for all lines."""
    with get_conn() as conn:
        if conn is None:
            return
        conn.autocommit = True
        with conn.cursor() as cur:
            for line in lines:
                cur.execute(
                    """INSERT INTO mta_live_snapshot
                           (line_id, score, status, alerts, breakdown, by_direction, trip_count, updated_at)
                       VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())
                       ON CONFLICT (line_id) DO UPDATE SET
                           score = EXCLUDED.score,
                           status = EXCLUDED.status,
                           alerts = EXCLUDED.alerts,
                           breakdown = EXCLUDED.breakdown,
                           by_direction = EXCLUDED.by_direction,
                           trip_count = EXCLUDED.trip_count,
                           updated_at = NOW()""",
                    (
                        line["id"],
                        line["score"],
                        line["status"],
                        json.dumps(line["alerts"]),
                        json.dumps(line["breakdown"]),
                        json.dumps(line["by_direction"]),
                        line["trip_count"],
                    ),
                )


def accumulate_daily(alerts_data: dict, today: str):
    """Add current alert scores to daily totals.

    Uses Postgres as the single source of truth — no globals.
    """
    from mta import ALL_LINES, add_to_breakdown

    with get_conn() as conn:
        if conn is None:
            return
        conn.autocommit = True
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            # Read current daily state for all lines
            cur.execute(
                """SELECT line_id, daily_score, breakdown, by_direction, peak_alerts
                   FROM mta_daily_scores
                   WHERE score_date = %s""",
                (today,),
            )
            existing = {row["line_id"]: row for row in cur.fetchall()}

            for line_id in ALL_LINES:
                ad = alerts_data.get(line_id, {})
                snapshot_score = ad.get("score", 0)
                snapshot_breakdown = ad.get("breakdown", {})
                snapshot_by_dir = ad.get("by_direction", {
                    "uptown": {"score": 0, "breakdown": {}},
                    "downtown": {"score": 0, "breakdown": {}},
                })
                snapshot_alerts = ad.get("alerts", [])

                if line_id in existing:
                    row = existing[line_id]
                    new_score = row["daily_score"] + snapshot_score

                    # Merge breakdowns
                    merged_bd = dict(row["breakdown"])
                    for cat, pts in snapshot_breakdown.items():
                        add_to_breakdown(merged_bd, cat, pts)

                    # Merge by_direction
                    merged_dir = dict(row["by_direction"])
                    for direction in ("uptown", "downtown"):
                        dir_data = snapshot_by_dir.get(direction, {"score": 0, "breakdown": {}})
                        merged_dir.setdefault(direction, {"score": 0, "breakdown": {}})
                        merged_dir[direction]["score"] = merged_dir[direction].get("score", 0) + dir_data.get("score", 0)
                        for cat, pts in dir_data.get("breakdown", {}).items():
                            merged_dir[direction].setdefault("breakdown", {})
                            add_to_breakdown(merged_dir[direction]["breakdown"], cat, pts)

                    # Peak alerts: keep the set with more alerts
                    peak = row["peak_alerts"]
                    if len(snapshot_alerts) > len(peak):
                        peak = snapshot_alerts

                    cur.execute(
                        """UPDATE mta_daily_scores
                           SET daily_score = %s, breakdown = %s, by_direction = %s,
                               peak_alerts = %s, updated_at = NOW()
                           WHERE line_id = %s AND score_date = %s""",
                        (
                            new_score,
                            json.dumps(merged_bd),
                            json.dumps(merged_dir),
                            json.dumps(peak),
                            line_id,
                            today,
                        ),
                    )
                else:
                    # First entry for this line today
                    peak = snapshot_alerts if snapshot_alerts else []
                    cur.execute(
                        """INSERT INTO mta_daily_scores
                               (line_id, score_date, daily_score, breakdown, by_direction, peak_alerts)
                           VALUES (%s, %s, %s, %s, %s, %s)""",
                        (
                            line_id,
                            today,
                            snapshot_score,
                            json.dumps(snapshot_breakdown),
                            json.dumps(snapshot_by_dir),
                            json.dumps(peak),
                        ),
                    )


def record_timeseries(alerts_data: dict, today: str, bucket: str):
    """Record a timeseries data point. Skips if bucket already exists."""
    from mta import ALL_LINES

    scores = {}
    for line_id, data in alerts_data.items():
        if line_id in ALL_LINES and data.get("score", 0) > 0:
            scores[line_id] = data["score"]

    with get_conn() as conn:
        if conn is None:
            return
        conn.autocommit = True
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO mta_timeseries (score_date, bucket, scores)
                   VALUES (%s, %s, %s)
                   ON CONFLICT (score_date, bucket) DO NOTHING""",
                (today, bucket, json.dumps(scores)),
            )


def write_history_rows(lines: list[dict]):
    """Insert rows into scores_history (backward compat with /api/history)."""
    with get_conn() as conn:
        if conn is None:
            return
        conn.autocommit = True
        rows = [
            (line["id"], line["score"], line["status"], line.get("trip_count", 0))
            for line in lines
        ]
        with conn.cursor() as cur:
            psycopg2.extras.execute_values(
                cur,
                """INSERT INTO scores_history (line_id, score, status, trip_count)
                   VALUES %s""",
                rows,
            )


# ---------------------------------------------------------------------------
# Read helpers (used by Flask API)
# ---------------------------------------------------------------------------

def read_live_snapshot() -> list[dict]:
    """Read the latest live snapshot for all lines."""
    with get_conn() as conn:
        if conn is None:
            return []
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("SELECT * FROM mta_live_snapshot ORDER BY line_id")
            return [dict(row) for row in cur.fetchall()]


def read_daily_scores(today: str) -> dict[str, dict]:
    """Read daily accumulated scores for all lines."""
    with get_conn() as conn:
        if conn is None:
            return {}
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                "SELECT * FROM mta_daily_scores WHERE score_date = %s",
                (today,),
            )
            return {row["line_id"]: dict(row) for row in cur.fetchall()}


def read_timeseries(today: str) -> list[dict]:
    """Read timeseries buckets for today."""
    with get_conn() as conn:
        if conn is None:
            return []
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """SELECT bucket AS time, scores
                   FROM mta_timeseries
                   WHERE score_date = %s
                   ORDER BY bucket""",
                (today,),
            )
            return [dict(row) for row in cur.fetchall()]


def read_last_ingest_time() -> datetime | None:
    """Return the timestamp of the most recent live snapshot update."""
    with get_conn() as conn:
        if conn is None:
            return None
        with conn.cursor() as cur:
            cur.execute("SELECT MAX(updated_at) FROM mta_live_snapshot")
            row = cur.fetchone()
            return row[0] if row and row[0] else None


def read_history(hours: int = 72) -> dict:
    """Read score history for /api/history endpoint."""
    with get_conn() as conn:
        if conn is None:
            return {"history": {}, "records": {}}
        try:
            cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute(
                    """SELECT line_id,
                              captured_at AT TIME ZONE 'UTC' AS t,
                              score
                       FROM scores_history
                       WHERE captured_at >= %s
                       ORDER BY line_id, captured_at ASC""",
                    (cutoff,),
                )
                rows = cur.fetchall()

                cur.execute(
                    """SELECT DISTINCT ON (line_id)
                           line_id, score AS current_score
                       FROM scores_history
                       ORDER BY line_id, captured_at DESC""",
                )
                current_rows = cur.fetchall()

            if rows:
                oldest = min(r["t"] for r in rows)
                days_back = max(1, int((datetime.now(timezone.utc) - oldest).total_seconds() / 86400) + 1)
            else:
                days_back = 0

            history: dict = {}
            for row in rows:
                lid = row["line_id"]
                history.setdefault(lid, []).append({
                    "t": row["t"].strftime("%Y-%m-%dT%H:%M:%SZ"),
                    "score": row["score"],
                })

            current_scores = {r["line_id"]: r["current_score"] for r in current_rows}
            max_in_window: dict = {}
            for row in rows:
                lid = row["line_id"]
                if lid not in max_in_window or row["score"] > max_in_window[lid]["worst_score"]:
                    max_in_window[lid] = {
                        "worst_score": row["score"],
                        "worst_at": row["t"].strftime("%Y-%m-%dT%H:%M:%SZ"),
                    }

            records: dict = {}
            for lid, curr in current_scores.items():
                if curr <= 0:
                    continue
                window = max_in_window.get(lid, {})
                worst = window.get("worst_score", 0)
                if curr >= worst and days_back > 0:
                    records[lid] = {
                        "worst_score": worst,
                        "worst_at": window.get("worst_at", ""),
                        "days_back": days_back,
                    }

            return {"history": history, "records": records}
        except Exception as e:
            log.warning("History read error: %s", e)
            return {"history": {}, "records": {}}
