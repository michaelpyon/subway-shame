# Subway Shame

Real-time NYC subway delay tracker. Pulls live MTA GTFS-RT protobuf feeds, scores each train line by alert severity, and displays a shame leaderboard with historical trending.

**Live:** https://web-production-be47b.up.railway.app
**GitHub:** https://github.com/michaelpyon/subway-shame

## Tech stack

- **Backend:** Python 3.11, Flask, flask-cors, gunicorn, google-transit (protobuf parsing)
- **Frontend:** React, Tailwind CSS v4, Vite, Recharts
- **Deployment:** Docker multi-stage build → Railway (auto-deploys on push to `main`)
- **Data:** MTA GTFS-RT public feeds (no API key required)

## Local dev

```bash
# Backend (terminal 1)
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python app.py           # runs on http://localhost:5001

# Frontend (terminal 2)
cd frontend
npm install
npm run dev             # Vite dev server, proxies /api to localhost:5001
```

## Key files

- `backend/app.py` — Flask server, MTA feed parsing, scoring engine, persistent state
- `backend/requirements.txt` — Flask, flask-cors, gtfs-realtime-bindings, gunicorn
- `backend/data.json` — auto-generated persistent state (daily accumulation + timeseries)
- `frontend/src/App.jsx` — root component, wires all sections together
- `frontend/src/hooks/useSubwayData.js` — polling hook, manages refresh timer
- `frontend/src/components/Trophy.jsx` — worst line of the day (1st place)
- `frontend/src/components/Podium.jsx` — 2nd/3rd place with tie support
- `frontend/src/components/ShameChart.jsx` — Recharts timeseries with endpoint badges
- `frontend/src/components/SubwayLineCard.jsx` — expandable card per line
- `frontend/src/components/TrainChecker.jsx` — "Is My Train Fucked?" interactive checker
- `frontend/src/components/AlertText.jsx` — renders [A], [7] etc. as inline MTA circle badges
- `frontend/src/constants/lines.js` — all MTA lines with colors, GTFS feed assignments
- `Dockerfile` — multi-stage: Node 20 builds frontend, Python 3.11 serves everything
- `railway.json` — Railway config: DOCKERFILE builder, gunicorn startCommand

## Deployment

Railway auto-deploys from GitHub `main` branch.

**Docker build:**
1. Node 20 stage: `npm ci && vite build` → `/app/frontend/dist`
2. Python stage: install deps, copy backend + built frontend to `/static/`
3. Gunicorn serves Flask which serves the built React app as static files

**Start command** (in `railway.json`):
```
sh -c 'gunicorn app:app --bind 0.0.0.0:${PORT:-8080} --workers 2 --timeout 120'
```

**Why `sh -c` with `${PORT:-8080}`:** Railway injects `PORT` as an env var. The `startCommand` field in `railway.json` doesn't expand `$PORT` directly — must wrap with `sh -c` to get shell variable expansion. Learned this the hard way after multiple failed deploys.

**Why not just use Docker CMD:** Railway's dashboard had a cached "Custom Start Command" field (`cd backend && gunicorn...`) that kept overriding the Dockerfile CMD. Setting `startCommand` in `railway.json` takes precedence over the dashboard field.

## Architecture notes

- **Alert classification:** MTA GTFS feeds only use `OTHER_EFFECT` — the backend applies regex rules to map alert text to real categories: No Service (50pts), Delays (30pts), Slow Speeds (15pts), Skip Stop (10pts), Station Skip (8pts), Reduced Service (5pts), Planned Work (3pts), Platform Change (2pts), Mystery (5pts)
- **9 GTFS feed URLs:** One per train group (1-6/S, A/C/E, B/D/F/M, N/Q/R/W, J/Z, 7/7X, G, L, SIR)
- **Scoring:** Cumulative daily — each alert hit adds points. Resets at midnight.
- **Persistence:** `_save_state()` / `_load_state()` write daily scores + timeseries to `data.json`. Survives restarts but resets on new deployments.
- **Tie handling:** Podium groups lines with equal scores — shows multiple badges + "TIE" label
- **Chart badge overlap:** `buildOffsetMap()` in ShameChart detects overlapping endpoint badges and offsets them horizontally with dashed connector lines

## Known limitations

- `data.json` is ephemeral on Railway (resets on redeploy). Long-term persistence needs a database.
- No custom domain yet — using Railway's default `.up.railway.app` URL.
