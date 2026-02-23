# Subway Shame NYC — Frontend (GitHub Pages)

This folder is served via GitHub Pages at:
**https://michaelpyon.github.io/subway-shame/**

## Status

⚠️ **Backend not yet deployed — some features require Railway deployment.**

The live subway delay data is fetched from `/api/status`, which is powered by
the Flask backend in `../backend/`. Until that backend is deployed (e.g. via
Railway), the app will display a connection error when trying to load data.

## Deploying the Backend

1. Deploy `backend/app.py` to Railway (or any platform)
2. Set the `VITE_API_BASE_URL` env var (if added) or configure a CORS proxy
3. Rebuild and re-deploy the frontend pointing at the live API URL
