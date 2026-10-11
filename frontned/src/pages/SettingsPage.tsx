import { Globe, KeyRound, LogOut, Plus, RotateCcw, Trash2, User } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { authApi } from '../api/authApi'
import { errorMessage } from '../api/http'
import { Button, Card, ErrorBanner } from '../components/common/ui'
import { ThemeToggle } from '../components/layout/ThemeToggle'
import { PERMISSION_MODES } from '../data/uiCommands'
import { useMeta } from '../hooks/useMeta'
import { useAuthStore } from '../stores/authStore'
import { useSettingsStore } from '../stores/settingsStore'
import type { PermissionMode } from '../types'

export function SettingsPage() {
  const settings = useSettingsStore()
  const { meta } = useMeta()
  const { status, setStatus } = useAuthStore()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [newLabel, setNewLabel] = useState('')
  const [newPrompt, setNewPrompt] = useState('')

  const act = async (fn: () => Promise<void>) => {
    setError(null)
    try {
      await fn()
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-3xl space-y-6 px-6 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        {error && <ErrorBanner message={error} onClose={() => setError(null)} />}

        <Section title="Appearance">
          <Row label="Theme">
            <div className="w-40">
              <ThemeToggle />
            </div>
          </Row>
          <Row label="Show Claude's thinking" hint="Collapsible thought process in chat">
            <Toggle checked={settings.showThinking} onChange={(v) => settings.update({ showThinking: v })} />
          </Row>
        </Section>

        <Section title="New sessions">
          <Row label="Default model">
            <select
              value={settings.defaultModel ?? 'default'}
              onChange={(e) => settings.update({ defaultModel: e.target.value === 'default' ? null : e.target.value })}
              className="h-9 rounded-lg border border-border bg-bg px-2 text-sm"
            >
              {(meta?.models ?? [{ value: 'default', displayName: 'Default' }]).map((m) => (
                <option key={m.value} value={m.value}>
                  {m.displayName}
                </option>
              ))}
            </select>
          </Row>
          <Row label="Default permission mode">
            <select
              value={settings.defaultPermissionMode}
              onChange={(e) => settings.update({ defaultPermissionMode: e.target.value as PermissionMode })}
              className="h-9 rounded-lg border border-border bg-bg px-2 text-sm"
            >
              {PERMISSION_MODES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label} — {m.description}
                </option>
              ))}
            </select>
          </Row>
          <Row
            label={
              <span className="flex items-center gap-2">
                <Globe className="size-4 text-accent" /> Claude in Chrome
              </span>
            }
            hint="Lets Claude browse and interact with websites through the official Claude in Chrome extension (must be installed and connected)."
          >
            <Toggle checked={settings.chromeEnabled} onChange={(v) => settings.update({ chromeEnabled: v })} />
          </Row>
        </Section>

        <Section title="Shortcut buttons">
          <div className="space-y-2">
            {settings.shortcuts.map((s) => (
              <div key={s.id} className="flex items-start gap-3 rounded-lg border border-border bg-bg p-3">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{s.label}</div>
                  <div className="line-clamp-2 text-xs text-muted">{s.prompt}</div>
                </div>
                <button onClick={() => settings.removeShortcut(s.id)} className="cursor-pointer text-muted hover:text-danger">
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-3 space-y-2 rounded-lg border border-dashed border-border p-3">
            <input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Button label, e.g. Write tests"
              className="h-9 w-full rounded-lg border border-border bg-bg px-3 text-sm outline-none focus:border-accent"
            />
            <textarea
              value={newPrompt}
              onChange={(e) => setNewPrompt(e.target.value)}
              placeholder="Prompt sent to Claude (or a /command)"
              rows={2}
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
            />
            <div className="flex justify-between">
              <Button size="sm" variant="ghost" onClick={settings.resetShortcuts}>
                <RotateCcw className="size-3.5" /> Reset to defaults
              </Button>
              <Button
                size="sm"
                variant="primary"
                disabled={!newLabel.trim() || !newPrompt.trim()}
                onClick={() => {
                  settings.addShortcut({ label: newLabel.trim(), prompt: newPrompt.trim(), icon: 'zap' })
                  setNewLabel('')
                  setNewPrompt('')
                }}
              >
                <Plus className="size-3.5" /> Add shortcut
              </Button>
            </div>
          </div>
        </Section>

        <Section title="Account">
          {status && (
            <div className="space-y-3">
              <Row label={<span className="flex items-center gap-2"><User className="size-4" /> Claude login</span>}>
                <span className="text-sm text-muted">
                  {status.cli_logged_in ? `${status.email} (${status.subscription ?? status.active_method})` : 'Not signed in'}
                </span>
              </Row>
              <Row
                label={<span className="flex items-center gap-2"><KeyRound className="size-4" /> API key</span>}
                hint="When set, Spunky-Claude uses the key instead of your Claude login."
              >
                {status.api_key_set ? (
                  <Button size="sm" variant="danger" onClick={() => act(async () => setStatus(await authApi.removeApiKey()))}>
                    Remove {status.api_key_hint}
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => navigate('/login')}>
                    Add key
                  </Button>
                )}
              </Row>
              <div className="flex gap-2 pt-2">
                <Button size="sm" onClick={() => navigate('/login')}>
                  Switch account
                </Button>
                {status.cli_logged_in && (
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() =>
                      confirm('Log out of Claude Code? This also logs out the CLI on this computer.') &&
                      act(async () => {
                        setStatus(await authApi.logout())
                        navigate('/login')
                      })
                    }
                  >
                    <LogOut className="size-3.5" /> Log out
                  </Button>
                )}
              </div>
            </div>
          )}
          {meta?.version && <p className="mt-4 text-xs text-muted">Claude Code v{meta.version}</p>}
        </Section>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="p-5">
      <h2 className="mb-4 font-semibold">{title}</h2>
      <div className="space-y-4">{children}</div>
    </Card>
  )
}

function Row({ label, hint, children }: { label: ReactNode; hint?: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex-1">
        <div className="text-sm font-medium">{label}</div>
        {hint && <div className="text-xs text-muted">{hint}</div>}
      </div>
      {children}
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${checked ? 'bg-accent' : 'bg-border'}`}
    >
      <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${checked ? 'left-5.5' : 'left-0.5'}`} />
    </button>
  )
}
