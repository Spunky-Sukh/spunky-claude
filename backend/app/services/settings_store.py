"""Tiny JSON-file store for Spunky-Claude's own settings (e.g. a saved API key)."""

import json
from typing import Any

from app.config import DATA_DIR, SETTINGS_FILE


def load() -> dict[str, Any]:
    if not SETTINGS_FILE.exists():
        return {}
    try:
        return json.loads(SETTINGS_FILE.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}


def save(data: dict[str, Any]) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    SETTINGS_FILE.write_text(json.dumps(data, indent=2), encoding="utf-8")


def get(key: str, default: Any = None) -> Any:
    return load().get(key, default)


def set_value(key: str, value: Any) -> None:
    data = load()
    if value is None:
        data.pop(key, None)
    else:
        data[key] = value
    save(data)
