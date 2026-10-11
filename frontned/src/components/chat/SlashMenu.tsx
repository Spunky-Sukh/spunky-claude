import { useEffect, useRef } from 'react'
import type { Suggestion } from '../../lib/slash'

const BADGE: Record<Suggestion['source'], string> = {
  ui: 'web',
  claude: 'claude',
  plugin: 'plugin',
}

export function SlashMenu({ items, active, onPick, onHover }: { items: Suggestion[]; active: number; onPick: (s: Suggestion) => void; onHover: (i: number) => void }) {
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    listRef.current?.children[active]?.scrollIntoView({ block: 'nearest' })
  }, [active])

  return (
    <div className="absolute bottom-full left-0 right-0 mb-2 overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
      <div ref={listRef} className="max-h-72 overflow-y-auto py-1">
        {items.map((c, i) => (
          <button
            key={`${c.source}:${c.name}`}
            onMouseDown={(e) => {
              e.preventDefault()
              onPick(c)
            }}
            onMouseEnter={() => onHover(i)}
            className={`flex w-full cursor-pointer items-baseline gap-3 px-3 py-1.5 text-left ${i === active ? 'bg-accent-soft' : ''}`}
          >
            <span className={`shrink-0 font-mono text-sm ${i === active ? 'text-accent' : ''}`}>
              /{c.name}
              {c.argumentHint && <span className="ml-1 text-muted">{c.argumentHint}</span>}
            </span>
            <span className="min-w-0 flex-1 truncate text-xs text-muted">{c.description}</span>
            <span className="shrink-0 rounded bg-surface-2 px-1.5 text-[10px] uppercase text-muted">{BADGE[c.source]}</span>
          </button>
        ))}
      </div>
      <div className="border-t border-border px-3 py-1 text-[10px] text-muted">↑↓ navigate · Tab/Enter select · Esc close</div>
    </div>
  )
}
