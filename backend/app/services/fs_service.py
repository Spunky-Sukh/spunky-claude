"""Folder validation and a minimal directory browser for picking a project folder."""

import os
import string
from pathlib import Path


def normalize(path: str) -> Path:
    cleaned = path.strip().strip('"').strip("'")
    return Path(os.path.expandvars(os.path.expanduser(cleaned))).resolve()


def check_folder(path: str) -> dict:
    p = normalize(path)
    return {"path": str(p), "exists": p.exists(), "is_dir": p.is_dir(), "name": p.name or str(p)}


def _drives() -> list[dict]:
    drives = [f"{d}:\\" for d in string.ascii_uppercase if os.path.exists(f"{d}:\\")]
    return [{"name": d, "path": d} for d in drives]


def list_folders(path: str | None) -> dict:
    """List sub-folders of `path` (or drive roots / home when empty)."""
    if not path:
        home = Path.home()
        return {"path": "", "parent": None, "folders": [{"name": "~ Home", "path": str(home)}, *(_drives() if os.name == "nt" else [])]}

    p = normalize(path)
    if not p.is_dir():
        raise NotADirectoryError(str(p))

    folders = []
    try:
        for entry in sorted(os.scandir(p), key=lambda e: e.name.lower()):
            if entry.is_dir(follow_symlinks=False) and not entry.name.startswith((".", "$")):
                folders.append({"name": entry.name, "path": entry.path})
    except PermissionError:
        pass
    parent = str(p.parent) if p.parent != p else ""
    return {"path": str(p), "parent": parent, "folders": folders}
