import os
import json
import time
import logging
import threading
from contextlib import contextmanager
from datetime import datetime, timezone, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed
from zoneinfo import ZoneInfo

import requests as http_requests
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from google.transit import gtfs_realtime_pb2

try:
    import psycopg2
    import psycopg2.extras
    import psycopg2.pool
    PSYCOPG2_AVAILABLE = True
except ImportError:
    PSYCOPG2_AVAILABLE = False

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

ALERTS_URL = (
    "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/camsys%2Fsubway-alerts"
)

TRIP_FEED_URLS = {
    "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs": [
        "1", "2", "3", "4", "5", "6", "GS",
    ],
    "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-ace": [
        "A", "C", "E",
    ],
    "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-bdfm": [
        "B", "D", "F", "M",
    ],
    "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-g": ["G"],
    "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-jz": [
        "J", "Z",
    ],
    "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-l": ["L"],
    "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-nqrw": [
        "N", "Q", "R", "W",
    ],
    "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-si": ["SI"],
    "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-7": ["7"],
}

ALL_LINES = [
    "1", "2", "3", "4", "5", "6", "7",
    "A", "C", "E", "B", "D", "F", "M",
    "N", "Q", "R", "W", "G", "J", "Z",
    "L", "S", "SI",
]

# ---------------------------------------------------------------------------
# Text-based alert classification (MTA uses OTHER_EFFECT for everything)
# ---------------------------------------------------------------------------

CATEGORY_SCORES = {
    "No Service": 50,
    "Delays": 30,
    "Slow Speeds": 20,
    "Skip Stop": 15,
    "Rerouted": 15,
    "Runs Local": 10,
    "Reduced Freq": 10,
    "Planned Work": 5,
    "Platform Change": 2,
    "Other": 5,
}

# Ordered list: first match wins
_CATEGORY_RULES = [
    ("No Service",     ["no [", "no trains", "no service", "suspended", "out of service", "service suspended", "not running"]),
    ("Delays",         ["running with delays", "delays", "running late", "experiencing delays", "longer travel times", "slow speeds", "held at", "holding at", "held"]),
    ("Slow Speeds",    ["slow", "reduced speed", "running slowly"]),
    ("Skip Stop",      ["skip", "bypassing", "not stopping at", "skipping"]),
    ("Rerouted",       ["runs via", "reroute", "rerouted", "diverted", "alternate route"]),
    ("Runs Local",     ["runs local", "running local", "making local stops"]),
    ("Reduced Freq",   ["runs every", "less frequently", "reduced service", "fewer trains", "running every"]),
    ("Planned Work",   ["shuttle", "express skips"]),
    ("Platform Change", ["board from", "platform", "change at"]),
]

_UPTOWN_KEYWORDS = [
    "uptown", "northbound", "bronx-bound", "queens-bound",
    "flushing-bound", "court sq-bound",
]
_DOWNTOWN_KEYWORDS = [
    "downtown", "southbound", "manhattan-bound", "brooklyn-bound",
    "bedford-nostrand", "church av-bound",
]


def _classify_alert(header: str) -> tuple[str, int, str]:
    """Classify an alert by its header text.

    Returns (category, score, direction).
    Direction is one of: "uptown", "downtown", "both".
    """
    h = header.lower()

    # Category
    category = "Other"
    for cat, keywords in _CATEGORY_RULES:
        if any(kw in h for kw in keywords):
            category = cat
            break
    if category == "Other":
        log.info(f"Unclassified alert: {header[:100]}")
        return ("Other", 1, "both")
    score = CATEGORY_SCORES[category]

    # Direction
    has_up = any(kw in h for kw in _UPTOWN_KEYWORDS)
    has_down = any(kw in h for kw in _DOWNTOWN_KEYWORDS)
    if has_up and has_down:
        direction = "both"
    elif has_up:
        direction = "uptown"
    elif has_down:
        direction = "downtown"
    elif "both direction" in h:
        direction = "both"
    else:
        direction = "both"

    return category, score, direction


# Normalize various route_id values the MTA uses
ROUTE_NORMALIZE = {
    "GS": "S", "FS": "S", "H": "S",
    "SI": "SI", "SIR": "SI",
    "5X": "5", "6X": "6", "7X": "7", "FX": "F",
}

FETCH_TIMEOUT = 8
ET = ZoneInfo("America/New_York")

