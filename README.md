<div align="center">

# ✦ Spunky-Claude

**Claude Code, in your browser.**

A friendly web interface for [Claude Code](https://docs.claude.com/en/docs/claude-code) that runs on your own computer.
Chat with Claude, approve file edits with a click, answer its questions with buttons, and resume your CLI sessions from the browser.

![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)

</div>

> **Unofficial project.** Spunky-Claude is a fun community project and is not affiliated with or endorsed by Anthropic.
> It drives the real Claude Code engine through the official [Claude Agent SDK](https://pypi.org/project/claude-agent-sdk/).

---

## ✨ Features

| | |
|---|---|
| 🔐 **On-screen login** | Sign in with your Claude subscription (Pro/Max/Team), Anthropic Console, or an API key — no terminal needed. |
| 📁 **Folder sessions** | Paste a folder path (or browse), see its existing sessions, resume one or start fresh. |
| 🔄 **Shared with the CLI** | Sessions are Claude Code's own transcripts (`~/.claude/projects`) — start in the terminal, continue in the browser, and vice versa. |
| ✅ **Click-to-approve permissions** | *Allow once / Always allow / Deny* chips, file-edit diffs, command previews, and plan approval. |
| 💬 **Interactive questions** | When Claude asks you something, you get clickable options plus an "Other" box. |
| ⌨️ **Slash-command autocomplete** | Type `/` for every built-in command, skill and plugin command — plus a searchable **Commands** page. |
| ⚡ **Shortcut buttons** | *Create skill of this*, *Create .md file of this*, *Update .md files*, *Generate CLAUDE.md*… and your own. |
| 🎛️ **Live controls** | Switch model and permission mode mid-session, see context usage and cost, stop a running turn. |
| 🌗 **Dark / light / system theme** | |
| 🌐 **Claude in Chrome** | Optional: let Claude browse websites via the official [Claude in Chrome](https://claude.ai/chrome) extension. |

---

## 📦 Requirements

- **[Claude Code](https://docs.claude.com/en/docs/claude-code)** installed (`claude --version` should work)
- **Python 3.10+**
- **Node.js 20+** (only needed to build the frontend)
- A Claude account (Pro, Max, Team, Enterprise) **or** an Anthropic API key

Works on Windows, macOS and Linux.

---

## 🚀 Quick start

```bash
git clone https://github.com/<your-username>/spunky-claude.git
cd spunky-claude
```

**Windows**

```bat
start.bat
```

**macOS / Linux**

```bash
./start.sh
```

Then open **http://localhost:8000** and sign in.

The first run takes a minute — the script creates a Python virtual environment, installs packages and builds the frontend. After that it starts instantly.

<details>
<summary><b>Manual setup (if you prefer doing it step by step)</b></summary>

```bash
# 1. Backend packages
cd backend
python -m venv envs
envs\Scripts\activate          # Windows
# source envs/bin/activate     # macOS / Linux
pip install -r requirements.txt

# 2. Build the frontend (once, and again after pulling updates)
cd ../frontned
npm install
npm run build

# 3. Run
cd ../backend
python run.py                  # → http://localhost:8000
```

</details>

### Updating

```bash
git pull
cd frontned && npm install && npm run build
```

Then start it again as usual.

---

## 🧭 How to use

1. **Sign in** — the first screen offers Claude account, Console, or API-key login. If you're already logged in to Claude Code in your terminal, you go straight in.
2. **Pick a folder** — paste a path like `C:\Users\you\projects\my-app` (or click the folder icon to browse).
3. **Resume or start** — click an existing session or **New session**.
4. **Chat** — type normally, press `/` for commands, or click a shortcut button.
5. **Approve** — when Claude wants to edit a file or run a command, approve or deny it right in the chat.

### Web-only slash commands

These are handled by the web UI (in the CLI they open interactive screens). Everything else is sent to Claude Code unchanged.

| Command | What it does |
|---|---|
| `/model [name]` | Switch model (opens the picker without a name) |
| `/mode <mode>` | `default`, `acceptEdits`, `plan`, or `bypassPermissions` |
| `/clear`, `/new` | Start a new session in the same folder |
| `/resume` | Pick another session of this folder |
| `/theme` | Toggle dark / light |
| `/chrome` | Toggle Claude in Chrome for new sessions |
| `/help` | Open the Commands page |
| `/settings`, `/login`, `/exit` | Navigate |

---

## 🔒 Security & privacy

Spunky-Claude gives Claude the same power as the `claude` CLI — it can read and write files and run commands **on your machine**. It's built to run **locally, for you only**.

- The server listens on **`127.0.0.1` only** — other devices on your network can't reach it.
- Requests must be addressed to `localhost` / `127.0.0.1` (blocks DNS-rebinding attacks).
- Other websites can't use it: the chat WebSocket and all state-changing API calls check the page's origin.
- Your Claude login stays where Claude Code keeps it (`~/.claude/`), **outside this repository**.
- If you save an API key in the app, it's stored in plain text in `backend/data/settings.json` (git-ignored). Prefer the account login if that matters to you.
- **Bypass** permission mode lets Claude act without asking — use it only in folders you trust.

> ⚠️ **Do not expose this server to the internet** (e.g. by changing the host to `0.0.0.0`, port-forwarding, or tunneling). Anyone who can reach it can run commands on your computer.

**Nothing secret is committed:** `.gitignore` excludes the virtual environment, `node_modules`, build output, `backend/data/`, and `.env` files.

---

## 🛠️ Development

Run the backend and the Vite dev server (hot reload) side by side:

```bash
# terminal 1
cd backend && envs\Scripts\python run.py

# terminal 2
cd frontned && npm run dev        # → http://localhost:5173 (proxies /api and /ws to :8000)
```

- Port 8000 busy? Set `SPUNKY_PORT`, e.g. `set SPUNKY_PORT=8100` (Windows) / `export SPUNKY_PORT=8100` — both the backend and the Vite proxy use it.
- The backend runs without auto-reload on purpose: on Windows, uvicorn's reload mode uses an event loop that can't start subprocesses (every Claude session is one). Restart it after backend changes.
- Lint & type-check: `cd frontned && npm run lint && npx tsc -b`

### Project structure

```
spunky-claude/
├── start.bat / start.sh       one-command setup + launch
├── backend/                   Python · FastAPI · Claude Agent SDK
│   ├── run.py                 starts the server (API + built frontend)
│   ├── requirements.txt
│   └── app/
│       ├── main.py            app, middleware, serves frontned/dist
│       ├── config.py          host, port, allowed origins, CLI lookup
│       ├── security.py        origin guard
│       ├── schemas.py         request bodies
│       ├── routers/           thin HTTP / WebSocket endpoints
│       │   ├── auth.py        /api/auth/*      login, API key, logout
│       │   ├── sessions.py    /api/projects, /api/sessions/*
│       │   ├── system.py      /api/fs/*, /api/meta
│       │   └── chat.py        /ws/chat         live session
│       └── services/          all the logic
│           ├── chat_service.py      SDK client ↔ WebSocket, permission & question broker
│           ├── auth_service.py      wraps `claude auth …`
│           ├── session_service.py   list / read / rename / delete sessions
│           ├── meta_service.py      slash commands, models (cached)
│           ├── serializers.py       SDK messages → UI JSON
│           ├── fs_service.py        folder checks + browser
│           └── settings_store.py    backend/data/settings.json
└── frontned/                  React 19 · TypeScript · Vite · Tailwind · zustand
    └── src/
        ├── api/               transport only (axios + WebSocket client)
        ├── stores/            state & event handling (zustand)
        ├── hooks/             glue between api and stores
        ├── lib/               pure helpers
        ├── data/              static config (UI commands, default shortcuts)
        ├── components/        UI: layout, common, home, chat
        └── pages/             Login, Home, Chat, Commands, Settings
```

### Chat WebSocket protocol

| Direction | Message types |
|---|---|
| UI → server | `start`, `prompt`, `permission`, `answer`, `interrupt`, `set_model`, `set_permission_mode` |
| server → UI | `ready`, `session`, `delta`, `message`, `permission_request`, `question`, `request_resolved`, `result`, `context`, `system`, `status`, `error` |

Exact shapes: [`backend/app/routers/chat.py`](backend/app/routers/chat.py) and [`frontned/src/types/index.ts`](frontned/src/types/index.ts).

---

## ❓ Troubleshooting

| Problem | Fix |
|---|---|
| `error while attempting to bind on address ('127.0.0.1', 8000)` | Another copy is already running — close it, or use `SPUNKY_PORT`. |
| "Frontend not built yet" | `cd frontned && npm install && npm run build` |
| "Backend is not reachable" | Start the backend (`start.bat` / `./start.sh` / `python run.py`). |
| Chat says *Disconnected* | Open the app via `http://localhost:8000` (or `:5173` in dev) — other addresses are rejected on purpose. |
| `pip install` fails building a package | Use Python 3.10–3.13 if your Python version has no prebuilt wheels yet. |
| Claude in Chrome does nothing | Install/connect the [extension](https://claude.ai/chrome), enable it in Settings, then start a **new** session. |

---

## 🙏 Credits

Built on [Claude Code](https://docs.claude.com/en/docs/claude-code) and the [Claude Agent SDK](https://github.com/anthropics/claude-agent-sdk-python) by Anthropic.
