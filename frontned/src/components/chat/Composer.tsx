import { ArrowUp, Square } from 'lucide-react'
import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { slashSuggestions, type Suggestion } from '../../lib/slash'
import { useChatStore } from '../../stores/chatStore'
import { ShortcutBar } from './ShortcutBar'
import { SlashMenu } from './SlashMenu'

interface Props {
  onSubmit: (text: string) => void
  onStop: () => void
  disabled: boolean
}

export function Composer({ onSubmit, onStop, disabled }: Props) {
  const [text, setText] = useState('')
  const [active, setActive] = useState(0)
  const [menuClosed, setMenuClosed] = useState(false)
  const ref = useRef<HTMLTextAreaElement>(null)
  const commands = useChatStore((s) => s.commands)
  const busy = useChatStore((s) => s.busy)

  const suggestions = menuClosed ? [] : slashSuggestions(text, commands)
  const showMenu = suggestions.length > 0

  // Auto-grow the textarea.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 240)}px`
  }, [text])

  useEffect(() => {
    if (!disabled) ref.current?.focus()
  }, [disabled])

  const submit = (value = text) => {
    const v = value.trim()
    if (!v || disabled) return
    onSubmit(v)
    setText('')
    setMenuClosed(false)
  }

  const pick = (s: Suggestion) => {
    setText(`/${s.name} `)
    setActive(0)
    ref.current?.focus()
  }

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMenu) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        return setActive((a) => (a + 1) % suggestions.length)
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        return setActive((a) => (a - 1 + suggestions.length) % suggestions.length)
      }
      if (e.key === 'Tab' || (e.key === 'Enter' && !e.shiftKey)) {
        e.preventDefault()
        const chosen = suggestions[active]
        // Enter on an already fully-typed command runs it; otherwise complete it.
        if (e.key === 'Enter' && text === `/${chosen.name}`) return submit()
        return pick(chosen)
      }
      if (e.key === 'Escape') return setMenuClosed(true)
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="border-t border-border bg-bg px-4 pt-3 pb-4">
      <div className="mx-auto max-w-3xl">
        <ShortcutBar onRun={(p) => submit(p)} disabled={disabled} />
        <div className="relative">
          {showMenu && <SlashMenu items={suggestions} active={Math.min(active, suggestions.length - 1)} onPick={pick} onHover={setActive} />}
          <div className="flex items-end gap-2 rounded-2xl border border-border bg-surface p-2 shadow-sm focus-within:border-accent">
            <textarea
              ref={ref}
              rows={1}
              value={text}
              disabled={disabled}
              onChange={(e) => {
                setText(e.target.value)
                setActive(0)
                setMenuClosed(false)
              }}
              onKeyDown={onKeyDown}
              placeholder={disabled ? 'Connecting to Claude Code…' : 'Ask Claude anything, or type / for commands'}
              className="max-h-60 flex-1 resize-none bg-transparent px-2 py-1.5 text-[15px] outline-none placeholder:text-muted"
            />
            {busy ? (
              <button
                onClick={onStop}
                title="Stop (interrupt)"
                className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-fg text-bg hover:opacity-80"
              >
                <Square className="size-3.5 fill-current" />
              </button>
            ) : (
              <button
                onClick={() => submit()}
                disabled={!text.trim() || disabled}
                title="Send (Enter)"
                className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-accent text-white hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowUp className="size-4" />
              </button>
            )}
          </div>
          <div className="mt-1.5 px-2 text-[11px] text-muted">
            Enter to send · Shift+Enter for new line · <span className="font-mono">/</span> for commands
            {busy && ' · messages you send now are queued'}
          </div>
        </div>
      </div>
    </div>
  )
}
