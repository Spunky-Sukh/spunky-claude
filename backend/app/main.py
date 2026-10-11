from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from starlette.middleware.trustedhost import TrustedHostMiddleware

from app.config import ALLOWED_HOSTS, FRONTEND_DIST, FRONTEND_ORIGINS
from app.routers import auth, chat, sessions, system
from app.security import OriginGuard

app = FastAPI(title="Spunky-Claude API")

app.add_middleware(OriginGuard)
app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(TrustedHostMiddleware, allowed_hosts=ALLOWED_HOSTS)

app.include_router(auth.router)
app.include_router(sessions.router)
app.include_router(system.router)
app.include_router(chat.router)


@app.get("/api/health")
def health():
    return {"ok": True}


# ---------- Serve the built React app (registered last so /api and /ws win) ----------


@app.get("/{full_path:path}", include_in_schema=False)
def frontend(full_path: str):
    if full_path.startswith(("api/", "ws/")):
        raise HTTPException(404, "Not found")

    index = FRONTEND_DIST / "index.html"
    if not index.exists():
        raise HTTPException(
            404,
            "Frontend not built yet. Run `npm install` and `npm run build` inside the frontned folder, "
            "or use the dev server on http://localhost:5173.",
        )

    # Real files (JS, CSS, icons) are served as-is; every other path is a React route.
    file = (FRONTEND_DIST / full_path).resolve()
    if full_path and file.is_file() and file.is_relative_to(FRONTEND_DIST.resolve()):
        return FileResponse(file)
    return FileResponse(index)
