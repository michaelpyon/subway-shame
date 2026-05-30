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
- Live `<title>` still uses an em dash before "NYC Subway Delay Tracker"; repo HEAD title is "The Low Line: NYC Subway Delay Tracker" (em dash removed in commit 0652590).
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

### Shipped wave 2 (S, deploy to verify)
Put the screenshot moment above the fold and lock the share copy to one source of truth.
- `frontend/src/utils/shareText.js` (new): single source of truth `buildShareText(winner)` plus `SHARE_URL`. Confirmed by curl with a Twitterbot user agent that `subway-shame.vercel.app` is the working host (200, real 1200x630 og.png) and the custom domain `subway.michaelpyon.com` does not resolve, so every share path points at the vercel.app host. Repo HEAD `index.html` canonical, og:url, og:image already point there, so no meta change needed.
- `frontend/src/components/Header.jsx`: added a one tap "Copy the receipt" button next to the existing CTA, above the fold. It uses the Web Share API when available and falls back to clipboard, with copied / shared / try again states. Shows the worst line badge so the angry commuter can grab the receipt without scrolling to the Trophy.
- `frontend/src/components/Trophy.jsx`: the share button now calls the same `buildShareText` helper, so the two share paths can never drift. Removed the now dead `goodCount`, `worstCount`, and `shareDate` locals.
- `frontend/src/App.jsx`: passes `data.winner` into the Header.
- Em dash scrub (house standard): removed every em dash from source comments and type docs (`index.css`, `types/api.ts`, `Sparkline.jsx`, `AlertText.jsx`, `LineCard.jsx`, `Podium.jsx`, `ShareCard.jsx`, `LineGrid.jsx`). Comment only, not user facing.
Why it matters: the evangelist reaches for their phone on the platform and wants one tap to the receipt. The copy button surfaces that at the top of the page instead of below several sections.

### Quick wins (done)
1. [x] Hide the chart section in snapshot mode. The live snapshot backend emits a single timeseries point, so `ShameChart` only ever rendered its "this is a snapshot, not a trend" placeholder, restating what the leaderboard and line grid already show. Gated the section on `timeseries.length >= 2` so it stays hidden now and reappears automatically once a datastore backfills intraday history. Chart code untouched. Shipped 66e04a5.

### Integrity + house standard fixes shipped this pass (S)
- [x] Share image dead link. The downloaded/shared PNG (`ShareCard.jsx`) watermarked `subway.michaelpyon.com`, a domain confirmed not to resolve (000 / 502) in the prior pass, so anyone sharing the receipt was advertising a dead link. Pointed it at the canonical `SHARE_URL` (`subway-shame.vercel.app`), matching the OG card, `index.html` canonical, and the copied share text. Shipped 34d17ef.
- [x] Em dash in PWA install name. `public/manifest.json` `name` carried the only remaining user-facing em dash, separating "The Low Line" from "NYC Subway Delay Tracker". Switched it to the colon style used by the page title. Shipped ba6a01f.

## Bigger bets for Michael
4. Real cumulative daily scoring with a datastore. This is the original product promise the snapshot cannot keep. Cheapest honest path that needs no new secret in code: a Vercel Cron job hitting an ingest route every minute that writes running totals to Vercel KV or Upstash Redis, with `/api/status` reading the total. Once this lands, restore the cumulative tiers and the "resets at midnight" copy and bring back the real trend chart. Reason skipped: needs Michael's KV or Upstash keys and a deploy. Flagged in `status.js` already.
5. Trend chart that actually trends. Depends on item 4. With a datastore the `ShameChart` becomes the marquee artifact (watch the F climb all morning) and the `>= 2` gate added this pass makes it reappear automatically. Reason skipped: depends on item 4 (datastore + deploy).
6. Per-line deep link and shareable per-line card, so a rider can paste "the L right now" rather than only the day's overall worst. Reason skipped: deploy to verify the per-line OG route.
7. Tier calibration check after real data. The 30 / 60 / 120 snapshot cutoffs are a reasoned estimate from the category point values; once live, sanity-check them against a week of real worst-line scores and nudge if Dumpster Fire never or always fires. Reason skipped: needs live data over time.
8. Deploy repo HEAD to Vercel (the deploy gap above). The live URL still serves an older build with no `/api/status`, so none of the prior-pass or this-pass work is visible to a real visitor yet. Reason skipped: deploy is Michael-owned; this whole repo is staged for the next flush.

## Verification this pass
- `npm run build` in `frontend/`: passes clean (Vite, 688 modules). Large-chunk warning is pre-existing and not introduced here.
- `npx eslint` on all changed files: 0 errors.
- No em dashes anywhere in `src/` or `api/` (verified by grep).

## Verification wave 2
- Confirmed the working host by curl with a Twitterbot user agent: `subway-shame.vercel.app` returns 200 and serves a real 1200x630 `og.png` (176 KB). `subway.michaelpyon.com` does not resolve (000 / 502). Repo HEAD already targets the working host, so no canonical or og:image change was needed. Live `/api/og` and `/api/status` 404 only because the serverless port has not been deployed yet (the known deploy gap above), not a code bug.
- `npm run build` passes clean (688 modules).
- `npx eslint` on all changed files: 0 errors.
- Flagged defect (repo not CLI linked to Vercel) is a deploy concern only, no code fix made.

## Verification wave 3 (this pass)
- Backlog worked to completion: the single open quick win (chart in snapshot mode) is shipped, and two integrity/house-standard defects found while touching share code were fixed (dead-domain watermark, manifest em dash). All remaining items need a deploy, a datastore/secret, or live data, so they are in "Bigger bets for Michael".
- Adversarial integrity scan of `src/` and `api/`: the three `Math.random` uses only pick editorial copy variants (headlines / all-good messages / checker quips), never user-facing numbers. "Real-time MTA data" claims are accurate (the app fetches live GTFS-RT feeds). No example.com, no fake authority, no invented stats. The one dead link (`subway.michaelpyon.com`) was the only finding and is fixed; the sole remaining mention of that string is an accurate code comment explaining why we use the vercel.app host.
- `npm run build` in `frontend/`: passes clean (Vite). Large-chunk warning is pre-existing, not introduced here.
- `npx eslint` on all changed files: 0 errors. Zero em dashes in `src/`, `api/`, `index.html`, `manifest.json` (verified by grep).
