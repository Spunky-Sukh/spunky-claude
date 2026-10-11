"""Sessions are Claude Code's own transcripts in ~/.claude/projects — shared with the CLI."""

from dataclasses import asdict
from pathlib import Path

from claude_agent_sdk import delete_session, get_session_messages, list_sessions, rename_session

from app.services.serializers import history_message_to_dict


def recent_projects(limit: int = 30) -> list[dict]:
    """Folders that have sessions, most recently used first."""
    projects: dict[str, dict] = {}
    for info in list_sessions(limit=1000):
        if not info.cwd:
            continue
        key = str(Path(info.cwd))
        entry = projects.setdefault(key, {"path": key, "session_count": 0, "last_modified": 0})
        entry["session_count"] += 1
        entry["last_modified"] = max(entry["last_modified"], info.last_modified)
    ordered = sorted(projects.values(), key=lambda p: p["last_modified"], reverse=True)
    return [p for p in ordered if Path(p["path"]).is_dir()][:limit]


def sessions_for(cwd: str) -> list[dict]:
    return [asdict(s) for s in list_sessions(directory=cwd, include_worktrees=False)]


def messages_for(session_id: str, cwd: str | None) -> list[dict]:
    return [m for m in (history_message_to_dict(x) for x in get_session_messages(session_id, directory=cwd)) if m]


def rename(session_id: str, title: str, cwd: str | None) -> None:
    rename_session(session_id, title, directory=cwd)


def delete(session_id: str, cwd: str | None) -> None:
    delete_session(session_id, directory=cwd)
