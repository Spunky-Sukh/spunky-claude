import { BookOpen, Bug, Files, FileText, GitCommit, Search, Sparkles, Zap } from 'lucide-react'
import type { Shortcut } from '../../data/shortcuts'
import { useSettingsStore } from '../../stores/settingsStore'

const ICONS: Record<Shortcut['icon'], typeof Zap> = {
  sparkles: Sparkles,
  'file-text': FileText,
  files: Files,
  book: BookOpen,
  git: GitCommit,
  search: Search,
  bug: Bug,
  zap: Zap,
}

/** One-click prompts for the things you do all the time (editable in Settings). */
export function ShortcutBar({ onRun, disabled }: { onRun: (prompt: string) => void; disabled?: boolean }) {
  const shortcuts = useSettingsStore((s) => s.shortcuts)
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {shortcuts.map((s) => {
        const Icon = ICONS[s.icon] ?? Zap
        return (
          <button
            key={s.id}
            disabled={disabled}
            title={s.prompt}
            onClick={() => onRun(s.prompt)}
            className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Icon className="size-3.5" />
            {s.label}
          </button>
        )
      })}
    </div>
  )
}
