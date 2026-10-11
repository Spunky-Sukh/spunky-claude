import { ArrowLeft, Cpu, Globe, Shield } from 'lucide-react'
import type { Ref } from 'react'
import { Link } from 'react-router'
import { PERMISSION_MODES } from '../../data/uiCommands'
import { folderName, formatCost, formatTokens } from '../../lib/format'
import { useChatStore } from '../../stores/chatStore'
import { useSettingsStore } from '../../stores/settingsStore'
import type { PermissionMode } from '../../types'

interface Props {
  modelSelectRef: Ref<HTMLSelectElement>
  onModelChange: (model: string | null) => void
  onModeChange: (mode: PermissionMode) => void
}

export function ChatHeader({ modelSelectRef, onModelChange, onModeChange }: Props) {
  const { cwd, sessionId, models, model, activeModel, permissionMode, context, totalCost, connection } = useChatStore()
  const chrome = useSettingsStore((s) => s.chromeEnabled)

  return (
    <header className="flex flex-wrap items-center gap-3 border-b border-border bg-surface px-4 py-2.5 pl-12">
      <Link
        to={`/?path=${encodeURIComponent(cwd ?? '')}`}
        className="flex min-w-0 items-center gap-2 text-sm hover:text-accent"
        title={cwd ?? ''}
      >
        <ArrowLeft className="size-4 shrink-0 text-muted" />
        <span className="truncate font-semibold">{cwd ? folderName(cwd) : ''}</span>
      </Link>
      <span className="font-mono text-xs text-muted" title={sessionId ?? ''}>
        {sessionId ? sessionId.slice(0, 8) : 'new session'}
      </span>
      <ConnectionDot state={connection} />

      <div className="ml-auto flex flex-wrap items-center gap-2">
        {context && (
          <div
            className="flex items-center gap-2 text-xs text-muted"
            title={`${formatTokens(context.total_tokens)} / ${formatTokens(context.max_tokens)} tokens`}
          >
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-2">
              <div
                className={`h-full ${context.percentage > 80 ? 'bg-danger' : context.percentage > 60 ? 'bg-warning' : 'bg-accent'}`}
                style={{ width: `${Math.min(100, context.percentage)}%` }}
              />
            </div>
            {Math.round(context.percentage)}%
          </div>
        )}
        {totalCost > 0 && <span className="text-xs text-muted">{formatCost(totalCost)}</span>}

        {chrome && (
          <span title="Claude in Chrome enabled" className="flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-xs text-accent">
            <Globe className="size-3" /> Chrome
          </span>
        )}

        <label className="flex items-center gap-1 rounded-lg border border-border bg-bg px-2 text-xs" title={activeModel ?? ''}>
          <Cpu className="size-3.5 text-muted" />
          <select
            ref={modelSelectRef}
            value={model ?? 'default'}
            onChange={(e) => onModelChange(e.target.value === 'default' ? null : e.target.value)}
            className="h-7 cursor-pointer bg-transparent outline-none"
          >
            {models.length === 0 && <option value="default">Default model</option>}
            {models.map((m) => (
              <option key={m.value} value={m.value}>
                {m.displayName}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-1 rounded-lg border border-border bg-bg px-2 text-xs">
          <Shield className={`size-3.5 ${permissionMode === 'bypassPermissions' ? 'text-danger' : 'text-muted'}`} />
          <select
            value={permissionMode}
            onChange={(e) => onModeChange(e.target.value as PermissionMode)}
            className="h-7 cursor-pointer bg-transparent outline-none"
          >
            {PERMISSION_MODES.map((m) => (
              <option key={m.value} value={m.value} title={m.description}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </header>
  )
}

function ConnectionDot({ state }: { state: string }) {
  const color = state === 'ready' ? 'bg-success' : state === 'connecting' ? 'bg-warning animate-pulse' : 'bg-danger'
  return <span title={state} className={`size-2 rounded-full ${color}`} />
}
