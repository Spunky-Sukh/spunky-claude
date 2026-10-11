import { useCallback, useEffect, useState } from 'react'
import { errorMessage } from '../api/http'
import { sessionsApi } from '../api/sessionsApi'
import { systemApi } from '../api/systemApi'
import type { FolderCheck, SessionInfo } from '../types'

/** Validates a folder and loads its existing Claude Code sessions. */
export function useFolderSessions(path: string | null) {
  const [folder, setFolder] = useState<FolderCheck | null>(null)
  const [sessions, setSessions] = useState<SessionInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!path) {
      setFolder(null)
      setSessions([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const check = await systemApi.checkFolder(path)
      setFolder(check)
      if (!check.is_dir) {
        setSessions([])
        setError(check.exists ? `${check.path} is a file, not a folder.` : `Folder not found: ${check.path}`)
      } else {
        setSessions(await sessionsApi.list(check.path))
      }
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [path])

  useEffect(() => {
    void load()
  }, [load])

  return {
    folder,
    sessions,
    loading,
    error,
    reload: load,
    rename: async (id: string, title: string) => {
      await sessionsApi.rename(id, title, folder?.path)
      await load()
    },
    remove: async (id: string) => {
      await sessionsApi.remove(id, folder?.path)
      setSessions((s) => s.filter((x) => x.session_id !== id))
    },
  }
}
