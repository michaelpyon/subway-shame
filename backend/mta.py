"""MTA feed fetching and alert classification.

Pure data-fetching module — no state, no DB, no Flask.
"""

import logging
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

import requests as http_requests
from google.transit import gtfs_realtime_pb2

log = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

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

ROUTE_NORMALIZE = {
    "GS": "S", "FS": "S", "H": "S",
    "SI": "SI", "SIR": "SI",
    "5X": "5", "6X": "6", "7X": "7", "FX": "F",
}

FETCH_TIMEOUT = 8

STATUS_LABEL_MAP = {
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


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def classify_alert(header: str) -> tuple[str, int, str]:
    """Classify an alert by its header text.

    Returns (category, score, direction).
    Direction is one of: "uptown", "downtown", "both".
    """
    h = header.lower()

    category = "Other"
    for cat, keywords in _CATEGORY_RULES:
        if any(kw in h for kw in keywords):
            category = cat
            break
    if category == "Other":
        log.info("Unclassified alert: %s", header[:100])
        return ("Other", 1, "both")
    score = CATEGORY_SCORES[category]

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


def normalize_route(route_id: str) -> str | None:
    rid = ROUTE_NORMALIZE.get(route_id, route_id)
    return rid if rid in ALL_LINES else None


def status_label(alerts: list[dict]) -> str:
    """Pick the worst category from classified alerts as the status label."""
    if not alerts:
        return "Good Service"
    worst = max(alerts, key=lambda a: CATEGORY_SCORES.get(a["category"], 0))
    return STATUS_LABEL_MAP.get(worst["category"], "Issues")


def add_to_breakdown(bd: dict, category: str, score: int | float):
    bd[category] = bd.get(category, 0) + score


def _is_noise(header: str) -> bool:
    h = header.lower()
    return any(kw in h for kw in (
        "planned work", "planned service", "running on a",
        "schedule", "holiday service",
    ))


def _fetch_protobuf(url: str) -> gtfs_realtime_pb2.FeedMessage:
    resp = http_requests.get(url, timeout=FETCH_TIMEOUT)
    resp.raise_for_status()
    feed = gtfs_realtime_pb2.FeedMessage()
    feed.ParseFromString(resp.content)
    return feed


# ---------------------------------------------------------------------------
# Feed fetching
# ---------------------------------------------------------------------------

def fetch_alerts() -> dict[str, dict]:
    """Fetch the MTA alerts feed and compute per-line alert data."""
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

        header = ""
        for translation in alert.header_text.translation:
            if translation.language == "en" or not translation.language:
                header = translation.text
                break
        if not header and alert.header_text.translation:
            header = alert.header_text.translation[0].text
        if not header:
            continue

        if _is_noise(header):
            continue

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

        category, score, direction = classify_alert(header)

        routes_affected = set()
        for ie in alert.informed_entity:
            if ie.route_id:
                norm = normalize_route(ie.route_id)
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

            if not any(a["text"] == header for a in r["alerts"]):
                r["alerts"].append(alert_obj)

            add_to_breakdown(r["breakdown"], category, score)

            if direction == "both":
                half = score / 2
                for d in ("uptown", "downtown"):
                    r["by_direction"][d]["score"] += half
                    add_to_breakdown(r["by_direction"][d]["breakdown"], category, half)
            else:
                r["by_direction"][direction]["score"] += score
                add_to_breakdown(
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
                    rid = normalize_route(entity.trip_update.trip.route_id)
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
