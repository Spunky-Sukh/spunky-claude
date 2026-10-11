"""Folder picker + Claude Code metadata (slash commands, models, agents)."""

from fastapi import APIRouter, HTTPException

from app.schemas import PathBody
from app.services import fs_service, meta_service

router = APIRouter(prefix="/api", tags=["system"])


@router.post("/fs/check")
def check_folder(body: PathBody):
    return fs_service.check_folder(body.path)


@router.get("/fs/list")
def list_folders(path: str | None = None):
    try:
        return fs_service.list_folders(path)
    except NotADirectoryError as exc:
        raise HTTPException(400, f"Not a folder: {exc}") from exc


@router.get("/meta")
async def meta(cwd: str | None = None):
    try:
        return await meta_service.get_meta(cwd)
    except Exception as exc:
        raise HTTPException(502, f"Could not start Claude Code: {exc}") from exc
