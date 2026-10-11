import { FolderOpen, Home, PanelLeftClose, Settings, SquareSlash } from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router'
import { sessionsApi } from '../../api/sessionsApi'
import { folderName } from '../../lib/format'
import { useAuthStore } from '../../stores/authStore'
import type { Project } from '../../types'
import { Logo } from '../common/ui'
import { ThemeToggle } from './ThemeToggle'

const NAV = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/commands', label: 'Commands', icon: SquareSlash },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar({ onCollapse }: { onCollapse: () => void }) {
  const [projects, setProjects] = useState<Project[]>([])
  const status = useAuthStore((s) => s.status)
  const location = useLocation()

  // Refresh recent folders whenever the user navigates (new sessions show up).
  useEffect(() => {
    sessionsApi.recentProjects().then(setProjects).catch(() => setProjects([]))
  }, [location.pathname])

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-border bg-surface">
      <div className="flex items-center gap-2.5 px-4 py-4">
        <Logo className="size-7" />
        <span className="font-semibold tracking-tight">Spunky-Claude</span>
        <button onClick={onCollapse} title="Hide sidebar" className="ml-auto cursor-pointer text-muted hover:text-fg">
          <PanelLeftClose className="size-4" />
        </button>
      </div>

      <nav className="space-y-0.5 px-2">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive ? 'bg-accent-soft text-accent font-medium' : 'text-muted hover:bg-surface-2 hover:text-fg'
              }`
            }
          >
            <Icon className="size-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-6 px-4 text-xs font-medium uppercase tracking-wider text-muted">Recent folders</div>
      <div className="mt-2 flex-1 space-y-0.5 overflow-y-auto px-2">
        {projects.length === 0 && <p className="px-3 py-2 text-xs text-muted">No sessions yet</p>}
        {projects.map((p) => (
          <NavLink
            key={p.path}
            to={`/?path=${encodeURIComponent(p.path)}`}
            title={p.path}
            className="flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm text-muted hover:bg-surface-2 hover:text-fg"
          >
            <FolderOpen className="size-4 shrink-0" />
            <span className="truncate">{folderName(p.path)}</span>
            <span className="ml-auto text-xs opacity-60">{p.session_count}</span>
          </NavLink>
        ))}
      </div>

      <div className="space-y-3 border-t border-border p-3">
        <ThemeToggle />
        {status && (
          <div className="truncate px-1 text-xs text-muted" title={status.email ?? ''}>
            {status.active_method === 'api_key' ? `API key ${status.api_key_hint}` : status.email}
            {status.subscription && status.active_method !== 'api_key' && (
              <span className="ml-1 rounded bg-accent-soft px-1.5 py-0.5 text-[10px] uppercase text-accent">
                {status.subscription}
              </span>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}