# ---------------------------------------------------------------------------
# Database (Postgres via psycopg2 — gracefully skipped if DATABASE_URL unset)
# ---------------------------------------------------------------------------

DATABASE_URL = os.environ.get("DATABASE_URL")
DB_POOL_MAX = int(os.environ.get("DB_POOL_MAX", "4"))
STATUS_CACHE_KEY = "status_response"
STATUS_REFRESH_LOCK_ID = 981247

_db_pool = None
_db_lock = threading.Lock()


def _get_db_pool():
    """Return a threaded connection pool for Postgres access."""
    global _db_pool
    if not PSYCOPG2_AVAILABLE or not DATABASE_URL:
        return None
    with _db_lock:
        try:
            if _db_pool is None:
                _db_pool = psycopg2.pool.ThreadedConnectionPool(
                    1,
                    max(DB_POOL_MAX, 1),
                    DATABASE_URL,
                )
        except Exception as e:
            log.warning("DB connect failed: %s", e)
            _db_pool = None
    return _db_pool


@contextmanager
def _db_connection():
    """Yield a pooled connection and return it safely afterwards."""
    pool = _get_db_pool()
    if pool is None:
        yield None
        return

    conn = None
    try:
        conn = pool.getconn()
        conn.autocommit = True
        yield conn
    finally:
        if conn is not None:
            try:
                pool.putconn(conn)
            except Exception:
                pass


def init_db():
    """Create the history and shared cache tables if they don't exist."""
    with _db_connection() as conn:
        if conn is None:
            log.info("DATABASE_URL not set or psycopg2 unavailable — skipping DB init")
            return
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS scores_history (
                        id SERIAL PRIMARY KEY,
                        captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                        line_id TEXT NOT NULL,
                        score INTEGER NOT NULL DEFAULT 0,
                        status TEXT,
                        trip_count INTEGER DEFAULT 0
                    );
                """)
                cur.execute("""
                    CREATE INDEX IF NOT EXISTS idx_scores_history_line_time
                    ON scores_history(line_id, captured_at DESC);
                """)
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS api_cache (
                        cache_key TEXT PRIMARY KEY,
                        payload JSONB NOT NULL,
                        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                    );
                """)
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS aggregate_runs (
                        run_key TEXT PRIMARY KEY,
                        snapshot_date DATE NOT NULL,
                        timeseries_bucket TEXT NOT NULL,
                        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                    );
                """)
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS daily_line_state (
                        snapshot_date DATE NOT NULL,
                        line_id TEXT NOT NULL,
                        daily_score INTEGER NOT NULL DEFAULT 0,
                        breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
                        by_direction JSONB NOT NULL DEFAULT
                            '{"uptown":{"score":0,"breakdown":{}},"downtown":{"score":0,"breakdown":{}}}'::jsonb,
                        peak_alerts JSONB NOT NULL DEFAULT '[]'::jsonb,
                        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                        PRIMARY KEY (snapshot_date, line_id)
                    );
                """)
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS timeseries_points (
                        snapshot_date DATE NOT NULL,
                        bucket TEXT NOT NULL,
                        scores JSONB NOT NULL,
                        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                        PRIMARY KEY (snapshot_date, bucket)
                    );
                """)
            log.info("DB init complete")
        except Exception as e:
            log.warning("DB init failed: %s", e)


def save_history(lines_snapshot: list[dict]):
    """Persist one row per line into scores_history."""
    with _db_connection() as conn:
        if conn is None:
            return
        try:
            rows = [
                (line["id"], line["score"], line["status"], line.get("trip_count", 0))
                for line in lines_snapshot
            ]
            with conn.cursor() as cur:
                psycopg2.extras.execute_values(
                    cur,
                    """
                    INSERT INTO scores_history (line_id, score, status, trip_count)
                    VALUES %s
                    """,
                    rows,
                )
        except Exception as e:
            log.warning("DB insert failed: %s", e)


def _load_cached_status_from_db(max_age_seconds: int) -> dict | None:
    """Return a fresh shared API payload from Postgres when available."""
    with _db_connection() as conn:
        if conn is None:
            return None
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT payload, updated_at
                    FROM api_cache
                    WHERE cache_key = %s
                    """,
                    (STATUS_CACHE_KEY,),
                )
                row = cur.fetchone()
        except Exception as e:
            log.warning("DB cache read failed: %s", e)
            return None

    if not row:
        return None

    payload, updated_at = row
    age_seconds = (datetime.now(timezone.utc) - updated_at).total_seconds()
    if age_seconds > max_age_seconds:
        return None
    return payload


