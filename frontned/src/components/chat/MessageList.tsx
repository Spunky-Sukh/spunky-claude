import { useEffect, useRef } from 'react'
import { useChatStore } from '../../stores/chatStore'
import { Markdown } from '../common/Markdown'
import { ErrorBanner, Logo, Spinner } from '../common/ui'
import type { ChatActions } from '../../hooks/useChatSession'
import { MessageView, Thinking } from './MessageView'
import { PermissionCard } from './PermissionCard'
import { QuestionCard } from './QuestionCard'

export function MessageList({ actions }: { actions: ChatActions }) {
  const { messages, streaming, permissions, questions, busy, notice, error, connection, setError } = useChatStore()
  const scroller = useRef<HTMLDivElement>(null)
  const stick = useRef(true)

  // Keep pinned to the bottom unless the user scrolled up to read.
  useEffect(() => {
    const el = scroller.current
    if (el && stick.current) el.scrollTop = el.scrollHeight
  })

  const empty = messages.length === 0 && !streaming && !busy

  return (
    <div
      ref={scroller}
      onScroll={(e) => {
        const el = e.currentTarget
        stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
      }}
      className="flex-1 overflow-y-auto"
    >
      <div className="mx-auto max-w-3xl space-y-5 px-4 py-6">
        {empty && (
          <div className="flex flex-col items-center py-20 text-center text-muted">
            <Logo className="size-12 opacity-80" />
            <p className="mt-4 text-lg font-medium text-fg">
              {connection === 'connecting' ? 'Starting Claude Code…' : 'What should we build?'}
            </p>
            <p className="mt-1 text-sm">Type a message, use a shortcut below, or press / for commands.</p>
          </div>
        )}

        {messages.map((m) => (
          <MessageView key={m.id} message={m} />
        ))}

        {streaming?.thinking && !streaming.text && <Thinking text={streaming.thinking} live />}
        {streaming?.text && <Markdown text={streaming.text} className="cursor-blink" />}

        {permissions.map((p) => (
          <PermissionCard key={p.request_id} req={p} onRespond={(d, msg) => actions.respondPermission(p.request_id, d, msg)} />
        ))}
        {questions.map((q) => (
          <QuestionCard key={q.request_id} req={q} onAnswer={(a) => actions.answerQuestion(q.request_id, a)} />
        ))}

        {busy && !streaming?.text && permissions.length === 0 && questions.length === 0 && (
          <div className="flex items-center gap-2 text-sm text-muted">
            <Spinner /> {notice ? `${notice[0].toUpperCase()}${notice.slice(1)}…` : 'Working…'}
          </div>
        )}

        {error && <ErrorBanner message={error} onClose={() => setError(null)} />}
      </div>
    </div>
  )
}
