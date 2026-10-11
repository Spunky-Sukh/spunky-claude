// ---------- Auth ----------

export interface AuthStatus {
  logged_in: boolean
  active_method: 'claude.ai' | 'console' | 'api_key' | string | null
  cli_logged_in: boolean
  email: string | null
  organization: string | null
  subscription: string | null
  api_key_set: boolean
  api_key_hint: string | null
}

export type LoginMethod = 'claudeai' | 'console'

export interface LoginFlow {
  id: string
  method: LoginMethod
  state: 'starting' | 'awaiting_user' | 'success' | 'error' | 'cancelled'
  url: string | null
  output: string
}

// ---------- Projects / sessions / folders ----------

export interface Project {
  path: string
  session_count: number
  last_modified: number
}

export interface SessionInfo {
  session_id: string
  summary: string
  last_modified: number
  created_at: number | null
  custom_title: string | null
  first_prompt: string | null
  git_branch: string | null
  cwd: string | null
}

export interface FolderCheck {
  path: string
  exists: boolean
  is_dir: boolean
  name: string
}

export interface FolderListing {
  path: string
  parent: string | null
  folders: { name: string; path: string }[]
}

// ---------- Claude Code metadata ----------

export interface SlashCommand {
  name: string
  description: string
  argumentHint?: string
}

export interface ModelOption {
  value: string
  displayName: string
  description?: string
  resolvedModel?: string
}

export interface AgentInfo {
  name: string
  description: string
}

export interface Meta {
  commands: SlashCommand[]
  models: ModelOption[]
  agents: AgentInfo[]
  output_styles: string[]
  account: { email?: string; organization?: string; subscriptionType?: string } | null
  version: string | null
}

// ---------- Chat ----------

export type PermissionMode = 'default' | 'acceptEdits' | 'plan' | 'bypassPermissions'

export type Block =
  | { type: 'text'; text: string }
  | { type: 'thinking'; text: string }
  | { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> }
  | { type: 'tool_result'; tool_use_id: string; content: string; is_error: boolean }

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'tool' | 'system'
  blocks: Block[]
  parent_tool_use_id: string | null
}

export interface ToolResult {
  content: string
  is_error: boolean
}

export interface QuestionOption {
  label: string
  description?: string
}

export interface Question {
  question: string
  header?: string
  options: QuestionOption[]
  multiSelect?: boolean
}

export interface PermissionRequest {
  request_id: string
  tool_name: string
  tool_use_id: string | null
  input: Record<string, unknown>
  can_always_allow: boolean
}

export interface QuestionRequest {
  request_id: string
  questions: Question[]
}

export interface TurnResult {
  is_error: boolean
  result: string | null
  duration_ms: number
  total_cost_usd: number | null
}

export interface ContextUsage {
  total_tokens: number
  max_tokens: number
  percentage: number
}

/** Events the backend pushes over the chat WebSocket. */
export type ServerEvent =
  | {
      type: 'ready'
      session_id: string | null
      commands: SlashCommand[]
      models: ModelOption[]
      agents: AgentInfo[]
      version: string | null
      permission_mode: PermissionMode
    }
  | { type: 'session'; session_id: string; model: string | null }
  | { type: 'delta'; kind: 'text' | 'thinking'; text: string; parent_tool_use_id: string | null }
  | { type: 'message'; message: ChatMessage }
  | ({ type: 'permission_request' } & PermissionRequest)
  | ({ type: 'question' } & QuestionRequest)
  | { type: 'request_resolved'; request_id: string }
  | ({ type: 'result'; session_id: string } & TurnResult)
  | ({ type: 'context' } & ContextUsage)
  | { type: 'system'; subtype: string; data: Record<string, unknown> }
  | { type: 'status'; busy: boolean }
  | { type: 'error'; message: string }

/** Messages the UI sends over the chat WebSocket. */
export type ClientEvent =
  | { type: 'start'; cwd: string; session_id?: string | null; model?: string | null; permission_mode?: PermissionMode; chrome?: boolean }
  | { type: 'prompt'; text: string }
  | { type: 'permission'; request_id: string; decision: 'allow' | 'allow_always' | 'deny'; message?: string }
  | { type: 'answer'; request_id: string; answers: Record<string, string> }
  | { type: 'interrupt' }
  | { type: 'set_model'; model: string | null }
  | { type: 'set_permission_mode'; mode: PermissionMode }
