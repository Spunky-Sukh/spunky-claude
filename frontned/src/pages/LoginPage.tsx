import { CheckCircle2, ExternalLink, KeyRound, Sparkles, Terminal } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { Button, Card, ErrorBanner, Logo, Spinner } from '../components/common/ui'
import { ThemeToggle } from '../components/layout/ThemeToggle'
import { useLoginFlow } from '../hooks/useLoginFlow'
import { useAuthStore } from '../stores/authStore'

export function LoginPage() {
  const navigate = useNavigate()
  const status = useAuthStore((s) => s.status)
  const { flow, error, busy, start, submitCode, cancel, saveApiKey } = useLoginFlow(() => navigate('/'))
  const [code, setCode] = useState('')
  const [apiKey, setApiKey] = useState('')

  useEffect(() => {
    if (!useAuthStore.getState().status) void useAuthStore.getState().refresh()
  }, [])

  const inProgress = flow && (flow.state === 'starting' || flow.state === 'awaiting_user')

  return (
    <div className="flex min-h-full items-center justify-center p-6">
      <div className="absolute right-4 top-4 w-32">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-lg">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo className="size-14" />
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">Welcome to Spunky-Claude</h1>
          <p className="mt-1 text-sm text-muted">Claude Code, in your browser. Sign in to get started.</p>
        </div>

        {status?.logged_in && !flow && (
          <Card className="mb-4 flex items-center gap-3 p-4">
            <CheckCircle2 className="size-5 text-success" />
            <div className="flex-1 text-sm">
              Already signed in as <b>{status.active_method === 'api_key' ? `API key ${status.api_key_hint}` : status.email}</b>
            </div>
            <Button size="sm" variant="primary" onClick={() => navigate('/')}>
              Continue
            </Button>
          </Card>
        )}

        {error && (
          <div className="mb-4">
            <ErrorBanner message={error} />
          </div>
        )}

        {inProgress ? (
          <Card className="space-y-4 p-6">
            <div className="flex items-center gap-2 font-medium">
              <Spinner /> Waiting for you to sign in…
            </div>
            {flow.url ? (
              <>
                <p className="text-sm text-muted">
                  A browser tab should have opened. Finish signing in there — this page continues automatically. If
                  nothing opened, use the button below.
                </p>
                <a href={flow.url} target="_blank" rel="noreferrer">
                  <Button variant="primary" className="w-full">
                    <ExternalLink className="size-4" /> Open sign-in page
                  </Button>
                </a>
                <div>
                  <label className="text-xs text-muted">Got a code instead? Paste it here:</label>
                  <div className="mt-1 flex gap-2">
                    <input
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="Authentication code"
                      className="h-10 flex-1 rounded-lg border border-border bg-bg px-3 text-sm outline-none focus:border-accent"
                    />
                    <Button disabled={!code.trim()} onClick={() => submitCode(code)}>
                      Submit
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted">Starting Claude Code login…</p>
            )}
            <button onClick={cancel} className="cursor-pointer text-xs text-muted hover:text-fg">
              Cancel
            </button>
          </Card>
        ) : (
          <div className="space-y-3">
            {flow?.state === 'error' && (
              <ErrorBanner message={`Login failed.\n${flow.output.slice(-600)}`} />
            )}
            <LoginOption
              icon={<Sparkles className="size-5" />}
              title="Claude account"
              subtitle="Pro, Max, Team or Enterprise subscription"
              onClick={() => start('claudeai')}
              loading={busy}
            />
            <LoginOption
              icon={<Terminal className="size-5" />}
              title="Anthropic Console"
              subtitle="API usage billing through console.anthropic.com"
              onClick={() => start('console')}
              loading={busy}
            />

            <Card className="p-4">
              <div className="mb-3 flex items-center gap-3">
                <div className="rounded-lg bg-accent-soft p-2 text-accent">
                  <KeyRound className="size-5" />
                </div>
                <div>
                  <div className="font-medium">Use an API key</div>
                  <div className="text-xs text-muted">Stored locally in backend/data/settings.json</div>
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-ant-…"
                  className="h-10 flex-1 rounded-lg border border-border bg-bg px-3 text-sm outline-none focus:border-accent"
                />
                <Button disabled={apiKey.trim().length < 20} loading={busy} onClick={() => saveApiKey(apiKey)}>
                  Save
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

function LoginOption(props: { icon: ReactNode; title: string; subtitle: string; onClick: () => void; loading: boolean }) {
  return (
    <button
      onClick={props.onClick}
      disabled={props.loading}
      className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-border bg-surface p-4 text-left transition-colors hover:border-accent disabled:opacity-60"
    >
      <div className="rounded-lg bg-accent-soft p-2 text-accent">{props.icon}</div>
      <div className="flex-1">
        <div className="font-medium">Sign in with {props.title}</div>
        <div className="text-xs text-muted">{props.subtitle}</div>
      </div>
      <span className="text-muted">→</span>
    </button>
  )
}
