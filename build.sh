#!/usr/bin/env bash
set -e

echo "==> Installing Python dependencies..."
pip install -r backend/requirements.txt

echo "==> Installing frontend dependencies..."
cd frontend
npm install
echo "==> Building frontend..."
npx vite build
cd ..

echo "==> Build complete!"
