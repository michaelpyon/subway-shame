# Changes

## Scope reviewed

- Backend API and ingest flow in `backend/`
- Frontend app and UI components in `frontend/src/`
- Container/build setup in `Dockerfile`, `build.sh`, and deploy config

## Backend fixes

- Replaced the hard-coded `UTC-5` timezone with `America/New_York` in the API and ingest worker.
  - This fixes daily rollups, date labels, and bucket boundaries during daylight saving time.
- Corrected alert classification so `Slow Speeds` alerts are no longer swallowed by the broader `Delays` rule.
- Narrowed the alert noise filter so real service-change alerts are not dropped just because they contain `running on a ...`.

## Frontend fixes

- Removed an unused `/api/history` fetch path from the current app shell.
  - It was creating extra network traffic without rendering any history UI.
- Changed current-state widgets to use live scores instead of daily totals where appropriate.
  - `AlertMarquee` now reflects lines disrupted right now.
  - `SystemHealth` now reports live impact instead of all-day accumulated impact.
  - `TrainChecker` now answers based on live alerts and live directional data.
- Improved accessibility and mobile behavior.
  - Added dialog semantics, Escape handling, focus trapping, and focus restoration to the train checker modal.
  - Added `aria-expanded`, `aria-controls`, and `aria-pressed` where toggles and segmented controls needed them.
  - Replaced the clipboard `alert()` in the train checker with inline share feedback.
  - Added reduced-motion fallbacks for marquee and verdict animations.
  - Switched major full-height wrappers to `min-h-dvh` for better mobile viewport behavior.
- Fixed lint issues in the active code path and kept the frontend building cleanly.

## Docker and build fixes

- Added `.dockerignore` to keep local `venv`, `node_modules`, generated assets, and cache files out of Docker build context.
  - This prevents oversized images and accidental inclusion of local machine artifacts.
- Switched `build.sh` from `npm install` to `npm ci` for reproducible frontend installs.

## MTA integration review notes

- The route normalization approach is broadly correct for the current code path:
  - shuttle aliases normalize to `S`
  - Staten Island aliases normalize to `SI`
  - express variants like `5X`, `6X`, `7X`, and `FX` normalize to the base route
- The main correctness problems I found were classification and time-boundary handling, not the feed endpoint split itself.

## Verification

Ran successfully:

- `python3 -m py_compile backend/app.py backend/db.py backend/ingest.py backend/mta.py`
- `npm run lint` in `frontend/`
- `npm run build` in `frontend/`

Build note:

- Vite still reports a large JS chunk warning during production build. The build succeeds, but there is still an opportunity to split vendor/chart code further if bundle size becomes a priority.
