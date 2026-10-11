import type { FolderCheck, FolderListing, Meta } from '../types'
import { http } from './http'

export const systemApi = {
  checkFolder: (path: string) => http.post<FolderCheck>('/fs/check', { path }).then((r) => r.data),

  listFolders: (path?: string) => http.get<FolderListing>('/fs/list', { params: { path } }).then((r) => r.data),

  /** Slash commands, models, agents… (boots Claude Code briefly, cached server-side). */
  meta: (cwd?: string) => http.get<Meta>('/meta', { params: { cwd }, timeout: 120_000 }).then((r) => r.data),
}
