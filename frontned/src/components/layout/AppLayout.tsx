import { PanelLeftOpen } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router'
import { useAuthStore } from '../../stores/authStore'
import { ErrorBanner, Logo, Spinner } from '../common/ui'
import { Sidebar } from './Sidebar'

/** Shell for every signed-in page. Sends the user to /login if Claude Code isn't authenticated. */
export function AppLayout() {
  const { status, error, refresh } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    if (!useAuthStore.getState().status) void refresh()
  }, [refresh])

  if (!status) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6">
        <Logo className="size-12" />
        {error ? (
          <div className="max-w-md">
            <ErrorBanner message={error} />
            <button onClick={() => refresh()} className="mt-3 w-full cursor-pointer text-sm text-accent">
              Retry
            </button>
          </div>
        ) : (
          <Spinner className="size-6" />
        )}
      </div>
    )
  }

  if (!status.logged_in) return <Navigate to="/login" replace />

  return (
    <div className="flex h-full">
      {sidebarOpen && <Sidebar onCollapse={() => setSidebarOpen(false)} />}
      <main className="relative flex min-w-0 flex-1 flex-col">
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            title="Show sidebar"
            className="absolute left-3 top-3.5 z-10 cursor-pointer rounded-md p-1 text-muted hover:bg-surface-2 hover:text-fg"
          >
            <PanelLeftOpen className="size-4" />
          </button>
        )}
        <Outlet />
      </main>
    </div>
  )
}
