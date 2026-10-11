import { Loader2 } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-white hover:bg-accent-hover',
  secondary: 'bg-surface border border-border text-fg hover:bg-surface-2',
  ghost: 'text-muted hover:text-fg hover:bg-surface-2',
  danger: 'bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20',
}

export function Button({
  variant = 'secondary',
  size = 'md',
  loading,
  className = '',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md'; loading?: boolean }) {
  const sizing = size === 'sm' ? 'h-8 px-3 text-xs gap-1.5' : 'h-10 px-4 text-sm gap-2'
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={`inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${sizing} ${variants[variant]} ${className}`}
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-border bg-surface ${className}`}>{children}</div>
}

export function Spinner({ className = 'size-4' }: { className?: string }) {
  return <Loader2 className={`animate-spin text-muted ${className}`} />
}

export function ErrorBanner({ message, onClose }: { message: string; onClose?: () => void }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
      <pre className="flex-1 whitespace-pre-wrap font-sans">{message}</pre>
      {onClose && (
        <button onClick={onClose} className="cursor-pointer opacity-70 hover:opacity-100">
          ✕
        </button>
      )}
    </div>
  )
}

export function Logo({ className = 'size-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="8" fill="var(--accent)" />
      <path fill="#fff" d="M16 5l2.6 7.4L26 15l-7.4 2.6L16 25l-2.6-7.4L6 15l7.4-2.6z" />
    </svg>
  )
}
