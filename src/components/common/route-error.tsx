import { useEffect } from 'react'
import { Link, isRouteErrorResponse, useRouteError } from 'react-router'
import { RefreshCw } from 'lucide-react'
import { Wordmark } from '@/components/common/logo'
import { Button } from '@/components/ui/button'

const RELOAD_FLAG = 'mh:chunk-reload'

function isStaleChunkError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  return /dynamically imported module|Importing a module script failed|Failed to fetch|error loading dynamically/i.test(message)
}

/**
 * Shown when a route crashes. After a new deployment, an open tab may request
 * code files that no longer exist: we reload once to get the new version.
 */
export function RouteError() {
  const error = useRouteError()
  const stale = isStaleChunkError(error)

  useEffect(() => {
    if (!stale) return
    try {
      if (!sessionStorage.getItem(RELOAD_FLAG)) {
        sessionStorage.setItem(RELOAD_FLAG, '1')
        window.location.reload()
      }
    } catch {
      // storage unavailable: show the message below
    }
  }, [stale])

  const notFound = isRouteErrorResponse(error) && error.status === 404

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 text-center" role="alert">
      <Wordmark />
      <div className="max-w-md">
        <h1 className="font-display text-3xl font-semibold">
          {stale ? 'A new version is available' : notFound ? 'Page not found' : 'Something went wrong'}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {stale
            ? 'Magician Helper was updated while this tab was open. Reload to continue.'
            : 'The trick didn’t go as planned. Reload the page — your data is safe.'}
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          onClick={() => {
            try {
              sessionStorage.removeItem(RELOAD_FLAG)
            } catch {
              // ignore
            }
            window.location.reload()
          }}
        >
          <RefreshCw aria-hidden="true" /> Reload
        </Button>
        <Button asChild variant="outline">
          <Link to="/app">Back to dashboard</Link>
        </Button>
      </div>
    </div>
  )
}
