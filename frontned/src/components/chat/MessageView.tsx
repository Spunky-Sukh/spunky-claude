import { Brain, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { useSettingsStore } from '../../stores/settingsStore'
import type { ChatMessage } from '../../types'
import { Markdown } from '../common/Markdown'
import { ToolCard } from './ToolCard'

export function MessageView({ message }: { message: ChatMessage }) {
  if (message.role === 'user') {
    const text = message.blocks.map((b) => (b.type === 'text' ? b.text : '')).join('\n')
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-accent-soft px-4 py-2.5 whitespace-pre-wrap text-fg">
          {text}
        </div>
      </div>
    )
  }

  if (message.role === 'system') {
    const text = message.blocks.map((b) => (b.type === 'text' ? b.text : '')).join('\n')
    return (
      <pre className="rounded-lg border border-dashed border-border px-3 py-2 font-mono text-xs whitespace-pre-wrap text-muted">
        {text}
      </pre>
    )
  }

  return (
    <div className="space-y-2">
      {message.blocks.map((b, i) => {
        if (b.type === 'text') return <Markdown key={i} text={b.text} />
        if (b.type === 'thinking') return <Thinking key={i} text={b.text} />
        if (b.type === 'tool_use') return <ToolCard key={b.id} id={b.id} name={b.name} input={b.input} />
        return null
      })}
    </div>
  )
}

export function Thinking({ text, live = false }: { text: string; live?: boolean }) {
  const showThinking = useSettingsStore((s) => s.showThinking)
  const [open, setOpen] = useState(live)
  if (!showThinking) return null
  return (
    <div className="text-sm text-muted">
      <button onClick={() => setOpen(!open)} className="flex cursor-pointer items-center gap-1.5 hover:text-fg">
        <ChevronRight className={`size-3.5 transition-transform ${open ? 'rotate-90' : ''}`} />
        <Brain className="size-3.5" /> {live ? 'Thinking…' : 'Thought process'}
      </button>
      {open && <div className="mt-1 border-l-2 border-border pl-3 whitespace-pre-wrap italic">{text}</div>}
    </div>
  )
}
