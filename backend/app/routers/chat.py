"""WebSocket bridge: one socket ↔ one live Claude Code session.

Client → server messages:
    {"type": "start", "cwd", "session_id"?, "model"?, "permission_mode"?, "chrome"?}
    {"type": "prompt", "text"}
    {"type": "permission", "request_id", "decision": "allow" | "allow_always" | "deny", "message"?}
    {"type": "answer", "request_id", "answers": {question: answer}}
    {"type": "interrupt"}
    {"type": "set_model", "model"}
    {"type": "set_permission_mode", "mode"}
"""

import asyncio

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.config import FRONTEND_ORIGINS
from app.services.chat_service import ChatSession
from app.services.fs_service import check_folder

router = APIRouter(tags=["chat"])


@router.websocket("/ws/chat")
async def chat_socket(ws: WebSocket):
    # Browsers don't apply CORS to WebSockets, so block other websites explicitly.
    if ws.headers.get("origin") not in FRONTEND_ORIGINS:
        await ws.close(code=4403)
        return
    await ws.accept()

    send_lock = asyncio.Lock()

    async def send(event: dict) -> None:
        async with send_lock:
            await ws.send_json(event)

    session = ChatSession(send)
    try:
        while True:
            msg = await ws.receive_json()
            try:
                await _handle(session, msg, send)
            except Exception as exc:
                await send({"type": "error", "message": str(exc)})
                await send({"type": "status", "busy": False})
    except WebSocketDisconnect:
        pass
    finally:
        await session.close()


async def _handle(session: ChatSession, msg: dict, send) -> None:
    kind = msg.get("type")

    if kind == "start":
        folder = check_folder(msg.get("cwd", ""))
        if not folder["is_dir"]:
            await send({"type": "error", "message": f"Folder not found: {folder['path']}"})
            return
        await session.start(
            cwd=folder["path"],
            session_id=msg.get("session_id"),
            model=msg.get("model"),
            permission_mode=msg.get("permission_mode") or "default",
            chrome=bool(msg.get("chrome")),
        )
    elif kind == "prompt":
        await session.prompt(msg["text"])
    elif kind == "permission":
        session.answer_permission(msg["request_id"], msg.get("decision", "deny"), msg.get("message"))
    elif kind == "answer":
        session.answer_question(msg["request_id"], msg.get("answers", {}))
    elif kind == "interrupt":
        await session.interrupt()
    elif kind == "set_model":
        await session.set_model(msg.get("model"))
    elif kind == "set_permission_mode":
        await session.set_permission_mode(msg["mode"])
    else:
        await send({"type": "error", "message": f"Unknown message type: {kind}"})
