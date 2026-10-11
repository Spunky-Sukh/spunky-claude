from fastapi import APIRouter, HTTPException

from app.schemas import RenameBody
from app.services import fs_service, session_service

router = APIRouter(prefix="/api", tags=["sessions"])


@router.get("/projects")
def recent_projects():
    return session_service.recent_projects()


@router.get("/sessions")
def list_sessions(cwd: str):
    folder = fs_service.check_folder(cwd)
    if not folder["is_dir"]:
        raise HTTPException(400, f"Folder not found: {folder['path']}")
    return session_service.sessions_for(folder["path"])


@router.get("/sessions/{session_id}/messages")
def session_messages(session_id: str, cwd: str | None = None):
    return session_service.messages_for(session_id, cwd)


@router.patch("/sessions/{session_id}")
def rename_session(session_id: str, body: RenameBody):
    try:
        session_service.rename(session_id, body.title, body.cwd)
    except (FileNotFoundError, ValueError) as exc:
        raise HTTPException(404, str(exc)) from exc
    return {"ok": True}


@router.delete("/sessions/{session_id}")
def delete_session(session_id: str, cwd: str | None = None):
    try:
        session_service.delete(session_id, cwd)
    except (FileNotFoundError, ValueError) as exc:
        raise HTTPException(404, str(exc)) from exc
    return {"ok": True}
