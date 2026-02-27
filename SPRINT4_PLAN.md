# Sprint 4 Plan — Subway Shame

## Current State Assessment

The app is functional with a solid foundation: real-time MTA alert parsing, cumulative daily scoring, interactive "Is My Train Fucked?" checker, podium/trophy, shame race chart, and Hall of Shame localStorage history. Sprint 3 added lastUpdated/refreshing states, alert classification improvements, and preview mode for offline.

### Issues Found in Audit

1. **Planned Work filtering is inconsistent** — `_is_noise()` filters "planned work" but `_CATEGORY_RULES` also has a "Planned Work" category with "shuttle" and "express skips" keywords. If an alert says "shuttle bus" it gets classified as Planned Work (5 pts) rather than filtered. The intent seems conflicted.

2. **`dailyScore` format inconsistency** — The scores aren't formatted with `toLocaleString()` consistently across components (Trophy does it, SubwayLineCard doesn't for the main score).

3. **Mobile touch targets** — Train line badges in TrainChecker have `min-w-[44px] min-h-[44px]` (good), but the direction buttons and legend items in ShameChart are small.

4. **No meta tags / OG tags** — The `index.html` likely lacks proper meta/OG tags for social sharing.

5. **Vite base path mismatch** — `vite.config.js` has `base: '/subway-shame/'` but Railway serves at root. The Dockerfile build may override this, but it's confusing.

6. **Trip count data fetched but never displayed** — Backend fetches trip counts per line but the frontend doesn't show them anywhere.

7. **ShameChart legend badges are oversized** — The `LineBadge` with `size="sm"` (w-8 h-8) in the chart legend makes each item too large for a compact legend.

8. **No favicon** — Using default Vite favicon.

9. **Scoring explainer says "~60 seconds" but actual cache TTL is 60s + 5min frontend poll** — The effective sampling rate is every 5 minutes, not every 60 seconds. This makes the pts-to-time mapping misleading.

10. **Footer is plain** — Could use a "built by" link for portfolio purposes.

---

## Sprint 4 Tasks (Ranked by Impact)

### Task 1: Fix Scoring Explainer accuracy (pts-to-time mapping)
**Impact:** HIGH — current explainer misleads users about how scores accumulate
**Files:** `frontend/src/components/ScoringExplainer.jsx`
**Changes:**
- Update "every ~60 seconds" to accurately reflect the 5-min poll + 60s cache = ~5 min effective rate
- Recalculate the pts-to-time examples: 30 pts/poll × 12 polls/hr = 360 pts/hr for delays
- Update tier context: "300 pts ≈ ~50 min of delays" etc.
**Validation:** Text accurately describes how points accumulate. No misleading numbers.

### Task 2: Add OG meta tags + favicon for social sharing
**Impact:** HIGH — sharing links currently show no preview
**Files:** `frontend/index.html`
**Changes:**
- Add `<meta property="og:title">`, `og:description`, `og:image`, `og:url`
- Add Twitter card meta tags
- Add subway emoji favicon or simple branded favicon
**Validation:** Paste link into iMessage/Slack preview shows title + description.

### Task 3: Format all scores consistently with toLocaleString()
**Impact:** MEDIUM — visual inconsistency when scores exceed 999
**Files:** `frontend/src/components/SubwayLineCard.jsx`
**Changes:**
- Change `{dailyScore}` to `{dailyScore.toLocaleString()}` in the main score display
- Same for `{liveScore}` in the expanded section
**Validation:** Scores like 1500 display as "1,500" consistently across Trophy, SubwayLineCard, and Podium.

### Task 4: Add "Built by" footer link for portfolio
**Impact:** MEDIUM — portfolio attribution
**Files:** `frontend/src/App.jsx`
**Changes:**
- Add a "Built by Michael Pyon" link to pyon.dev in the footer
**Validation:** Footer shows attribution with link.

### Task 5: Fix Vite base path for Railway deployment
**Impact:** MEDIUM — prevents confusion and potential asset loading bugs
**Files:** `frontend/vite.config.js`
**Changes:**
- Change `base: '/subway-shame/'` to `base: '/'` since Railway serves at root
- The GitHub Pages path was already abandoned per commit history
**Validation:** `vite build` produces correct asset paths with `/` prefix.

### Task 6: Show active train count in expanded card
**Impact:** LOW-MEDIUM — uses data already being fetched
**Files:** `frontend/src/components/SubwayLineCard.jsx`
**Changes:**
- In the expanded section, show "X active trains" using `line.trip_count`
**Validation:** Expanded card shows train count when > 0.

### Task 7: Compact ShameChart legend on mobile
**Impact:** LOW-MEDIUM — legend takes too much space on small screens
**Files:** `frontend/src/components/ShameChart.jsx`
**Changes:**
- Use smaller inline badges (w-5 h-5) instead of LineBadge sm (w-8 h-8) in legend
- Tighter padding on mobile
**Validation:** Legend wraps cleanly at 375px without horizontal scroll.

### Task 8: Resolve Planned Work classification conflict
**Impact:** LOW — edge case in scoring accuracy
**Files:** `backend/app.py`
**Changes:**
- Remove "Planned Work" from `_CATEGORY_RULES` (it should be filtered by `_is_noise`)
- Add "shuttle" to `_is_noise` keywords
**Validation:** Shuttle bus alerts are filtered out, not scored.

### Task 9: Add simple NYC subway favicon
**Impact:** LOW — visual polish
**Files:** `frontend/index.html`, add favicon file
**Validation:** Browser tab shows subway-related icon.

### Task 10: Improve error boundary with retry countdown
**Impact:** LOW — edge case UX
**Files:** `frontend/src/components/ErrorBoundary.jsx`
**Changes:** Add auto-retry after 10 seconds
**Validation:** Error state auto-refreshes.

---

## Execution Plan

Execute tasks 1-5 (highest impact). Tasks 6-10 deferred to Sprint 5.
