import os
import json
import time
import logging
from datetime import datetime, timezone, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed

import requests as http_requests
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from google.transit import gtfs_realtime_pb2

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

        et_now = datetime.now(timezone(timedelta(hours=-5)))
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

    et_now = datetime.now(timezone(timedelta(hours=-5)))
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

    et_now = datetime.now(timezone(timedelta(hours=-5)))
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


def build_status() -> dict:
    """Build the full API response."""
    global _cache, _cache_time

    now = time.time()
    if _cache and (now - _cache_time) < CACHE_TTL:
        return _cache

    alerts_data = fetch_alerts()
    trip_counts = fetch_trip_counts()
    daily_data = _accumulate_daily(alerts_data)
    _record_timeseries(alerts_data)
    _save_state()

    lines = []
    for line_id in ALL_LINES:
        ad = alerts_data.get(line_id, {
            "score": 0, "alerts": [], "breakdown": {},
            "by_direction": {
                "uptown": {"score": 0, "breakdown": {}},
                "downtown": {"score": 0, "breakdown": {}},
            },
        })
        dd = daily_data.get(line_id, _empty_line_daily())
        lines.append({
            "id": line_id,
            "score": ad["score"],
            "daily_score": dd["daily_score"],
            "status": _status_label(ad["alerts"]),
            "alerts": ad["alerts"],
            "peak_alerts": dd["peak_alerts"],
            "breakdown": dd["breakdown"],          # daily accumulated
            "live_breakdown": ad["breakdown"],       # current snapshot
            "by_direction": dd["by_direction"],      # daily accumulated
            "live_by_direction": ad["by_direction"],  # current snapshot
            "trip_count": trip_counts.get(line_id, 0),
        })

    lines.sort(key=lambda l: (-l["daily_score"], -l["score"], l["id"]))

    # Build podium: top 3 places, but include all ties
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

    et_now = datetime.now(timezone(timedelta(hours=-5)))

    result = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "date": et_now.strftime("%A, %B %-d"),
        "winner": winner,
        "podium": podium,
        "lines": lines,
        "timeseries": get_timeseries(),
    }

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


_load_state()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    debug = os.environ.get("FLASK_ENV") != "production"
    app.run(debug=debug, host="0.0.0.0", port=port)
