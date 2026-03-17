"""MTA ingest worker.

Polls MTA feeds on a fixed cadence and writes all state to Postgres.
Can run standalone (`python ingest.py`) or as a background thread.

No Flask dependency — this module only uses mta.py and db.py.
"""

import logging
import signal
import sys
import threading
import time
from datetime import datetime, timedelta, timezone

from mta import ALL_LINES, fetch_alerts, fetch_trip_counts, status_label
import db

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [ingest] %(levelname)s %(message)s",
)
log = logging.getLogger(__name__)

INGEST_INTERVAL = int(
    # Default: poll every 60 seconds
    __import__("os").environ.get("INGEST_INTERVAL_SECONDS", "60")
)

ET = timezone(timedelta(hours=-5))

_shutdown = threading.Event()


def run_once():
    """Execute a single ingest cycle: fetch → compute → write."""
    start = time.monotonic()

    # 1. Fetch raw data from MTA
    alerts_data = fetch_alerts()
    trip_counts = fetch_trip_counts()

    # 2. Store raw snapshot
    try:
        db.write_raw_snapshot(alerts_data, trip_counts)
    except Exception as e:
        log.warning("Failed to write raw snapshot: %s", e)

    # 3. Compute live snapshot rows
    lines = []
    for line_id in ALL_LINES:
        ad = alerts_data.get(line_id, {
            "score": 0, "alerts": [], "breakdown": {},
            "by_direction": {
                "uptown": {"score": 0, "breakdown": {}},
                "downtown": {"score": 0, "breakdown": {}},
            },
        })
        lines.append({
            "id": line_id,
            "score": ad["score"],
            "status": status_label(ad["alerts"]),
            "alerts": ad["alerts"],
            "breakdown": ad["breakdown"],
            "by_direction": ad["by_direction"],
            "trip_count": trip_counts.get(line_id, 0),
        })

    # 4. Write live snapshot
    try:
        db.write_live_snapshot(lines)
    except Exception as e:
        log.warning("Failed to write live snapshot: %s", e)

    # 5. Accumulate daily scores
    et_now = datetime.now(ET)
    today = et_now.strftime("%Y-%m-%d")
    try:
        db.accumulate_daily(alerts_data, today)
    except Exception as e:
        log.warning("Failed to accumulate daily: %s", e)

    # 6. Record timeseries bucket
    minute = (et_now.minute // 15) * 15
    bucket = et_now.strftime("%H:") + f"{minute:02d}"
    try:
        db.record_timeseries(alerts_data, today, bucket)
    except Exception as e:
        log.warning("Failed to record timeseries: %s", e)

    # 7. Write to scores_history (backward compat with /api/history)
    try:
        db.write_history_rows([
            {"id": l["id"], "score": l["score"], "status": l["status"], "trip_count": l["trip_count"]}
            for l in lines
        ])
    except Exception as e:
        log.warning("Failed to write history rows: %s", e)

    elapsed = time.monotonic() - start
    active = sum(1 for l in lines if l["score"] > 0)
    log.info(
        "Ingest cycle complete: %d lines with alerts, %.1fs elapsed",
        active,
        elapsed,
    )


def run_loop():
    """Run ingest in a loop until shutdown."""
    log.info("Starting ingest loop (interval=%ds)", INGEST_INTERVAL)
    while not _shutdown.is_set():
        try:
            run_once()
        except Exception as e:
            log.error("Ingest cycle failed: %s", e, exc_info=True)

        _shutdown.wait(timeout=INGEST_INTERVAL)

    log.info("Ingest loop stopped")


def start_background():
    """Start the ingest loop in a daemon thread. Returns the thread."""
    t = threading.Thread(target=run_loop, daemon=True, name="mta-ingest")
    t.start()
    log.info("Background ingest thread started")
    return t


def stop():
    """Signal the ingest loop to stop."""
    _shutdown.set()


# ---------------------------------------------------------------------------
# Standalone entrypoint
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    def _handle_signal(sig, frame):
        log.info("Received signal %s, shutting down...", sig)
        stop()

    signal.signal(signal.SIGINT, _handle_signal)
    signal.signal(signal.SIGTERM, _handle_signal)

    if not db.db_available():
        log.error("DATABASE_URL not set — cannot run ingest without a database")
        sys.exit(1)

    db.init_db()

    # Run one cycle immediately, then loop
    run_loop()