def _store_cached_status_in_db(payload: dict) -> None:
    """Persist the latest API payload so workers can share it."""
    with _db_connection() as conn:
        if conn is None:
            return
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO api_cache (cache_key, payload, updated_at)
                    VALUES (%s, %s, NOW())
                    ON CONFLICT (cache_key) DO UPDATE SET
                        payload = EXCLUDED.payload,
                        updated_at = EXCLUDED.updated_at
                    """,
                    (STATUS_CACHE_KEY, psycopg2.extras.Json(payload)),
                )
        except Exception as e:
            log.warning("DB cache write failed: %s", e)


# ---------------------------------------------------------------------------
# Cache
# ---------------------------------------------------------------------------

_cache: dict = {}
_cache_time: float = 0
CACHE_TTL = 60

# ---------------------------------------------------------------------------
# Persistent storage
# ---------------------------------------------------------------------------

DATA_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data.json")


def _save_state():
    """Persist daily accumulation and time-series to disk."""
    state = {
        "daily_date": _daily_date,
        "daily_scores": _daily_scores,
        "daily_breakdown": _daily_breakdown,
        "daily_by_direction": _daily_by_direction,
        "daily_peak_alerts": _daily_peak_alerts,
        "ts_date": _ts_date,
        "ts_last_bucket": _ts_last_bucket,
        "timeseries": _timeseries,
    }
    try:
        tmp = DATA_FILE + ".tmp"
        with open(tmp, "w") as f:
            json.dump(state, f)
        os.replace(tmp, DATA_FILE)
    except Exception as e:
        log.warning("Failed to save state: %s", e)


def _load_state():
    """Restore state from disk on startup."""
    global _daily_scores, _daily_breakdown, _daily_by_direction
    global _daily_date, _daily_peak_alerts
    global _timeseries, _ts_date, _ts_last_bucket

    if not os.path.exists(DATA_FILE):
        return

    try:
        with open(DATA_FILE) as f:
            state = json.load(f)

        et_now = datetime.now(ET)
        today = et_now.strftime("%Y-%m-%d")

        # Only restore if it's the same day — otherwise start fresh
        if state.get("daily_date") == today:
            _daily_date = state["daily_date"]
            _daily_scores = state.get("daily_scores", {})
            _daily_breakdown = state.get("daily_breakdown", {})
            _daily_by_direction = state.get("daily_by_direction", {})
            _daily_peak_alerts = state.get("daily_peak_alerts", {})
            log.info("Restored daily state (%s) with %d scored lines",
                     today, sum(1 for v in _daily_scores.values() if v > 0))

        if state.get("ts_date") == today:
            _ts_date = state["ts_date"]
            _ts_last_bucket = state.get("ts_last_bucket", "")
            _timeseries = state.get("timeseries", [])
            log.info("Restored time-series: %d data points", len(_timeseries))

    except Exception as e:
        log.warning("Failed to load state: %s", e)


# ---------------------------------------------------------------------------
# Daily score accumulation
# ---------------------------------------------------------------------------

_daily_scores: dict[str, int] = {}
_daily_breakdown: dict[str, dict[str, int]] = {}
_daily_by_direction: dict[str, dict[str, dict]] = {}
_daily_date: str = ""
_daily_peak_alerts: dict[str, list] = {}


def _empty_line_daily():
    return {
        "daily_score": 0,
        "breakdown": {},
        "by_direction": {
            "uptown": {"score": 0, "breakdown": {}},
            "downtown": {"score": 0, "breakdown": {}},
        },
        "peak_alerts": [],
    }


def _add_to_breakdown(bd: dict, category: str, score: int):
    bd[category] = bd.get(category, 0) + score


def _accumulate_daily(alerts_data: dict[str, dict]) -> dict[str, dict]:
    """Add current snapshot to daily totals. Resets at midnight ET."""
    global _daily_scores, _daily_breakdown, _daily_by_direction
    global _daily_date, _daily_peak_alerts

    et_now = datetime.now(ET)
    today = et_now.strftime("%Y-%m-%d")

    if today != _daily_date:
        _daily_scores = {line: 0 for line in ALL_LINES}
        _daily_breakdown = {line: {} for line in ALL_LINES}
        _daily_by_direction = {
            line: {
                "uptown": {"score": 0, "breakdown": {}},
                "downtown": {"score": 0, "breakdown": {}},
            }
            for line in ALL_LINES
        }
        _daily_peak_alerts = {line: [] for line in ALL_LINES}
        _daily_date = today

    for line_id, data in alerts_data.items():
        if line_id not in ALL_LINES:
            continue
        _daily_scores[line_id] = _daily_scores.get(line_id, 0) + data["score"]

        # Accumulate breakdown
        for cat, pts in data.get("breakdown", {}).items():
            _add_to_breakdown(_daily_breakdown[line_id], cat, pts)

        # Accumulate by direction
        for direction in ("uptown", "downtown"):
            dir_data = data.get("by_direction", {}).get(direction, {})
            dir_score = dir_data.get("score", 0)
            _daily_by_direction[line_id][direction]["score"] += dir_score
            for cat, pts in dir_data.get("breakdown", {}).items():
                _add_to_breakdown(
                    _daily_by_direction[line_id][direction]["breakdown"], cat, pts
                )

        # Keep the worst set of alerts
        if len(data.get("alerts", [])) > len(_daily_peak_alerts.get(line_id, [])):
            _daily_peak_alerts[line_id] = data["alerts"][:]

    return {
        line: {
            "daily_score": _daily_scores.get(line, 0),
            "breakdown": _daily_breakdown.get(line, {}),
            "by_direction": _daily_by_direction.get(line, {
                "uptown": {"score": 0, "breakdown": {}},
                "downtown": {"score": 0, "breakdown": {}},
            }),
            "peak_alerts": _daily_peak_alerts.get(line, []),
        }
        for line in ALL_LINES
    }


# ---------------------------------------------------------------------------
# Time-series tracking (15-min buckets)
# ---------------------------------------------------------------------------

_timeseries: list[dict] = []  # [{time: "HH:MM", scores: {line: score, ...}}, ...]
_ts_date: str = ""
_ts_last_bucket: str = ""


def _record_timeseries(alerts_data: dict[str, dict]):
    """Record a snapshot into 15-min buckets. Only records once per bucket."""
    global _timeseries, _ts_date, _ts_last_bucket

    et_now = datetime.now(ET)
    today = et_now.strftime("%Y-%m-%d")

    # Reset at midnight
    if today != _ts_date:
        _timeseries = []
        _ts_date = today
        _ts_last_bucket = ""

    # Round to 15-min bucket
    minute = (et_now.minute // 15) * 15
    bucket = et_now.strftime("%H:") + f"{minute:02d}"

    if bucket == _ts_last_bucket:
        return  # already recorded this bucket

    _ts_last_bucket = bucket

    scores = {}
    for line_id, data in alerts_data.items():
        if data["score"] > 0:
            scores[line_id] = data["score"]

    _timeseries.append({
        "time": bucket,
        "scores": scores,
    })


def get_timeseries() -> list[dict]:
    """Return the time-series data for today."""
    return _timeseries


# ---------------------------------------------------------------------------
# MTA feed helpers
# ---------------------------------------------------------------------------

def _fetch_protobuf(url: str) -> gtfs_realtime_pb2.FeedMessage:
    resp = http_requests.get(url, timeout=FETCH_TIMEOUT)
    resp.raise_for_status()
    feed = gtfs_realtime_pb2.FeedMessage()
    feed.ParseFromString(resp.content)
    return feed


def _normalize_route(route_id: str) -> str | None:
    rid = ROUTE_NORMALIZE.get(route_id, route_id)
    return rid if rid in ALL_LINES else None


def _is_noise(header: str) -> bool:
    """Filter out planned work, schedule notices, and other non-delay alerts."""
    h = header.lower()
    return any(kw in h for kw in (
        "planned work", "planned service", "running on a",
        "schedule", "holiday service",
    ))


def fetch_alerts() -> dict[str, dict]:
    """Fetch the MTA alerts feed and compute per-line alert data with
    category breakdown and direction split.

    Returns per line:
    {
        "score": 30,
        "alerts": [{"text": "...", "category": "Delays", "score": 30, "direction": "uptown"}, ...],
        "breakdown": {"Delays": 30},
        "by_direction": {
            "uptown": {"score": 30, "breakdown": {"Delays": 30}},
            "downtown": {"score": 0, "breakdown": {}},
        }
    }
    """
    empty = lambda: {
        "score": 0,
        "alerts": [],
        "breakdown": {},
        "by_direction": {
            "uptown": {"score": 0, "breakdown": {}},
            "downtown": {"score": 0, "breakdown": {}},
        },
    }
    result: dict[str, dict] = {line: empty() for line in ALL_LINES}

    try:
        feed = _fetch_protobuf(ALERTS_URL)
    except Exception as exc:
        log.warning("Failed to fetch alerts feed: %s", exc)
        return result

    now = time.time()

    for entity in feed.entity:
        if not entity.HasField("alert"):
            continue
        alert = entity.alert

        # Header text
        header = ""
        for translation in alert.header_text.translation:
            if translation.language == "en" or not translation.language:
                header = translation.text
                break
        if not header and alert.header_text.translation:
            header = alert.header_text.translation[0].text
        if not header:
            continue

        # Skip noise
        if _is_noise(header):
            continue

        # Check active period
        active_now = False
        if len(alert.active_period) == 0:
            active_now = True
        else:
            for period in alert.active_period:
                start = period.start if period.start else 0
                end = period.end if period.end else float("inf")
                if start <= now <= end:
                    active_now = True
                    break
        if not active_now:
            continue

        # Classify by text
        category, score, direction = _classify_alert(header)

        # Which lines are affected?
        routes_affected = set()
        for ie in alert.informed_entity:
            if ie.route_id:
                norm = _normalize_route(ie.route_id)
                if norm:
                    routes_affected.add(norm)

        alert_obj = {
            "text": header,
            "category": category,
            "score": score,
            "direction": direction,
        }

        for route in routes_affected:
            r = result[route]
            r["score"] += score

            # Dedup alerts by text
            if not any(a["text"] == header for a in r["alerts"]):
                r["alerts"].append(alert_obj)

            # Breakdown
            _add_to_breakdown(r["breakdown"], category, score)

            # Direction split
            if direction == "both":
                # Split evenly across both directions
                half = score / 2
                for d in ("uptown", "downtown"):
                    r["by_direction"][d]["score"] += half
                    _add_to_breakdown(r["by_direction"][d]["breakdown"], category, half)
            else:
                r["by_direction"][direction]["score"] += score
                _add_to_breakdown(
                    r["by_direction"][direction]["breakdown"], category, score
                )

    # Round direction scores to ints
    for line_data in result.values():
        for d in ("uptown", "downtown"):
            dd = line_data["by_direction"][d]
            dd["score"] = int(round(dd["score"]))
            dd["breakdown"] = {
                k: int(round(v)) for k, v in dd["breakdown"].items()
            }

    return result


def fetch_trip_counts() -> dict[str, int]:
    """Fetch all trip-update feeds and count active trips per line."""
    counts: dict[str, int] = {line: 0 for line in ALL_LINES}

    def _fetch_one(url: str):
        try:
            feed = _fetch_protobuf(url)
            local_counts: dict[str, int] = {}
            for entity in feed.entity:
                if entity.HasField("trip_update"):
                    rid = _normalize_route(entity.trip_update.trip.route_id)
                    if rid:
                        local_counts[rid] = local_counts.get(rid, 0) + 1
            return local_counts
        except Exception as exc:
            log.warning("Failed to fetch trip feed %s: %s", url, exc)
            return {}

    with ThreadPoolExecutor(max_workers=6) as pool:
        futures = {pool.submit(_fetch_one, url): url for url in TRIP_FEED_URLS}
        for future in as_completed(futures):
            for route, count in future.result().items():
                counts[route] = counts.get(route, 0) + count

    return counts


def _status_label(alerts: list[dict]) -> str:
    """Pick the worst category from classified alerts as the status label."""
    if not alerts:
        return "Good Service"
    worst = max(alerts, key=lambda a: CATEGORY_SCORES.get(a["category"], 0))
    label_map = {
        "No Service": "Suspended",
        "Delays": "Delays",
        "Slow Speeds": "Slow Speeds",
        "Skip Stop": "Skip Stop",
        "Rerouted": "Rerouted",
        "Runs Local": "Runs Local",
        "Reduced Freq": "Fewer Trains",
        "Platform Change": "Platform Change",
        "Other": "Issues",
    }
    return label_map.get(worst["category"], "Issues")


def _empty_live_line() -> dict:
    return {
        "score": 0,
        "alerts": [],
        "breakdown": {},
        "by_direction": {
            "uptown": {"score": 0, "breakdown": {}},
            "downtown": {"score": 0, "breakdown": {}},
        },
    }


def _json_value(value, fallback):
    if value is None:
        return fallback
    if isinstance(value, str):
        try:
            return json.loads(value)
        except json.JSONDecodeError:
            return fallback
    return value


def _sample_bucket(et_now: datetime) -> str:
    return et_now.strftime("%Y-%m-%dT%H:%M")


def _timeseries_bucket(et_now: datetime) -> str:
    minute = (et_now.minute // 15) * 15
    return et_now.strftime("%H:") + f"{minute:02d}"


def _merge_breakdowns(existing: dict, incoming: dict) -> dict:
    merged = dict(existing or {})
    for category, score in (incoming or {}).items():
        merged[category] = int(round(merged.get(category, 0) + score))
    return merged


def _merge_daily_state(existing: dict, current: dict) -> dict:
    merged = {
        "daily_score": int(existing.get("daily_score", 0)),
        "breakdown": dict(existing.get("breakdown", {})),
        "by_direction": {
            "uptown": {
                "score": int(existing.get("by_direction", {}).get("uptown", {}).get("score", 0)),
                "breakdown": dict(existing.get("by_direction", {}).get("uptown", {}).get("breakdown", {})),
            },
            "downtown": {
                "score": int(existing.get("by_direction", {}).get("downtown", {}).get("score", 0)),
                "breakdown": dict(existing.get("by_direction", {}).get("downtown", {}).get("breakdown", {})),
            },
        },
        "peak_alerts": list(existing.get("peak_alerts", [])),
    }

    merged["daily_score"] += int(current.get("score", 0))
    merged["breakdown"] = _merge_breakdowns(merged["breakdown"], current.get("breakdown", {}))

    for direction in ("uptown", "downtown"):
        current_direction = current.get("by_direction", {}).get(direction, {})
        merged["by_direction"][direction]["score"] += int(current_direction.get("score", 0))
        merged["by_direction"][direction]["breakdown"] = _merge_breakdowns(
            merged["by_direction"][direction]["breakdown"],
            current_direction.get("breakdown", {}),
        )

    if len(current.get("alerts", [])) > len(merged["peak_alerts"]):
        merged["peak_alerts"] = current["alerts"][:]

    return merged


def _load_daily_state_from_db(cur, snapshot_date: str) -> dict[str, dict]:
    cur.execute(
        """
        SELECT line_id, daily_score, breakdown, by_direction, peak_alerts
        FROM daily_line_state
        WHERE snapshot_date = %s
        """,
        (snapshot_date,),
    )
    rows = cur.fetchall()

    daily_data = {line: _empty_line_daily() for line in ALL_LINES}
    for row in rows:
        daily_data[row["line_id"]] = {
            "daily_score": int(row["daily_score"]),
            "breakdown": _json_value(row["breakdown"], {}),
            "by_direction": _json_value(row["by_direction"], _empty_line_daily()["by_direction"]),
            "peak_alerts": _json_value(row["peak_alerts"], []),
        }
    return daily_data


def _load_timeseries_from_db(cur, snapshot_date: str) -> list[dict]:
    cur.execute(
        """
        SELECT bucket, scores
        FROM timeseries_points
        WHERE snapshot_date = %s
        ORDER BY bucket ASC
        """,
        (snapshot_date,),
    )
    rows = cur.fetchall()
    return [
        {
            "time": row["bucket"],
            "scores": _json_value(row["scores"], {}),
        }
        for row in rows
    ]


def _persist_db_aggregates(cur, snapshot_date: str, run_key: str, bucket: str, alerts_data: dict[str, dict]) -> None:
    cur.execute(
        """
        INSERT INTO aggregate_runs (run_key, snapshot_date, timeseries_bucket)
        VALUES (%s, %s, %s)
        ON CONFLICT (run_key) DO NOTHING
        RETURNING run_key
        """,
        (run_key, snapshot_date, bucket),
    )
    inserted = cur.fetchone()
    if not inserted:
        return

    existing = _load_daily_state_from_db(cur, snapshot_date)
    rows = []
    for line_id in ALL_LINES:
        current = alerts_data.get(line_id, _empty_live_line())
        merged = _merge_daily_state(existing.get(line_id, _empty_line_daily()), current)
        rows.append(
            (
                snapshot_date,
                line_id,
                merged["daily_score"],
                psycopg2.extras.Json(merged["breakdown"]),
                psycopg2.extras.Json(merged["by_direction"]),
                psycopg2.extras.Json(merged["peak_alerts"]),
            )
        )

    psycopg2.extras.execute_values(
        cur,
        """
        INSERT INTO daily_line_state (
            snapshot_date, line_id, daily_score, breakdown, by_direction, peak_alerts
        )
        VALUES %s
        ON CONFLICT (snapshot_date, line_id) DO UPDATE SET
            daily_score = EXCLUDED.daily_score,
            breakdown = EXCLUDED.breakdown,
            by_direction = EXCLUDED.by_direction,
            peak_alerts = EXCLUDED.peak_alerts,
            updated_at = NOW()
        """,
        rows,
    )

    scores = {
        line_id: data["score"]
        for line_id, data in alerts_data.items()
        if data.get("score", 0) > 0
    }
    cur.execute(
        """
        INSERT INTO timeseries_points (snapshot_date, bucket, scores)
        VALUES (%s, %s, %s)
        ON CONFLICT (snapshot_date, bucket) DO NOTHING
        """,
        (snapshot_date, bucket, psycopg2.extras.Json(scores)),
    )


def _build_lines_payload(alerts_data: dict[str, dict], trip_counts: dict[str, int], daily_data: dict[str, dict]) -> list[dict]:
    lines = []
    for line_id in ALL_LINES:
        ad = alerts_data.get(line_id, _empty_live_line())
        dd = daily_data.get(line_id, _empty_line_daily())
        lines.append({
            "id": line_id,
            "score": ad["score"],
            "daily_score": dd["daily_score"],
            "status": _status_label(ad["alerts"]),
            "alerts": ad["alerts"],
            "peak_alerts": dd["peak_alerts"],
            "breakdown": dd["breakdown"],
            "live_breakdown": ad["breakdown"],
            "by_direction": dd["by_direction"],
            "live_by_direction": ad["by_direction"],
            "trip_count": trip_counts.get(line_id, 0),
        })
    lines.sort(key=lambda l: (-l["daily_score"], -l["score"], l["id"]))
    return lines


def _build_result(lines: list[dict], timeseries: list[dict], et_now: datetime) -> dict:
    scored = [line for line in lines if line["daily_score"] > 0]
    podium = []
    place = 0
    prev_score = None
    for line in scored:
        if line["daily_score"] != prev_score:
            place = len(podium) + 1
            prev_score = line["daily_score"]
        if place > 3:
            break
        podium.append(line)

    winner = lines[0] if lines and lines[0]["daily_score"] > 0 else None
    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "date": et_now.strftime("%A, %B %-d"),
        "winner": winner,
        "podium": podium,
        "lines": lines,
        "timeseries": timeseries,
    }


def _build_status_local() -> dict:
    alerts_data = fetch_alerts()
    trip_counts = fetch_trip_counts()
    daily_data = _accumulate_daily(alerts_data)
    _record_timeseries(alerts_data)
    _save_state()
    lines = _build_lines_payload(alerts_data, trip_counts, daily_data)
    try:
        save_history([
            {"id": line["id"], "score": line["score"], "status": line["status"], "trip_count": line.get("trip_count", 0)}
            for line in lines
        ])
    except Exception:
        pass
    return _build_result(lines, get_timeseries(), datetime.now(ET))


def _build_status_with_db() -> dict:
    with _db_connection() as conn:
        if conn is None:
            return _build_status_local()

        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("SELECT pg_advisory_lock(%s)", (STATUS_REFRESH_LOCK_ID,))
            try:
                shared_cache = _load_cached_status_from_db(CACHE_TTL)
                if shared_cache:
                    return shared_cache

                et_now = datetime.now(ET)
                snapshot_date = et_now.strftime("%Y-%m-%d")
                run_key = _sample_bucket(et_now)
                bucket = _timeseries_bucket(et_now)

                alerts_data = fetch_alerts()
                trip_counts = fetch_trip_counts()
                _persist_db_aggregates(cur, snapshot_date, run_key, bucket, alerts_data)
                daily_data = _load_daily_state_from_db(cur, snapshot_date)
                timeseries = _load_timeseries_from_db(cur, snapshot_date)
                lines = _build_lines_payload(alerts_data, trip_counts, daily_data)

                try:
                    save_history([
                        {"id": line["id"], "score": line["score"], "status": line["status"], "trip_count": line.get("trip_count", 0)}
                        for line in lines
                    ])
                except Exception:
                    pass

                result = _build_result(lines, timeseries, et_now)
                _store_cached_status_in_db(result)
                return result
            finally:
                cur.execute("SELECT pg_advisory_unlock(%s)", (STATUS_REFRESH_LOCK_ID,))


def build_status() -> dict:
    """Build the full API response."""
    global _cache, _cache_time

    now = time.time()
    if _cache and (now - _cache_time) < CACHE_TTL:
        return _cache

    try:
        result = _build_status_with_db() if PSYCOPG2_AVAILABLE and DATABASE_URL else _build_status_local()
    except Exception as exc:
        log.warning("Falling back to local status build: %s", exc)
        result = _build_status_local()

    _cache = result
    _cache_time = time.time()
    return result


# ---------------------------------------------------------------------------
# Flask app
# ---------------------------------------------------------------------------

# In Docker, static files are at ./static/; locally at ../frontend/dist
_static = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
if not os.path.isdir(_static):
    _static = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "frontend", "dist")

app = Flask(
    __name__,
    static_folder=_static,
    static_url_path="",
)
CORS(app)


@app.route("/api/status")
def api_status():
    return jsonify(build_status())


@app.route("/api/history")
def api_history():
    """Return last N hours of per-line score snapshots + record badges."""
    try:
        hours = int(request.args.get("hours", 72))
    except (ValueError, TypeError):
        hours = 72

    empty_response = {"history": {}, "records": {}}

    if not PSYCOPG2_AVAILABLE or not DATABASE_URL:
        return jsonify(empty_response)

    with _db_connection() as conn:
        if conn is None:
            return jsonify(empty_response)

        try:
            cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)

            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                # Fetch all rows in the window
                cur.execute("""
                    SELECT line_id,
                           captured_at AT TIME ZONE 'UTC' AS t,
                           score
                    FROM scores_history
                    WHERE captured_at >= %s
                    ORDER BY line_id, captured_at ASC
                """, (cutoff,))
                rows = cur.fetchall()

                # Also fetch current live scores (most recent snapshot per line)
                cur.execute("""
                    SELECT DISTINCT ON (line_id)
                        line_id,
                        score AS current_score
                    FROM scores_history
                    ORDER BY line_id, captured_at DESC
                """)
                current_rows = cur.fetchall()

            # How many days of data do we have?
            if rows:
                oldest = min(r["t"] for r in rows)
                newest = datetime.now(timezone.utc)
                days_back = max(1, int((newest - oldest).total_seconds() / 86400) + 1)
            else:
                days_back = 0

            # Group history by line_id
            history: dict = {}
            for row in rows:
                lid = row["line_id"]
                if lid not in history:
                    history[lid] = []
                history[lid].append({
                    "t": row["t"].strftime("%Y-%m-%dT%H:%M:%SZ"),
                    "score": row["score"],
                })

            # Build records: for each line with current_score > 0, check if it's a new high
            current_scores = {r["line_id"]: r["current_score"] for r in current_rows}

            # Compute max score in the window per line
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

            return jsonify({"history": history, "records": records})

        except Exception as e:
            log.warning("History endpoint error: %s", e)
            return jsonify(empty_response)


@app.route("/api/health")
def api_health():
    return jsonify({"ok": True})


@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path):
    try:
        return send_from_directory(app.static_folder, path)
    except Exception:
        return send_from_directory(app.static_folder, "index.html")


if not (PSYCOPG2_AVAILABLE and DATABASE_URL):
    _load_state()
init_db()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    debug = os.environ.get("FLASK_ENV") != "production"
    app.run(debug=debug, host="0.0.0.0", port=port)
