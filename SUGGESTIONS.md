# The Low Line (subway-shame): Audience Pass Suggestions

Live URL: https://subway-shame.vercel.app
Repo HEAD is the source of truth. The live URL still serves an OLDER build (see Deploy Gap below).

## The one evangelist

The angry NYC commuter who just lost 20 minutes on a platform and reaches for their phone. Concretely, a regular poster in r/nyc or r/nycrail, or someone in a borough group chat, who already screenshots the MTA alerts page and the "Subway Service Status" widget when their line melts down. They do not want a transit-nerd dashboard. They want one number and one villain: "the F is the worst line in NYC right now, here is the receipt." What makes them screenshot it: a bold, share-ready card that names today's worst line, a tier label with attitude (Dumpster Fire, Pain Train), and an OG image so the pasted link in the group chat renders the villain automatically. What makes them bounce in 5 seconds: a blank screen or spinner, a chart that says "check back later", numbers that do not match what they are living through right now, or any whiff of fake data. This audience is allergic to made-up authority, so the score and the copy have to be honest about what they measure.

## Ground truth (repo HEAD)

Status: works end to end and the data is REAL and honest. No fabrication found.

Evidence:
- Data source is real. `frontend/api/_mta.js` fetches the public MTA GTFS-realtime protobuf feeds directly (9 trip feeds plus the alerts feed, no API key), decodes them with `gtfs-realtime-bindings`, classifies alert text into categories, and scores each line. `frontend/api/status.js` serves that as `/api/status`. This is the prior pass's Railway-to-Vercel serverless port, so the app is self-contained with no dead backend dependency.
- Honesty about statelessness is already documented in code. The `status.js` and `_mta.js` headers state plainly that serverless cannot accumulate a cumulative daily total, so the backend returns a CURRENT-SNAPSHOT severity score and sets `daily_score` equal to the current score.
- Down state is honest. `frontend/src/components/OfflineState.jsx` and the soft error banner in `App.jsx` show last-known or a clear retry state rather than inventing numbers. The prior pass already killed the fabricated PREVIEW_LINES data.
- OG share card is real and on-brand. `frontend/api/og.jsx` renders today's actual worst line from the same `/api/status` JSON, with an on-brand fallback if the feed is down so a pasted link never 500s.
- No fake authority claims, no example.com links, no pseudo-random score generator, no hardcoded-as-live values.

The one real problem found this pass (now fixed): the UI copy and the score tiers still described the OLD cumulative daily model after the backend became a live snapshot. The explainer claimed "every 5 minutes the app adds points", "scores reset at midnight", "300 pts equals 50 minutes of delays", and the tier thresholds were 300 / 1500 / 5000. With snapshot scoring a single line tops out around 95 to a few hundred points, so those tiers were unreachable and the accumulation story was false. That is a real honesty gap for the evangelist, who would notice the number does not behave the way the page says. Fixed in this pass (see Quick win shipped).

## Deploy gap (FLAG, do not re-fix)

The live site is an older build than repo HEAD. Evidence:
- Live `<title>` is "The Low Line — NYC Subway Delay Tracker" with an em dash; repo HEAD title is "The Low Line: NYC Subway Delay Tracker" (em dash removed in commit 0652590).
- Live `/api/status` returns NOT_FOUND, so the Vercel serverless port (commits 541f77f, 756b1ca) has never been deployed. The live app is still pointing at the dead Railway backend model.

Action for Michael: deploy repo HEAD to Vercel. Until then the live URL does not reflect any of the prior pass work or this pass. Every item below that says "deploy to verify" is gated on that one deploy.

## Plan

### Quick win shipped this pass (S, deploy to verify)
Make the score model honest end to end. The backend is a live snapshot, so the UI now says so.
- `frontend/src/constants/lines.js`: recalibrated `SCORE_TIERS` from 300 / 1500 / 5000 (cumulative) to 30 / 60 / 120 (snapshot), and rewrote the doc comment.
- `frontend/api/og.jsx`: matched the OG card's tier thresholds to the new snapshot values so the share image label is correct.
- `frontend/src/components/ScoringExplainer.jsx`: rewrote "how it works", the tier legend label, the per-alert label, the stacking note, and the accumulation note to describe a snapshot rather than midnight accumulation.
- `frontend/src/components/ShameChart.jsx`: retitled to "Live Shame Snapshot" and replaced the "chart builds throughout the day / check back in 15 min" copy, which would never come true statelessly.
- `frontend/src/components/Trophy.jsx`: changed the winner meta from "accumulated today / resets at midnight" to "live right now / updates every 5 min".
- `frontend/src/components/LineGrid.jsx`: dropped the CRITICAL grouping cutoff from 1500 (never reachable) to 60 so the severity grouping actually fires.
Why it matters: this is the highest-leverage honesty fix. The evangelist screenshots the number, so the number and the words around it must agree.

### Quick wins (not yet done)
1. Scrub the em dashes still in source comments and type docs (`frontend/src/index.css`, `frontend/src/types/api.ts`, `frontend/src/constants/lines.js`, `frontend/src/components/Sparkline.jsx`). Effort S. No deploy needed to verify (comment-only). House standard, not user-facing.
2. Decide whether to keep the chart section at all in snapshot mode. Right now it always renders the placeholder card because the timeseries only ever has 1 point. Either hide the section when `timeseries.length < 2` to tighten the page, or keep the new honest placeholder. Effort S. Deploy to verify.
3. Trophy share string and `og:image` are good; add a one-tap "copy the worst line" share button higher on the page so the screenshot moment is above the fold for the angry-commuter flow. Effort S to M. Deploy to verify.

### Bigger bets
4. Real cumulative daily scoring with a datastore. This is the original product promise the snapshot cannot keep. Cheapest honest path that needs no new secret in code: a Vercel Cron job hitting an ingest route every minute that writes running totals to Vercel KV or Upstash Redis, with `/api/status` reading the total. Once this lands, restore the cumulative tiers and the "resets at midnight" copy and bring back the real trend chart. Effort L. Needs Michael's KV or Upstash keys and a deploy. Flagged in `status.js` already.
5. Trend chart that actually trends. Depends on item 4. With a datastore the `ShameChart` becomes the marquee artifact (watch the F climb all morning). Effort M after item 4.
6. Per-line deep link and shareable per-line card, so a rider can paste "the L right now" rather than only the day's overall worst. Effort M. Deploy to verify.
7. Tier calibration check after real data. The 30 / 60 / 120 snapshot cutoffs are a reasoned estimate from the category point values; once live, sanity-check them against a week of real worst-line scores and nudge if Dumpster Fire never or always fires. Effort S. Needs live data.

## Verification this pass
- `npm run build` in `frontend/`: passes clean (Vite, 687 modules). Large-chunk warning is pre-existing and not introduced here.
- `npx eslint` on all changed files: 0 errors (1 pre-existing unrelated warning in Trophy.jsx).
- No em dashes introduced in changed code.
