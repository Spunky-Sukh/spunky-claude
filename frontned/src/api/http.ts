import axios, { AxiosError } from 'axios'

/** Shared axios instance. Vite proxies /api to the FastAPI backend. */
export const http = axios.create({ baseURL: '/api', timeout: 60_000 })

/** Turn any axios/FastAPI error into a readable message. */
export function errorMessage(err: unknown): string {
  if (err instanceof AxiosError) {
    const detail = (err.response?.data as { detail?: unknown } | undefined)?.detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail)) return detail.map((d) => d.msg ?? String(d)).join(', ')
    if (!err.response) return 'Backend is not reachable. Is the FastAPI server running on port 8000?'
    return err.message
  }
  return err instanceof Error ? err.message : String(err)
}
