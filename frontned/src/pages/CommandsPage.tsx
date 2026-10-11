import { Search, SquareSlash } from 'lucide-react'
import { useState } from 'react'
import { ErrorBanner, Spinner } from '../components/common/ui'
import { useMeta } from '../hooks/useMeta'
import { allCommands, type Suggestion } from '../lib/slash'

const SECTIONS: { source: Suggestion['source']; title: string; hint: string }[] = [
  { source: 'ui', title: 'Spunky-Claude commands', hint: 'Handled by the web UI (these are interactive screens in the CLI).' },
  { source: 'claude', title: 'Claude Code commands & skills', hint: 'Sent to Claude Code exactly like typing them in the CLI.' },
  { source: 'plugin', title: 'Plugin commands', hint: 'Provided by your installed plugins (namespace:command).' },
]

export function CommandsPage() {
  const { meta, loading, error } = useMeta()
  const [query, setQuery] = useState('')

  const q = query.toLowerCase()
  const commands = allCommands(meta?.commands ?? []).filter(
    (c) => !q || c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q),
  )

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-6 flex items-center gap-3">
          <SquareSlash className="size-7 text-accent" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Slash commands</h1>
            <p className="text-sm text-muted">
              Type <kbd className="rounded border border-border bg-surface px-1 font-mono">/</kbd> in a chat to get these
              as autocomplete.
            </p>
          </div>
        </div>

        <div className="sticky top-0 z-10 -mx-2 mb-6 bg-bg px-2 py-2">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 focus-within:border-accent">
            <Search className="size-4 text-muted" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search commands…"
              className="h-11 flex-1 bg-transparent text-sm outline-none"
            />
            <span className="text-xs text-muted">{commands.length}</span>
          </div>
        </div>

        {error && <ErrorBanner message={error} />}

        {SECTIONS.map((section) => {
          const items = commands.filter((c) => c.source === section.source)
          const pending = loading && section.source !== 'ui'
          if (!items.length && !pending) return null
          return (
            <section key={section.source} className="mb-10">
              <h2 className="text-lg font-semibold">{section.title}</h2>
              <p className="mb-3 text-sm text-muted">{section.hint}</p>
              {pending ? (
                <div className="flex items-center gap-2 text-sm text-muted">
                  <Spinner /> Asking Claude Code for its commands…
                </div>
              ) : (
                <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
                  {items.map((c) => (
                    <div key={c.name} className="flex gap-4 px-4 py-3">
                      <div className="w-56 shrink-0 font-mono text-sm text-accent">
                        /{c.name}
                        {c.argumentHint && <div className="text-xs text-muted">{c.argumentHint}</div>}
                      </div>
                      <div className="text-sm text-muted">{c.description}</div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}
