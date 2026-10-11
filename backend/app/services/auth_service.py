"""Login / logout / status — wraps `claude auth ...` so login can happen in the browser UI."""

import asyncio
import json
import re
import uuid
from dataclasses import dataclass, field
from typing import Literal

from app.config import claude_cli_path
from app.services import settings_store

URL_RE = re.compile(r"https://\S+")
ANSI_RE = re.compile(r"\x1b\[[0-9;?]*[A-Za-z]")

LoginMethod = Literal["claudeai", "console"]
LoginState = Literal["starting", "awaiting_user", "success", "error", "cancelled"]


async def _run_cli(*args: str, timeout: float = 30) -> tuple[int, str]:
    proc = await asyncio.create_subprocess_exec(
        claude_cli_path(),
        *args,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.STDOUT,
    )
    out, _ = await asyncio.wait_for(proc.communicate(), timeout=timeout)
    return proc.returncode or 0, out.decode("utf-8", "replace")


async def get_status() -> dict:
    """Combine CLI login status with an optionally saved API key."""
    api_key = settings_store.get("api_key")
    cli: dict = {}
    try:
        _, out = await _run_cli("auth", "status", "--json")
        cli = json.loads(out[out.find("{") :])
    except (Exception, asyncio.TimeoutError):
        cli = {}

    cli_logged_in = bool(cli.get("loggedIn"))
    return {
        "logged_in": cli_logged_in or bool(api_key),
        "active_method": "api_key" if api_key else (cli.get("authMethod") if cli_logged_in else None),
        "cli_logged_in": cli_logged_in,
        "email": cli.get("email"),
        "organization": cli.get("orgName"),
        "subscription": cli.get("subscriptionType"),
        "api_key_set": bool(api_key),
        "api_key_hint": f"{api_key[:10]}…{api_key[-4:]}" if api_key else None,
    }


def save_api_key(key: str) -> None:
    settings_store.set_value("api_key", key.strip())


def remove_api_key() -> None:
    settings_store.set_value("api_key", None)


def auth_env() -> dict[str, str]:
    """Extra env vars for Claude processes (API key mode)."""
    key = settings_store.get("api_key")
    return {"ANTHROPIC_API_KEY": key} if key else {}


async def logout() -> None:
    await _run_cli("auth", "logout")


@dataclass
class LoginFlow:
    """One running `claude auth login` process whose output is surfaced to the UI."""

    method: LoginMethod
    id: str = field(default_factory=lambda: uuid.uuid4().hex)
    state: LoginState = "starting"
    url: str | None = None
    output: str = ""
    proc: asyncio.subprocess.Process | None = None

    async def start(self) -> None:
        self.proc = await asyncio.create_subprocess_exec(
            claude_cli_path(),
            "auth",
            "login",
            f"--{self.method}",
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT,
        )
        asyncio.create_task(self._watch())

    async def _watch(self) -> None:
        assert self.proc and self.proc.stdout
        while chunk := await self.proc.stdout.read(1024):
            self.output += ANSI_RE.sub("", chunk.decode("utf-8", "replace"))
            if not self.url and (match := URL_RE.search(self.output)):
                self.url = match.group(0)
                self.state = "awaiting_user"
        code = await self.proc.wait()
        if self.state != "cancelled":
            self.state = "success" if code == 0 else "error"

    async def submit_code(self, code: str) -> None:
        if self.proc and self.proc.stdin and self.proc.returncode is None:
            self.proc.stdin.write((code.strip() + "\n").encode())
            await self.proc.stdin.drain()

    def cancel(self) -> None:
        self.state = "cancelled"
        if self.proc and self.proc.returncode is None:
            self.proc.kill()

    def to_dict(self) -> dict:
        return {"id": self.id, "method": self.method, "state": self.state, "url": self.url, "output": self.output[-4000:]}


_current_login: LoginFlow | None = None


async def start_login(method: LoginMethod) -> LoginFlow:
    global _current_login
    if _current_login:
        _current_login.cancel()
    _current_login = LoginFlow(method=method)
    await _current_login.start()
    return _current_login


def get_login(login_id: str) -> LoginFlow | None:
    return _current_login if _current_login and _current_login.id == login_id else None
