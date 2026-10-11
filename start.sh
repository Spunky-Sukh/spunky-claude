#!/usr/bin/env bash
# One-command start for macOS / Linux: sets everything up on first run, then launches.
set -e
cd "$(dirname "$0")"

PY=$(command -v python3 || command -v python || true)
[ -z "$PY" ] && { echo "[!] Python 3.10+ is required: https://www.python.org/downloads/"; exit 1; }
command -v npm >/dev/null || { echo "[!] Node.js 20+ is required: https://nodejs.org/"; exit 1; }

if [ ! -x backend/envs/bin/python ]; then
  echo "[1/3] Creating Python virtual environment..."
  "$PY" -m venv backend/envs
fi
echo "[1/3] Installing backend packages..."
backend/envs/bin/python -m pip install -q -r backend/requirements.txt

if [ ! -d frontned/node_modules ]; then
  echo "[2/3] Installing frontend packages..."
  (cd frontned && npm install)
fi
if [ ! -f frontned/dist/index.html ]; then
  echo "[2/3] Building frontend..."
  (cd frontned && npm run build)
fi

echo "[3/3] Starting Spunky-Claude..."
cd backend
exec envs/bin/python run.py
