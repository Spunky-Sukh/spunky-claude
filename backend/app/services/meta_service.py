"""Fetch (and cache) what Claude Code exposes on start-up: slash commands, models, agents, styles.

Connecting without sending a prompt costs no tokens; it only boots the CLI briefly.
"""

import asyncio
import time
from pathlib import Path

from claude_agent_sdk import ClaudeAgentOptions, ClaudeSDKClient

from app.config import claude_cli_path
from app.services.auth_service import auth_env

CACHE_SECONDS = 300
_cache: dict[str, tuple[float, dict]] = {}
_lock = asyncio.Lock()


async def get_meta(cwd: str | None) -> dict:
    key = cwd or str(Path.home())
    async with _lock:
        cached = _cache.get(key)
        if cached and time.time() - cached[0] < CACHE_SECONDS:
            return cached[1]

        client = ClaudeSDKClient(ClaudeAgentOptions(cwd=key, cli_path=claude_cli_path(), env=auth_env(), skills="all"))
        await client.connect()
        try:
            info = await client.get_server_info() or {}
        finally:
            await client.disconnect()

        meta = {
            "commands": info.get("commands", []),
            "models": info.get("models", []),
            "agents": info.get("agents", []),
            "output_styles": info.get("available_output_styles", []),
            "account": info.get("account"),
            "version": info.get("claude_code_version"),
        }
        _cache[key] = (time.time(), meta)
        return meta
