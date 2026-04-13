"""Subway Shame — Flask API server (read-only).

All MTA polling and state accumulation happens in the ingest worker.
This server reads from Postgres only. No globals, no file I/O, no MTA calls.
"""

import logging
import os
import time
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

import db
from mta import ALL_LINES

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

CACHE_TTL = 60
ET = ZoneInfo("America/New_York")

# In-process response cache (safe: it's read-only, just avoids repeated DB reads)
_cache: dict = {}
_cache_time: float = 0

# Whether to start the ingest worker in-process (for single-dyno deploys)
RUN_INGEST = os.environ.get("RUN_INGEST", "").lower() in ("1", "true", "yes")


# ---------------------------------------------------------------------------
# API response builder (read-only)
# ---------------------------------------------------------------------------

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


def build_status() -> dict:
    """Build the full API response by reading from Postgres.

    No MTA calls, no global state mutation.
    """
    global _cache, _cache_time

    now = time.time()
    if _cache and (now - _cache_time) < CACHE_TTL:
        return _cache

    et_now = datetime.now(ET)
    today = et_now.strftime("%Y-%m-%d")

    # Read latest live snapshot
    live_rows = db.read_live_snapshot()
    live_by_line = {row["line_id"]: row for row in live_rows}

    # Read daily accumulated scores
    daily_data = db.read_daily_scores(today)

    # Read timeseries
    timeseries = db.read_timeseries(today)

    lines = []
    for line_id in ALL_LINES:
        live = live_by_line.get(line_id, {})
        dd = daily_data.get(line_id, {})

        lines.append({
            "id": line_id,
            "score": live.get("score", 0),
            "daily_score": dd.get("daily_score", 0),
            "status": live.get("status", "Good Service"),
            "alerts": live.get("alerts", []),
            "peak_alerts": dd.get("peak_alerts", []),
            "breakdown": dd.get("breakdown", {}),
            "live_breakdown": live.get("breakdown", {}),
            "by_direction": dd.get("by_direction", {
                "uptown": {"score": 0, "breakdown": {}},
                "downtown": {"score": 0, "breakdown": {}},
            }),
            "live_by_direction": live.get("by_direction", {
                "uptown": {"score": 0, "breakdown": {}},
                "downtown": {"score": 0, "breakdown": {}},
            }),
            "trip_count": live.get("trip_count", 0),
        })

    lines.sort(key=lambda l: (-l["daily_score"], -l["score"], l["id"]))

    # Build podium
    scored = [l for l in lines if l["daily_score"] > 0]
    podium = []
    place = 0
    prev_score = None
    for l in scored:
        if l["daily_score"] != prev_score:
            place = len(podium) + 1
            prev_score = l["daily_score"]
        if place > 3:
            break
        podium.append(l)
    winner = lines[0] if lines and lines[0]["daily_score"] > 0 else None

    result = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "date": et_now.strftime("%A, %B %-d"),
        "winner": winner,
        "podium": podium,
        "lines": lines,
        "timeseries": timeseries,
    }

    _cache = result
    _cache_time = time.time()
    return result


# ---------------------------------------------------------------------------
# Flask app
# ---------------------------------------------------------------------------

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
    return jsonify(db.read_history(hours))


@app.route("/api/health")
def api_health():
    """Health check with ingest freshness."""
    last_ingest = db.read_last_ingest_time()
    stale = True
    if last_ingest:
        age_seconds = (datetime.now(timezone.utc) - last_ingest).total_seconds()
        stale = age_seconds > 300  # Stale if no ingest in 5 minutes
    else:
        age_seconds = None

    return jsonify({
        "ok": True,
        "db": db.db_available(),
        "last_ingest_age_seconds": int(age_seconds) if age_seconds is not None else None,
        "ingest_stale": stale,
    })


@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path):
    try:
        return send_from_directory(app.static_folder, path)
    except Exception:
        return send_from_directory(app.static_folder, "index.html")


# ---------------------------------------------------------------------------
# Startup
# ---------------------------------------------------------------------------

db.init_db()

if RUN_INGEST:
    import ingest
    ingest.start_background()
    log.info("In-process ingest worker started (RUN_INGEST=1)")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    debug = os.environ.get("FLASK_ENV") != "production"
    app.run(debug=debug, host="0.0.0.0", port=port)
