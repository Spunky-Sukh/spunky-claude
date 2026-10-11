"""A live Claude Code session driven by the Agent SDK, bridged to one WebSocket.

Outgoing events (server → UI) are plain dicts with a "type" key:
    ready, session, delta, message, permission_request, question, request_resolved,
    result, context, system, status, error
"""

import asyncio
import uuid
from collections.abc import Awaitable, Callable
from typing import Any

from claude_agent_sdk import (
    AssistantMessage,
    ClaudeAgentOptions,
    ClaudeSDKClient,
    PermissionResultAllow,
    PermissionResultDeny,
    ResultMessage,
    StreamEvent,
    SystemMessage,
    UserMessage,
)
from claude_agent_sdk.types import ToolPermissionContext

from app.config import claude_cli_path
from app.services.auth_service import auth_env
from app.services.serializers import sdk_message_to_dict

Send = Callable[[dict], Awaitable[None]]

QUESTION_TOOL = "AskUserQuestion"


class ChatSession:
    def __init__(self, send: Send):
        self._send = send
        self.client: ClaudeSDKClient | None = None
        self.session_id: str | None = None
        self._pending: dict[str, tuple[asyncio.Future, dict]] = {}
        self._reader: asyncio.Task | None = None
        self._stderr: list[str] = []

    # ---------- lifecycle ----------

    async def start(
        self,
        cwd: str,
        session_id: str | None = None,
        model: str | None = None,
        permission_mode: str = "default",
        chrome: bool = False,
    ) -> None:
        options = ClaudeAgentOptions(
            cwd=cwd,
            resume=session_id,
            model=model or None,
            permission_mode=permission_mode,  # type: ignore[arg-type]
            can_use_tool=self._can_use_tool,
            include_partial_messages=True,
            skills="all",
            cli_path=claude_cli_path(),
            env=auth_env(),
            extra_args={"chrome": None} if chrome else {},
            stderr=self._on_stderr,
        )
        self.session_id = session_id
        self.client = ClaudeSDKClient(options)
        await self.client.connect()

        info = await self.client.get_server_info() or {}
        await self._send(
            {
                "type": "ready",
                "session_id": session_id,
                "commands": info.get("commands", []),
                "models": info.get("models", []),
                "agents": info.get("agents", []),
                "account": info.get("account"),
                "version": info.get("claude_code_version"),
                "permission_mode": info.get("current_permission_mode", permission_mode),
            }
        )
        self._reader = asyncio.create_task(self._pump())

    async def close(self) -> None:
        self._resolve_all_pending()
        if self._reader:
            self._reader.cancel()
        if self.client:
            try:
                await self.client.disconnect()
            except Exception:
                pass

    # ---------- commands from the UI ----------

    async def prompt(self, text: str) -> None:
        assert self.client
        await self._send({"type": "status", "busy": True})
        await self.client.query(text)

    async def interrupt(self) -> None:
        self._resolve_all_pending()
        if self.client:
            await self.client.interrupt()

    async def set_model(self, model: str | None) -> None:
        if self.client:
            await self.client.set_model(model or None)

    async def set_permission_mode(self, mode: str) -> None:
        if self.client:
            await self.client.set_permission_mode(mode)  # type: ignore[arg-type]

    def answer_permission(self, request_id: str, decision: str, message: str | None = None) -> None:
        """decision: allow | allow_always | deny"""
        entry = self._pending.get(request_id)
        if entry and not entry[0].done():
            entry[0].set_result({"decision": decision, "message": message})

    def answer_question(self, request_id: str, answers: dict[str, str]) -> None:
        entry = self._pending.get(request_id)
        if entry and not entry[0].done():
            entry[0].set_result({"decision": "answer", "answers": answers})

    # ---------- permission bridge ----------

    async def _can_use_tool(self, tool_name: str, tool_input: dict[str, Any], context: ToolPermissionContext):
        request_id = uuid.uuid4().hex
        future: asyncio.Future = asyncio.get_running_loop().create_future()
        self._pending[request_id] = (future, tool_input)

        if tool_name == QUESTION_TOOL:
            await self._send({"type": "question", "request_id": request_id, "questions": tool_input.get("questions", [])})
        else:
            await self._send(
                {
                    "type": "permission_request",
                    "request_id": request_id,
                    "tool_name": tool_name,
                    "tool_use_id": context.tool_use_id,
                    "input": tool_input,
                    "can_always_allow": bool(context.suggestions),
                }
            )

        try:
            reply = await future
        finally:
            self._pending.pop(request_id, None)
            await self._send({"type": "request_resolved", "request_id": request_id})

        decision = reply.get("decision")
        if decision == "answer":
            return PermissionResultAllow(updated_input={**tool_input, "answers": reply.get("answers", {})})
        if decision == "allow":
            return PermissionResultAllow(updated_input=tool_input)
        if decision == "allow_always":
            return PermissionResultAllow(updated_input=tool_input, updated_permissions=context.suggestions)
        return PermissionResultDeny(message=reply.get("message") or "The user denied this action.")

    def _resolve_all_pending(self) -> None:
        for future, _ in list(self._pending.values()):
            if not future.done():
                future.set_result({"decision": "deny", "message": "Interrupted by the user."})

    # ---------- streaming SDK messages → UI ----------

    async def _pump(self) -> None:
        assert self.client
        try:
            async for msg in self.client.receive_messages():
                await self._forward(msg)
        except asyncio.CancelledError:
            raise
        except Exception as exc:  # surface crashes of the Claude process to the UI
            detail = "\n".join(self._stderr[-15:])
            await self._send({"type": "error", "message": f"{exc}\n{detail}".strip()})
            await self._send({"type": "status", "busy": False})

    async def _forward(self, msg: Any) -> None:
        if isinstance(msg, StreamEvent):
            event = msg.event
            if event.get("type") == "content_block_delta":
                delta = event.get("delta", {})
                if delta.get("type") == "text_delta":
                    await self._send({"type": "delta", "kind": "text", "text": delta.get("text", ""), "parent_tool_use_id": msg.parent_tool_use_id})
                elif delta.get("type") == "thinking_delta":
                    await self._send({"type": "delta", "kind": "thinking", "text": delta.get("thinking", ""), "parent_tool_use_id": msg.parent_tool_use_id})
            return

        if isinstance(msg, (AssistantMessage, UserMessage)):
            data = sdk_message_to_dict(msg)
            if data:
                await self._send({"type": "message", "message": data})
            return

        if isinstance(msg, SystemMessage):
            if msg.subtype == "init":
                sid = msg.data.get("session_id")
                if sid:
                    self.session_id = sid
                    await self._send({"type": "session", "session_id": sid, "model": msg.data.get("model")})
            else:
                await self._send({"type": "system", "subtype": msg.subtype, "data": _safe(msg.data)})
            return

        if isinstance(msg, ResultMessage):
            self.session_id = msg.session_id or self.session_id
            await self._send(
                {
                    "type": "result",
                    "session_id": msg.session_id,
                    "is_error": msg.is_error,
                    "subtype": msg.subtype,
                    "result": msg.result if msg.is_error else None,
                    "duration_ms": msg.duration_ms,
                    "num_turns": msg.num_turns,
                    "total_cost_usd": msg.total_cost_usd,
                    "usage": msg.usage,
                }
            )
            await self._send({"type": "status", "busy": False})
            await self._send_context_usage()

    async def _send_context_usage(self) -> None:
        if not self.client:
            return
        try:
            usage = await self.client.get_context_usage()
            await self._send(
                {
                    "type": "context",
                    "total_tokens": usage.get("totalTokens"),
                    "max_tokens": usage.get("maxTokens"),
                    "percentage": usage.get("percentage"),
                    "model": usage.get("model"),
                }
            )
        except Exception:
            pass

    def _on_stderr(self, line: str) -> None:
        self._stderr.append(line)
        del self._stderr[:-50]


def _safe(data: Any) -> Any:
    """Keep only JSON-friendly values for forwarding."""
    if isinstance(data, dict):
        return {k: _safe(v) for k, v in data.items()}
    if isinstance(data, list):
        return [_safe(v) for v in data]
    if isinstance(data, (str, int, float, bool)) or data is None:
        return data
    return str(data)
