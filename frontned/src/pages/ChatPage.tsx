import { useEffect, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router'
import { ChatHeader } from '../components/chat/ChatHeader'
import { Composer } from '../components/chat/Composer'
import { MessageList } from '../components/chat/MessageList'
import { useChatSession, type ChatTarget } from '../hooks/useChatSession'
import { useCommandRunner } from '../hooks/useCommandRunner'
import { useChatStore } from '../stores/chatStore'

export function ChatPage() {
  const [params] = useSearchParams()
  const cwd = params.get('cwd')
  if (!cwd) return <Navigate to="/" replace />
  return <Chat cwd={cwd} urlSessionId={params.get('session')} />
}

function Chat({ cwd, urlSessionId }: { cwd: string; urlSessionId: string | null }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [target, setTarget] = useState<ChatTarget>({ cwd, sessionId: urlSessionId, nonce: 0 })
  const [seenLocation, setSeenLocation] = useState(location.key)
  const [toast, setToast] = useState<string | null>(null)
  const modelSelectRef = useRef<HTMLSelectElement>(null)

  // Reconnect only when the user navigates somewhere new — not when we just
  // write the freshly created session id into the URL ourselves (keepAlive).
  if (location.key !== seenLocation) {
    setSeenLocation(location.key)
    const state = location.state as { keepAlive?: boolean; fresh?: number } | null
    const changed = target.cwd !== cwd || target.sessionId !== urlSessionId || state?.fresh
    if (!state?.keepAlive && changed) setTarget({ cwd, sessionId: urlSessionId, nonce: target.nonce + 1 })
  }

  const actions = useChatSession(target)
  const sessionId = useChatStore((s) => s.sessionId)
  const connection = useChatStore((s) => s.connection)

  // New sessions get their id after the first prompt — put it in the URL so refresh works.
  useEffect(() => {
    if (sessionId && sessionId !== urlSessionId) {
      navigate(`/chat?cwd=${encodeURIComponent(cwd)}&session=${sessionId}`, { replace: true, state: { keepAlive: true } })
    }
  }, [sessionId, urlSessionId, cwd, navigate])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2500)
    return () => clearTimeout(t)
  }, [toast])

  const run = useCommandRunner({
    actions,
    onNotice: setToast,
    onOpenModelPicker: () => {
      const el = modelSelectRef.current
      el?.focus()
      el?.showPicker?.()
    },
    onNewSession: () => navigate(`/chat?cwd=${encodeURIComponent(cwd)}`, { state: { fresh: Date.now() } }),
  })

  return (
    <div className="flex h-full flex-col">
      <ChatHeader modelSelectRef={modelSelectRef} onModelChange={actions.changeModel} onModeChange={actions.changePermissionMode} />
      <MessageList actions={actions} />
      <Composer onSubmit={run} onStop={actions.interrupt} disabled={connection !== 'ready'} />
      {toast && (
        <div className="fixed bottom-28 left-1/2 z-50 -translate-x-1/2 rounded-full bg-fg px-4 py-2 text-sm text-bg shadow-lg">
          {toast}
        </div>
      )}
    </div>
  )
}
