"""App-wide settings and small helpers for locating the Claude CLI."""

import os
import shutil
from pathlib import Path

import claude_agent_sdk

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
SETTINGS_FILE = DATA_DIR / "settings.json"

# The built React app (npm run build). When present, the backend serves it too.
FRONTEND_DIST = BASE_DIR.parent / "frontned" / "dist"

# Bound to localhost only: this server can read/write files and run commands.
HOST = "127.0.0.1"
PORT = int(os.environ.get("SPUNKY_PORT", "8000"))

# Requests must be addressed to one of these hosts (blocks DNS-rebinding attacks).
ALLOWED_HOSTS = ["localhost", "127.0.0.1"]

# Pages allowed to call the API / open the chat socket:
# the app served by this backend, plus the Vite dev server.
FRONTEND_ORIGINS = [
    f"http://localhost:{PORT}",
    f"http://127.0.0.1:{PORT}",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]


def claude_cli_path() -> str:
    """Prefer the user's installed `claude` so the web UI matches their CLI version."""
    installed = shutil.which("claude")
    if installed:
        return installed
    bundled_dir = Path(claude_agent_sdk.__file__).parent / "_bundled"
    for name in ("claude.exe", "claude"):
        if (bundled_dir / name).exists():
            return str(bundled_dir / name)
    raise FileNotFoundError("Claude Code CLI not found. Install it: https://docs.claude.com/en/docs/claude-code")
