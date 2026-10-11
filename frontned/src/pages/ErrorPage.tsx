import { isRouteErrorResponse, useRouteError } from 'react-router'
import { Button, ErrorBanner, Logo } from '../components/common/ui'

/** Shown instead of a blank screen when a page throws while rendering. */
export function ErrorPage() {
  const error = useRouteError()
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? `${error.message}\n\n${error.stack ?? ''}`
      : String(error)

  return (
    <div className="flex min-h-full items-center justify-center p-6">
      <div className="w-full max-w-2xl space-y-4">
        <div className="flex items-center gap-3">
          <Logo className="size-10" />
          <h1 className="text-xl font-semibold">Something broke in Spunky-Claude</h1>
        </div>
        <ErrorBanner message={message} />
        <div className="flex gap-2">
          <Button variant="primary" onClick={() => location.reload()}>
            Reload
          </Button>
          <Button onClick={() => location.assign('/')}>Go home</Button>
        </div>
      </div>
    </div>
  )
}
