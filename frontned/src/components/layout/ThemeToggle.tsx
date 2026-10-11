import { Monitor, Moon, Sun } from 'lucide-react'
import { useThemeStore, type ThemeChoice } from '../../stores/themeStore'

const OPTIONS: { value: ThemeChoice; icon: typeof Sun; label: string }[] = [
  { value: 'light', icon: Sun, label: 'Light' },
  { value: 'dark', icon: Moon, label: 'Dark' },
  { value: 'system', icon: Monitor, label: 'System' },
]

export function ThemeToggle() {
  const { theme, setTheme } = useThemeStore()
  return (
    <div className="flex rounded-lg border border-border bg-surface-2 p-0.5">
      {OPTIONS.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          title={label}
          onClick={() => setTheme(value)}
          className={`flex flex-1 cursor-pointer items-center justify-center rounded-md py-1.5 transition-colors ${
            theme === value ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg'
          }`}
        >
          <Icon className="size-4" />
        </button>
      ))}
    </div>
  )
}
