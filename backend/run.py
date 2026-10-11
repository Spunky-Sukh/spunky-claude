"""Start Spunky-Claude:  python run.py   (from the backend folder, with the venv active)

Note: no auto-reload on purpose. On Windows, uvicorn's reload mode switches to the
Selector event loop, which cannot spawn subprocesses — and every Claude session is one.
"""

import uvicorn

from app.config import FRONTEND_DIST, HOST, PORT

if __name__ == "__main__":
    if (FRONTEND_DIST / "index.html").exists():
        print(f"\n  Spunky-Claude is running →  http://localhost:{PORT}\n")
    else:
        print(
            "\n  Frontend not built yet — only the API is available.\n"
            "  Build it once:  cd frontned && npm install && npm run build\n"
            "  (or run `npm run dev` there and open http://localhost:5173)\n"
        )
    uvicorn.run("app.main:app", host=HOST, port=PORT)
