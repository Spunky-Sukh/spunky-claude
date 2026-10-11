import { useEffect } from 'react'
import { create } from 'zustand'
import { errorMessage } from '../api/http'
import { systemApi } from '../api/systemApi'
import type { Meta } from '../types'

interface MetaState {
  meta: Meta | null
  loading: boolean
  error: string | null
  load: () => Promise<void>
}

const useMetaStore = create<MetaState>((set, get) => ({
  meta: null,
  loading: false,
  error: null,
  load: async () => {
    if (get().meta || get().loading) return
    set({ loading: true, error: null })
    try {
      set({ meta: await systemApi.meta(), loading: false })
    } catch (err) {
      set({ error: errorMessage(err), loading: false })
    }
  },
}))

/** Claude Code's commands / models / agents, loaded once per app run. */
export function useMeta() {
  const state = useMetaStore()
  useEffect(() => {
    void useMetaStore.getState().load()
  }, [])
  return state
}
