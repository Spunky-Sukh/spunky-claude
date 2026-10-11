import { create } from 'zustand'
import { authApi } from '../api/authApi'
import { errorMessage } from '../api/http'
import type { AuthStatus } from '../types'

interface AuthState {
  status: AuthStatus | null
  loading: boolean
  error: string | null
  refresh: () => Promise<AuthStatus | null>
  setStatus: (status: AuthStatus) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  status: null,
  loading: false,
  error: null,

  refresh: async () => {
    set({ loading: true, error: null })
    try {
      const status = await authApi.status()
      set({ status, loading: false })
      return status
    } catch (err) {
      set({ loading: false, error: errorMessage(err) })
      return null
    }
  },

  setStatus: (status) => set({ status }),
}))
