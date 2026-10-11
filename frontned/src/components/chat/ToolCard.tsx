import {
  Bot,
  CheckCircle2,
  ChevronRight,
  FileEdit,
  FilePlus,
  FileText,
  Globe,
  ListTodo,
  Search,
  SquareTerminal,
  Wrench,
  XCircle,
} from 'lucide-react'
import { useState } from 'react'
import { isBrowserTool, toolLabel, toolSummary } from '../../lib/tools'
import { useChatStore } from '../../stores/chatStore'
import { Spinner } from '../common/ui'
import { MessageView } from './MessageView'

const ICONS: Record<string, typeof Wrench> = {
  Bash: SquareTerminal,
  PowerShell: SquareTerminal,
  Read: FileText,
  Write: FilePlus,
  Edit: FileEdit,
  Glob: Search,
  Grep: Search,
  WebFetch: Globe,
  WebSearch: Globe,
  Agent: Bot,
  Task: Bot,
  TodoWrite: ListTodo,
}

interface Props {
  id: string
  name: string
  input: Record<string, unknown>
}

export function ToolCard({ id, name, input }: Props) {
  const result = useChatStore((s) => s.toolResults[id])
  const children = useChatStore((s) => s.subagentMessages[id])
  const [open, setOpen] = useState(false)

  const Icon = isBrowserTool(name) ? Globe : (ICONS[name] ?? Wrench)
  const summary = toolSummary(name, input)

  if (name === 'TodoWrite') return <TodoList input={input} />

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface-2"
      >
        <ChevronRight className={`size-3.5 shrink-0 text-muted transition-transform ${open ? 'rotate-90' : ''}`} />
        <Icon className="size-4 shrink-0 text-accent" />
        <span className="shrink-0 font-medium">{toolLabel(name)}</span>
        <span className="min-w-0 flex-1 truncate font-mono text-xs text-muted">{summary}</span>
        {!result ? (
          <Spinner className="size-3.5" />
        ) : result.is_error ? (
          <XCircle className="size-4 shrink-0 text-danger" />
        ) : (
          <CheckCircle2 className="size-4 shrink-0 text-success" />
        )}
      </button>

      {open && (
        <div className="space-y-2 border-t border-border bg-bg/50 p-3">
          <ToolInput name={name} input={input} />
          {children && children.length > 0 && (
            <div className="space-y-2 border-l-2 border-accent/40 pl-3">
              {children.map((m) => (
                <MessageView key={m.id} message={m} />
              ))}
            </div>
          )}
          {result && <Output text={result.content} error={result.is_error} />}
        </div>
      )}
    </div>
  )
}

function ToolInput({ name, input }: { name: string; input: Record<string, unknown> }) {
  if (name === 'Edit' && typeof input.old_string === 'string') {
    return <Diff oldText={input.old_string} newText={String(input.new_string ?? '')} />
  }
  if (name === 'Write' && typeof input.content === 'string') {
    return <Pre text={input.content} label="content" />
  }
  if ((name === 'Bash' || name === 'PowerShell') && typeof input.command === 'string') {
    return <Pre text={`$ ${input.command}`} />
  }
  return <Pre text={JSON.stringify(input, null, 2)} label="input" />
}

export function Diff({ oldText, newText }: { oldText: string; newText: string }) {
  return (
    <div className="overflow-x-auto rounded-md border border-border font-mono text-xs">
      {oldText.split('\n').map((l, i) => (
        <div key={`o${i}`} className="whitespace-pre bg-danger/10 px-2 text-danger">- {l}</div>
      ))}
      {newText.split('\n').map((l, i) => (
        <div key={`n${i}`} className="whitespace-pre bg-success/10 px-2 text-success">+ {l}</div>
      ))}
    </div>
  )
}

function Pre({ text, label }: { text: string; label?: string }) {
  return (
    <div>
      {label && <div className="mb-1 text-[10px] uppercase tracking-wider text-muted">{label}</div>}
      <pre className="max-h-72 overflow-auto rounded-md border border-border bg-code p-2 font-mono text-xs whitespace-pre-wrap">
        {text}
      </pre>
    </div>
  )
}

function Output({ text, error }: { text: string; error: boolean }) {
  const [full, setFull] = useState(false)
  const long = text.length > 1500
  const shown = full || !long ? text : text.slice(0, 1500) + '…'
  return (
    <div>
      <div className={`mb-1 text-[10px] uppercase tracking-wider ${error ? 'text-danger' : 'text-muted'}`}>
        {error ? 'error' : 'output'}
      </div>
      <pre
        className={`max-h-96 overflow-auto rounded-md border p-2 font-mono text-xs whitespace-pre-wrap ${
          error ? 'border-danger/30 bg-danger/5 text-danger' : 'border-border bg-code'
        }`}
      >
        {shown || '(no output)'}
      </pre>
      {long && (
        <button onClick={() => setFull(!full)} className="mt-1 cursor-pointer text-xs text-accent">
          {full ? 'Show less' : 'Show all'}
        </button>
      )}
    </div>
  )
}

function TodoList({ input }: { input: Record<string, unknown> }) {
  const todos = (input.todos as { content: string; status: string }[] | undefined) ?? []
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 text-sm">
      <div className="mb-1 flex items-center gap-2 font-medium">
        <ListTodo className="size-4 text-accent" /> Todos
      </div>
      {todos.map((t, i) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          <span>{t.status === 'completed' ? '☑' : t.status === 'in_progress' ? '◐' : '☐'}</span>
          <span className={t.status === 'completed' ? 'text-muted line-through' : t.status === 'in_progress' ? 'font-medium' : ''}>
            {t.content}
          </span>
        </div>
      ))}
    </div>
  )
}
