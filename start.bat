@echo off
setlocal
REM One-command start for Windows: sets everything up on first run, then launches.
cd /d "%~dp0"

where python >nul 2>nul || (echo [!] Python 3.10+ is required: https://www.python.org/downloads/ & exit /b 1)
where npm >nul 2>nul || (echo [!] Node.js 20+ is required: https://nodejs.org/ & exit /b 1)

if not exist "backend\envs\Scripts\python.exe" (
  echo [1/3] Creating Python virtual environment...
  python -m venv backend\envs || exit /b 1
)
echo [1/3] Installing backend packages...
backend\envs\Scripts\python.exe -m pip install -q -r backend\requirements.txt || exit /b 1

if not exist "frontned\node_modules" (
  echo [2/3] Installing frontend packages...
  pushd frontned && call npm install || (popd & exit /b 1)
  popd
)
if not exist "frontned\dist\index.html" (
  echo [2/3] Building frontend...
  pushd frontned && call npm run build || (popd & exit /b 1)
  popd
)

echo [3/3] Starting Spunky-Claude...
cd backend
envs\Scripts\python.exe run.py
