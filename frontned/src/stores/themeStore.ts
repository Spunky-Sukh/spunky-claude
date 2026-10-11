import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeChoice = 'light' | 'dark' | 'system'

interface ThemeState {
  theme: ThemeChoice
  setTheme: (theme: ThemeChoice) => void
  toggle: () => void
}

const prefersDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches

export function isDark(theme: ThemeChoice): boolean {
  return theme === 'dark' || (theme === 'system' && prefersDark())
}

export function applyTheme(theme: ThemeChoice): void {
  document.documentElement.classList.toggle('dark', isDark(theme))
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      setTheme: (theme) => {
        applyTheme(theme)
        set({ theme })
      },
      toggle: () => get().setTheme(isDark(get().theme) ? 'light' : 'dark'),
    }),
    {
      name: 'spunky-theme',
      onRehydrateStorage: () => (state) => applyTheme(state?.theme ?? 'system'),
    },
  ),
)

// Follow the OS when the user picked "system".
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  applyTheme(useThemeStore.getState().theme)
})
