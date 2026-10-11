import { ArrowRight, FolderOpen, FolderSearch, Plus, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { sessionsApi } from '../api/sessionsApi'
import { Button, ErrorBanner, Logo, Spinner } from '../components/common/ui'
import { FolderBrowser } from '../components/home/FolderBrowser'
import { SessionList } from '../components/home/SessionList'
import { useFolderSessions } from '../hooks/useFolderSessions'
import { folderName, timeAgo } from '../lib/format'
import type { Project } from '../types'

export function HomePage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const path = params.get('path')
  const [input, setInput] = useState(path ?? '')
  const [shownPath, setShownPath] = useState(path)
  const [browsing, setBrowsing] = useState(false)
  const [recent, setRecent] = useState<Project[]>([])
  const { folder, sessions, loading, error, reload, rename, remove } = useFolderSessions(path)

  // Sync the input when the URL changes (e.g. clicking a recent folder in the sidebar).
  if (path !== shownPath) {
    setShownPath(path)
    setInput(path ?? '')
  }
  useEffect(() => {
    sessionsApi.recentProjects().then(setRecent).catch(() => setRecent([]))
  }, [])

  const openFolder = (p: string) => p.trim() && setParams({ path: p.trim() })
  // Takes the folder path as an argument: the React Compiler reads a closure's
  // dependencies during render, so `folder!.path` in here would crash while folder is null.
  const chatUrl = (folderPath: string, sessionId?: string) =>
    `/chat?cwd=${encodeURIComponent(folderPath)}${sessionId ? `&session=${sessionId}` : ''}`

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="mb-8 flex items-center gap-3">
          <Logo className="size-10" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Where are we working today?</h1>
            <p className="text-sm text-muted">Paste a folder path to resume a session or start a new one.</p>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            openFolder(input)
          }}
          className="flex gap-2"
        >
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-surface px-3 focus-within:border-accent">
            <FolderOpen className="size-4 text-muted" />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="C:\Users\you\projects\my-app"
              className="h-12 flex-1 bg-transparent font-mono text-sm outline-none"
            />
            <button
              type="button"
              title="Browse folders"
              onClick={() => setBrowsing(true)}
              className="cursor-pointer rounded-md p-1.5 text-muted hover:bg-surface-2 hover:text-fg"
            >
              <FolderSearch className="size-4" />
            </button>
          </div>
          <Button type="submit" variant="primary" className="h-12 px-5" disabled={!input.trim()}>
            Open <ArrowRight className="size-4" />
          </Button>
        </form>

        {error && (
          <div className="mt-4">
            <ErrorBanner message={error} />
          </div>
        )}

        {path && folder?.is_dir && (
          <section className="mt-8">
            <div className="mb-3 flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-lg font-semibold">{folder.name}</h2>
                <p className="truncate font-mono text-xs text-muted">{folder.path}</p>
              </div>
              <button onClick={reload} title="Refresh" className="cursor-pointer rounded-md p-2 text-muted hover:bg-surface-2">
                <RefreshCw className="size-4" />
              </button>
              <Button variant="primary" onClick={() => navigate(chatUrl(folder.path))}>
                <Plus className="size-4" /> New session
              </Button>
            </div>
            {loading ? (
              <Spinner className="mx-auto my-8 size-6" />
            ) : (
              <SessionList sessions={sessions} onOpen={(id) => navigate(chatUrl(folder.path, id))} onRename={rename} onDelete={remove} />
            )}
          </section>
        )}

        {!path && recent.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted">Recent folders</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {recent.slice(0, 8).map((p) => (
                <button
                  key={p.path}
                  onClick={() => openFolder(p.path)}
                  className="cursor-pointer rounded-xl border border-border bg-surface p-4 text-left transition-colors hover:border-accent"
                >
                  <div className="flex items-center gap-2 font-medium">
                    <FolderOpen className="size-4 text-accent" />
                    <span className="truncate">{folderName(p.path)}</span>
                  </div>
                  <div className="mt-1 truncate font-mono text-xs text-muted">{p.path}</div>
                  <div className="mt-2 text-xs text-muted">
                    {p.session_count} session{p.session_count === 1 ? '' : 's'} · {timeAgo(p.last_modified)}
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>

      {browsing && (
        <FolderBrowser
          initial={folder?.is_dir ? folder.path : undefined}
          onClose={() => setBrowsing(false)}
          onPick={(p) => {
            setBrowsing(false)
            openFolder(p)
          }}
        />
      )}
    </div>
  )
}
