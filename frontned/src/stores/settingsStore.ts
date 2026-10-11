import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_SHORTCUTS, type Shortcut } from '../data/shortcuts'
import type { PermissionMode } from '../types'

interface SettingsState {
  defaultModel: string | null
  defaultPermissionMode: PermissionMode
  chromeEnabled: boolean
  showThinking: boolean
  shortcuts: Shortcut[]

  update: (patch: Partial<Omit<SettingsState, 'update' | 'addShortcut' | 'removeShortcut' | 'resetShortcuts'>>) => void
  addShortcut: (shortcut: Omit<Shortcut, 'id'>) => void
  removeShortcut: (id: string) => void
  resetShortcuts: () => void
}

/** User preferences, persisted in the browser. */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      defaultModel: null,
      defaultPermissionMode: 'default',
      chromeEnabled: false,
      showThinking: true,
      shortcuts: DEFAULT_SHORTCUTS,

      update: (patch) => set(patch),
      addShortcut: (s) => set((st) => ({ shortcuts: [...st.shortcuts, { ...s, id: crypto.randomUUID() }] })),
      removeShortcut: (id) => set((st) => ({ shortcuts: st.shortcuts.filter((s) => s.id !== id) })),
      resetShortcuts: () => set({ shortcuts: DEFAULT_SHORTCUTS }),
    }),
    { name: 'spunky-settings' },
  ),
)
