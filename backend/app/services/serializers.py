"""Convert SDK messages (live) and transcript dicts (history) into one JSON shape for the UI.

Every message becomes:
    {"id", "role": "user" | "assistant" | "tool" | "system", "blocks": [...], "parent_tool_use_id"}
and every block becomes one of:
    {"type": "text", "text"}
    {"type": "thinking", "text"}
    {"type": "tool_use", "id", "name", "input"}
    {"type": "tool_result", "tool_use_id", "content", "is_error"}
"""

import re
import uuid
from dataclasses import asdict, is_dataclass
from typing import Any

from claude_agent_sdk import (
    AssistantMessage,
    TextBlock,
    ThinkingBlock,
    ToolResultBlock,
    ToolUseBlock,
    UserMessage,
)

MAX_RESULT_CHARS = 20_000
COMMAND_TAG_RE = re.compile(r"</?(local-command-stdout|local-command-stderr|command-name|command-message|command-args)>")


def _flatten_result(content: Any) -> str:
    if content is None:
        return ""
    if isinstance(content, str):
        text = content
    else:
        parts = []
        for item in content:
            if isinstance(item, dict) and item.get("type") == "text":
                parts.append(item.get("text", ""))
            elif isinstance(item, dict) and item.get("type") == "image":
                parts.append("[image]")
            else:
                parts.append(str(item))
        text = "\n".join(parts)
    if len(text) > MAX_RESULT_CHARS:
        text = text[:MAX_RESULT_CHARS] + f"\n… (truncated, {len(text) - MAX_RESULT_CHARS} more chars)"
    return text


def block_to_dict(block: Any) -> dict | None:
    """Accepts an SDK block dataclass or a raw transcript dict."""
    if isinstance(block, TextBlock):
        return {"type": "text", "text": block.text}
    if isinstance(block, ThinkingBlock):
        return {"type": "thinking", "text": block.thinking} if block.thinking else None
    if isinstance(block, ToolUseBlock):
        return {"type": "tool_use", "id": block.id, "name": block.name, "input": block.input}
    if isinstance(block, ToolResultBlock):
        return {
            "type": "tool_result",
            "tool_use_id": block.tool_use_id,
            "content": _flatten_result(block.content),
            "is_error": bool(block.is_error),
        }
    if is_dataclass(block):
        block = asdict(block)
    if not isinstance(block, dict):
        return None

    kind = block.get("type")
    if kind == "text":
        return {"type": "text", "text": block.get("text", "")}
    if kind == "thinking":
        return {"type": "thinking", "text": block["thinking"]} if block.get("thinking") else None
    if kind in ("tool_use", "server_tool_use"):
        return {"type": "tool_use", "id": block.get("id"), "name": block.get("name"), "input": block.get("input", {})}
    if kind == "tool_result":
        return {
            "type": "tool_result",
            "tool_use_id": block.get("tool_use_id"),
            "content": _flatten_result(block.get("content")),
            "is_error": bool(block.get("is_error")),
        }
    if kind == "image":
        return {"type": "text", "text": "[image]"}
    return None


def _blocks(content: Any) -> list[dict]:
    if isinstance(content, str):
        return [{"type": "text", "text": content}]
    return [b for b in (block_to_dict(x) for x in content or []) if b]


def _user_role(blocks: list[dict]) -> str:
    if blocks and all(b["type"] == "tool_result" for b in blocks):
        return "tool"
    text = " ".join(b.get("text", "") for b in blocks if b["type"] == "text")
    if "<local-command-stdout>" in text or "<command-name>" in text:
        return "system"
    return "user"


def _clean_command_text(blocks: list[dict]) -> list[dict]:
    for b in blocks:
        if b["type"] == "text":
            b["text"] = COMMAND_TAG_RE.sub("", b["text"]).strip()
    return [b for b in blocks if b["type"] != "text" or b["text"]]


def sdk_message_to_dict(msg: AssistantMessage | UserMessage) -> dict | None:
    """Live message from ClaudeSDKClient → UI message (or None if nothing to show)."""
    if isinstance(msg, AssistantMessage):
        blocks = _blocks(msg.content)
        role = "assistant"
        msg_id = msg.uuid or msg.message_id
    else:
        blocks = _blocks(msg.content)
        role = _user_role(blocks)
        if role == "user":
            return None  # the UI already shows what the user typed
        msg_id = msg.uuid
    if role == "system":
        blocks = _clean_command_text(blocks)
    if not blocks:
        return None
    return {
        "id": msg_id or uuid.uuid4().hex,
        "role": role,
        "blocks": blocks,
        "parent_tool_use_id": msg.parent_tool_use_id,
    }


def history_message_to_dict(msg: Any) -> dict | None:
    """SessionMessage from get_session_messages() → UI message."""
    raw = msg.message or {}
    blocks = _blocks(raw.get("content"))
    if msg.type == "assistant":
        role = "assistant"
    else:
        role = _user_role(blocks)
        if role == "system":
            blocks = _clean_command_text(blocks)
    if not blocks:
        return None
    return {"id": msg.uuid, "role": role, "blocks": blocks, "parent_tool_use_id": None}
