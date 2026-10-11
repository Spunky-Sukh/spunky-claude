import { useEffect, useRef } from 'react'
import { ChatSocket } from '../api/chatSocket'
import { errorMessage } from '../api/http'
import { sessionsApi } from '../api/sessionsApi'
import { useChatStore } from '../stores/chatStore'
import { useSettingsStore } from '../stores/settingsStore'
import type { PermissionMode } from '../types'

export interface ChatTarget {
  cwd: string
  sessionId: string | null
  /** Bump to force a reconnect to the same target. */
  nonce: number
}

/** Owns the WebSocket for one chat target and exposes the actions the UI can take. */
export function useChatSession(target: ChatTarget) {
  const socketRef = useRef<ChatSocket | null>(null)
  const { cwd, sessionId, nonce } = target

  useEffect(() => {
    const store = useChatStore.getState()
    const settings = useSettingsStore.getState()
    let cancelled = false

    store.reset(cwd, sessionId, settings.defaultModel, settings.defaultPermissionMode)
    store.setConnection('connecting')

    if (sessionId) {
      sessionsApi
        .messages(sessionId, cwd)
        .then((history) => !cancelled && useChatStore.getState().setHistory(history))
        .catch((err) => !cancelled && useChatStore.getState().setError(errorMessage(err)))
    }

    const socket = new ChatSocket({
      onOpen: () =>
        socket.send({
          type: 'start',
          cwd,
          session_id: sessionId,
          model: settings.defaultModel,
          permission_mode: settings.defaultPermissionMode,
          chrome: settings.chromeEnabled,
        }),
      onEvent: (event) => useChatStore.getState().handleEvent(event),
      onClose: (reason) => {
        const s = useChatStore.getState()
        s.setConnection('closed')
        s.setError(`Disconnected from backend: ${reason}`)
      },
    })
    socket.connect()
    socketRef.current = socket

    return () => {
      cancelled = true
      socket.close()
      socketRef.current = null
    }
  }, [cwd, sessionId, nonce])

  const send = (...args: Parameters<ChatSocket['send']>) => socketRef.current?.send(...args)

  return {
    sendPrompt: (text: string) => {
      useChatStore.getState().addUserMessage(text)
      send({ type: 'prompt', text })
    },
    respondPermission: (requestId: string, decision: 'allow' | 'allow_always' | 'deny', message?: string) =>
      send({ type: 'permission', request_id: requestId, decision, message }),
    answerQuestion: (requestId: string, answers: Record<string, string>) =>
      send({ type: 'answer', request_id: requestId, answers }),
    interrupt: () => send({ type: 'interrupt' }),
    changeModel: (model: string | null) => {
      useChatStore.getState().setModel(model)
      send({ type: 'set_model', model })
    },
    changePermissionMode: (mode: PermissionMode) => {
      useChatStore.getState().setPermissionMode(mode)
      send({ type: 'set_permission_mode', mode })
    },
  }
}

export type ChatActions = ReturnType<typeof useChatSession>
