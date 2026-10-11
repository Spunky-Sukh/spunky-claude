import { GitBranch, MessageSquare, Pencil, Trash2 } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { timeAgo } from '../../lib/format'
import type { SessionInfo } from '../../types'

interface Props {
  sessions: SessionInfo[]
  onOpen: (id: string) => void
  onRename: (id: string, title: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function SessionList({ sessions, onOpen, onRename, onDelete }: Props) {
  const [editing, setEditing] = useState<string | null>(null)
  const [title, setTitle] = useState('')

  if (sessions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted">
        No sessions in this folder yet. Start a new one!
      </div>
    )
  }

  return (
    <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
      {sessions.map((s) => (
        <div key={s.session_id} className="group flex items-center gap-3 px-4 py-3 hover:bg-surface-2">
          <MessageSquare className="size-4 shrink-0 text-muted" />
          <div className="min-w-0 flex-1 cursor-pointer" onClick={() => editing !== s.session_id && onOpen(s.session_id)}>
            {editing === s.session_id ? (
              <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => setEditing(null)}
                onKeyDown={async (e) => {
                  if (e.key === 'Enter' && title.trim()) {
                    await onRename(s.session_id, title.trim())
                    setEditing(null)
                  }
                  if (e.key === 'Escape') setEditing(null)
                }}
                className="w-full rounded border border-accent bg-bg px-2 py-0.5 text-sm outline-none"
              />
            ) : (
              <div className="truncate text-sm font-medium">{s.summary || 'Untitled session'}</div>
            )}
            <div className="mt-0.5 flex items-center gap-3 text-xs text-muted">
              <span>{timeAgo(s.last_modified)}</span>
              {s.git_branch && s.git_branch !== 'HEAD' && (
                <span className="flex items-center gap-1">
                  <GitBranch className="size-3" />
                  {s.git_branch}
                </span>
              )}
              {s.first_prompt && s.first_prompt !== s.summary && <span className="truncate">{s.first_prompt}</span>}
            </div>
          </div>
          <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <IconButton
              title="Rename"
              onClick={() => {
                setTitle(s.summary)
                setEditing(s.session_id)
              }}
            >
              <Pencil className="size-3.5" />
            </IconButton>
            <IconButton
              title="Delete"
              danger
              onClick={() => {
                if (confirm('Delete this session permanently? It will also disappear from the CLI.')) void onDelete(s.session_id)
              }}
            >
              <Trash2 className="size-3.5" />
            </IconButton>
          </div>
        </div>
      ))}
    </div>
  )
}

function IconButton(props: { title: string; onClick: () => void; danger?: boolean; children: ReactNode }) {
  return (
    <button
      title={props.title}
      onClick={props.onClick}
      className={`cursor-pointer rounded-md p-1.5 text-muted hover:bg-surface ${props.danger ? 'hover:text-danger' : 'hover:text-fg'}`}
    >
      {props.children}
    </button>
  )
}
