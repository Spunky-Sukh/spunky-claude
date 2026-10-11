"""Guards for a localhost server that can touch your files.

- TrustedHost (in main.py) rejects requests whose Host isn't localhost → stops DNS rebinding.
- OriginGuard rejects state-changing requests sent by other websites (e.g. a hidden
  <form method="POST"> pointing at 127.0.0.1:8000), which CORS alone does not block.
"""

from starlette.types import ASGIApp, Receive, Scope, Send

from app.config import FRONTEND_ORIGINS

SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}


class OriginGuard:
    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] == "http" and scope["method"] not in SAFE_METHODS:
            headers = dict(scope["headers"])
            origin = headers.get(b"origin", b"").decode()
            # Browsers always send Origin on cross-site POST/PATCH/DELETE.
            # No Origin = a non-browser client on this machine (curl, scripts).
            if origin and origin not in FRONTEND_ORIGINS:
                await _forbidden(send)
                return
        await self.app(scope, receive, send)


async def _forbidden(send: Send) -> None:
    body = b'{"detail":"Request from an untrusted origin was blocked."}'
    await send(
        {
            "type": "http.response.start",
            "status": 403,
            "headers": [(b"content-type", b"application/json"), (b"content-length", str(len(body)).encode())],
        }
    )
    await send({"type": "http.response.body", "body": body})
