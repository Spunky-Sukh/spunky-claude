import { Check, CheckCheck, ShieldQuestion, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { toolLabel, toolSummary } from '../../lib/tools'
import type { PermissionRequest } from '../../types'
import { Markdown } from '../common/Markdown'
import { Diff } from './ToolCard'

type Decision = 'allow' | 'allow_always' | 'deny'

function title(req: PermissionRequest): string {
  switch (req.tool_name) {
    case 'Bash':
    case 'PowerShell':
      return 'Claude wants to run a command'
    case 'Write':
      return 'Claude wants to create a file'
    case 'Edit':
    case 'NotebookEdit':
      return 'Claude wants to edit a file'
    case 'WebFetch':
      return 'Claude wants to fetch a web page'
    case 'ExitPlanMode':
      return "Here's Claude's plan — ready to start?"
    default:
      return `Claude wants to use ${toolLabel(req.tool_name)}`
  }
}

export function PermissionCard({ req, onRespond }: { req: PermissionRequest; onRespond: (d: Decision, msg?: string) => void }) {
  const [feedback, setFeedback] = useState('')
  const isPlan = req.tool_name === 'ExitPlanMode'
  const summary = toolSummary(req.tool_name, req.input)

  return (
    <div className="rounded-xl border-2 border-accent/50 bg-surface p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2 font-medium">
        <ShieldQuestion className="size-5 text-accent" />
        {title(req)}
      </div>

      {isPlan ? (
        <div className="max-h-96 overflow-y-auto rounded-lg border border-border bg-bg p-3 text-sm">
          <Markdown text={String(req.input.plan ?? '')} />
        </div>
      ) : req.tool_name === 'Edit' && typeof req.input.old_string === 'string' ? (
        <>
          <div className="mb-2 font-mono text-xs text-muted">{summary}</div>
          <div className="max-h-72 overflow-y-auto">
            <Diff oldText={req.input.old_string} newText={String(req.input.new_string ?? '')} />
          </div>
        </>
      ) : (
        <pre className="max-h-72 overflow-auto rounded-lg border border-border bg-code p-3 font-mono text-xs whitespace-pre-wrap">
          {req.tool_name === 'Write'
            ? `${summary}\n\n${String(req.input.content ?? '').slice(0, 3000)}`
            : summary || JSON.stringify(req.input, null, 2)}
        </pre>
      )}

      {typeof req.input.description === 'string' && !isPlan && (
        <p className="mt-2 text-xs text-muted">{req.input.description}</p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <Chip variant="primary" onClick={() => onRespond('allow')}>
          <Check className="size-3.5" /> {isPlan ? 'Approve plan' : 'Allow once'}
        </Chip>
        {req.can_always_allow && !isPlan && (
          <Chip onClick={() => onRespond('allow_always')}>
            <CheckCheck className="size-3.5" /> Always allow
          </Chip>
        )}
        <Chip variant="danger" onClick={() => onRespond('deny', feedback || undefined)}>
          <X className="size-3.5" /> {isPlan ? 'Keep planning' : 'Deny'}
        </Chip>
      </div>

      <input
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && feedback.trim() && onRespond('deny', feedback)}
        placeholder={isPlan ? 'What should change in the plan? (Enter to send)' : 'Or tell Claude what to do instead… (Enter to send)'}
        className="mt-3 h-9 w-full rounded-lg border border-border bg-bg px-3 text-sm outline-none focus:border-accent"
      />
    </div>
  )
}

export function Chip({
  children,
  onClick,
  variant = 'default',
  active = false,
}: {
  children: ReactNode
  onClick: () => void
  variant?: 'default' | 'primary' | 'danger'
  active?: boolean
}) {
  const styles = {
    default: active ? 'border-accent bg-accent-soft text-accent' : 'border-border bg-surface hover:border-accent hover:text-accent',
    primary: 'border-accent bg-accent text-white hover:bg-accent-hover',
    danger: 'border-danger/40 text-danger hover:bg-danger/10',
  }
  return (
    <button
      onClick={onClick}
      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${styles[variant]}`}
    >
      {children}
    </button>
  )
}
