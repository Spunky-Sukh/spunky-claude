import { create } from 'zustand'
import type {
  AgentInfo,
  ChatMessage,
  ContextUsage,
  ModelOption,
  PermissionMode,
  PermissionRequest,
  QuestionRequest,
  ServerEvent,
  SlashCommand,
  ToolResult,
  TurnResult,
} from '../types'

export type Connection = 'idle' | 'connecting' | 'ready' | 'closed'

interface ChatState {
  connection: Connection
  cwd: string | null
  sessionId: string | null
  busy: boolean
  /** Top-level conversation (user / assistant / system). */
  messages: ChatMessage[]
  /** tool_use id → its result, so tool cards can show output inline. */
  toolResults: Record<string, ToolResult>
  /** Agent/Task tool_use id → messages produced by that sub-agent. */
  subagentMessages: Record<string, ChatMessage[]>
  streaming: { text: string; thinking: string } | null
  permissions: PermissionRequest[]
  questions: QuestionRequest[]

  commands: SlashCommand[]
  models: ModelOption[]
  agents: AgentInfo[]
  version: string | null
  model: string | null
  activeModel: string | null
  permissionMode: PermissionMode

  context: ContextUsage | null
  totalCost: number
  lastTurn: TurnResult | null
  notice: string | null
  error: string | null

  reset: (cwd: string, sessionId: string | null, model: string | null, mode: PermissionMode) => void
  setHistory: (messages: ChatMessage[]) => void
  addUserMessage: (text: string) => void
  setConnection: (connection: Connection) => void
  setModel: (model: string | null) => void
  setPermissionMode: (mode: PermissionMode) => void
  setError: (error: string | null) => void
  handleEvent: (event: ServerEvent) => void
}

const emptyConversation = {
  messages: [],
  toolResults: {},
  subagentMessages: {},
  streaming: null,
  permissions: [],
  questions: [],
  context: null,
  totalCost: 0,
  lastTurn: null,
  notice: null,
  error: null,
  busy: false,
}

/** Split history/live messages into conversation, tool results and sub-agent threads. */
function ingest(state: Pick<ChatState, 'messages' | 'toolResults' | 'subagentMessages'>, msg: ChatMessage) {
  if (msg.role === 'tool') {
    const toolResults = { ...state.toolResults }
    for (const b of msg.blocks) {
      if (b.type === 'tool_result') toolResults[b.tool_use_id] = { content: b.content, is_error: b.is_error }
    }
    return { toolResults }
  }
  if (msg.parent_tool_use_id) {
    const parent = msg.parent_tool_use_id
    return {
      subagentMessages: { ...state.subagentMessages, [parent]: [...(state.subagentMessages[parent] ?? []), msg] },
    }
  }
  return { messages: [...state.messages, msg] }
}

export const useChatStore = create<ChatState>((set, get) => ({
  connection: 'idle',
  cwd: null,
  sessionId: null,
  commands: [],
  models: [],
  agents: [],
  version: null,
  model: null,
  activeModel: null,
  permissionMode: 'default',
  ...emptyConversation,

  reset: (cwd, sessionId, model, mode) =>
    set({ ...emptyConversation, cwd, sessionId, model, permissionMode: mode, activeModel: null, connection: 'idle' }),

  setHistory: (history) => {
    let acc: Pick<ChatState, 'messages' | 'toolResults' | 'subagentMessages'> = {
      messages: [],
      toolResults: {},
      subagentMessages: {},
    }
    for (const m of history) acc = { ...acc, ...ingest(acc, m) }
    // History loads asynchronously — keep anything that arrived live in the meantime.
    set((s) => ({
      messages: [...acc.messages, ...s.messages],
      toolResults: { ...acc.toolResults, ...s.toolResults },
      subagentMessages: { ...acc.subagentMessages, ...s.subagentMessages },
    }))
  },

  addUserMessage: (text) =>
    set((s) => ({
      error: null,
      messages: [
        ...s.messages,
        { id: crypto.randomUUID(), role: 'user', blocks: [{ type: 'text', text }], parent_tool_use_id: null },
      ],
    })),

  setConnection: (connection) => set({ connection }),
  setModel: (model) => set({ model }),
  setPermissionMode: (permissionMode) => set({ permissionMode }),
  setError: (error) => set({ error }),

  handleEvent: (ev) => {
    switch (ev.type) {
      case 'ready':
        set({
          connection: 'ready',
          commands: ev.commands,
          models: ev.models,
          agents: ev.agents,
          version: ev.version,
          permissionMode: ev.permission_mode ?? get().permissionMode,
        })
        break
      case 'session':
        set({ sessionId: ev.session_id, activeModel: ev.model })
        break
      case 'delta': {
        if (ev.parent_tool_use_id) break
        const cur = get().streaming ?? { text: '', thinking: '' }
        set({
          streaming: ev.kind === 'text' ? { ...cur, text: cur.text + ev.text } : { ...cur, thinking: cur.thinking + ev.text },
        })
        break
      }
      case 'message': {
        const s = get()
        const patch = ingest(s, ev.message)
        const clearStream = ev.message.role === 'assistant' && !ev.message.parent_tool_use_id
        set({ ...patch, ...(clearStream ? { streaming: null } : {}) })
        break
      }
      case 'permission_request': {
        const { type: _t, ...req } = ev
        set((s) => ({ permissions: [...s.permissions, req] }))
        break
      }
      case 'question':
        set((s) => ({ questions: [...s.questions, { request_id: ev.request_id, questions: ev.questions }] }))
        break
      case 'request_resolved':
        set((s) => ({
          permissions: s.permissions.filter((p) => p.request_id !== ev.request_id),
          questions: s.questions.filter((q) => q.request_id !== ev.request_id),
        }))
        break
      case 'result':
        set((s) => ({
          sessionId: ev.session_id ?? s.sessionId,
          streaming: null,
          notice: null,
          lastTurn: { is_error: ev.is_error, result: ev.result, duration_ms: ev.duration_ms, total_cost_usd: ev.total_cost_usd },
          totalCost: s.totalCost + (ev.total_cost_usd ?? 0),
          error: ev.is_error ? ev.result || 'Claude reported an error for this turn.' : s.error,
        }))
        break
      case 'context':
        set({ context: { total_tokens: ev.total_tokens, max_tokens: ev.max_tokens, percentage: ev.percentage } })
        break
      case 'system':
        if (ev.subtype === 'commands_changed' && Array.isArray(ev.data.commands)) {
          set({ commands: ev.data.commands as SlashCommand[] })
        } else if (ev.subtype === 'status') {
          set({ notice: (ev.data.status as string | null) ?? null })
        } else if (ev.subtype === 'compact_boundary') {
          set((s) => ({
            messages: [
              ...s.messages,
              {
                id: crypto.randomUUID(),
                role: 'system',
                blocks: [{ type: 'text', text: 'Conversation compacted' }],
                parent_tool_use_id: null,
              },
            ],
          }))
        }
        break
      case 'status':
        set({ busy: ev.busy, ...(ev.busy ? {} : { streaming: null, notice: null }) })
        break
      case 'error':
        set({ error: ev.message })
        break
    }
  },
}))
