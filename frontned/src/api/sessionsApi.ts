import type { ChatMessage, Project, SessionInfo } from '../types'
import { http } from './http'

export const sessionsApi = {
  recentProjects: () => http.get<Project[]>('/projects').then((r) => r.data),

  list: (cwd: string) => http.get<SessionInfo[]>('/sessions', { params: { cwd } }).then((r) => r.data),

  messages: (sessionId: string, cwd?: string) =>
    http.get<ChatMessage[]>(`/sessions/${sessionId}/messages`, { params: { cwd } }).then((r) => r.data),

  rename: (sessionId: string, title: string, cwd?: string) => http.patch(`/sessions/${sessionId}`, { title, cwd }),

  remove: (sessionId: string, cwd?: string) => http.delete(`/sessions/${sessionId}`, { params: { cwd } }),
}
