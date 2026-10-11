import type { AuthStatus, LoginFlow, LoginMethod } from '../types'
import { http } from './http'

export const authApi = {
  status: () => http.get<AuthStatus>('/auth/status').then((r) => r.data),

  startLogin: (method: LoginMethod) => http.post<LoginFlow>('/auth/login', { method }).then((r) => r.data),
  loginProgress: (id: string) => http.get<LoginFlow>(`/auth/login/${id}`).then((r) => r.data),
  submitCode: (id: string, code: string) => http.post<LoginFlow>(`/auth/login/${id}/code`, { code }).then((r) => r.data),
  cancelLogin: (id: string) => http.delete(`/auth/login/${id}`),

  saveApiKey: (apiKey: string) => http.post<AuthStatus>('/auth/api-key', { api_key: apiKey }).then((r) => r.data),
  removeApiKey: () => http.delete<AuthStatus>('/auth/api-key').then((r) => r.data),

  logout: () => http.post<AuthStatus>('/auth/logout').then((r) => r.data),
}
