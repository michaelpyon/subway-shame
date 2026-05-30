// Vercel serverless function: GET /api/status
//
// Makes The Low Line self-contained on Vercel. Fetches the public MTA
// GTFS-realtime feeds directly (no API key, no separate Railway service) and
// returns the exact JSON shape the React frontend already consumes from
// /api/status. See api/_mta.js for the feed URLs and scoring logic.
//
// STATELESS SCORING NOTE (for Michael):
// The original Flask + Postgres backend accumulated CUMULATIVE DAILY shame
// points across 60s polls. Serverless functions have no persistent state, so
// this returns a CURRENT-SNAPSHOT severity ranking instead (active alerts +
// delays right now), and sets daily_score = current score so the UI works
// unchanged. For real cumulative daily scoring you need a datastore. Cheap
// options that do not require new credentials in code: Vercel KV / Upstash
// Redis (a poll writes the running total, this handler reads it), or a Vercel
// Cron job hitting an ingest route every minute. Flag this as a follow-up; do
// not add an external DB dependency without your keys.

import { buildStatus } from "./_mta.js";

export default async function handler(req, res) {
  try {
    const status = await buildStatus();
    // Cache at the edge so we stay fast and do not hammer the MTA feeds.
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=45, stale-while-revalidate=60"
    );
    res.setHeader("Content-Type", "application/json");
    res.status(200).send(JSON.stringify(status));
  } catch (err) {
    console.error("status handler failed:", err);
    // Let the frontend's honest down-state (iter1) take over.
    res.status(503).json({ error: "MTA feed unavailable", detail: String(err && err.message) });
  }
}
