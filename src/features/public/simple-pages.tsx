import { Link } from 'react-router'
import { Wordmark } from '@/components/common/logo'
import { Button } from '@/components/ui/button'
import { useDocumentTitle } from '@/hooks/use-document-title'

export function NotFoundPage() {
  useDocumentTitle('Page not found')
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 text-center">
      <Wordmark />
      <div>
        <p className="font-display text-6xl font-semibold text-gold">404</p>
        <h1 className="mt-2 text-xl font-semibold">This page vanished.</h1>
        <p className="mt-1 text-sm text-muted-foreground">Even we can't make it reappear.</p>
      </div>
      <Button asChild>
        <Link to="/">Back to home</Link>
      </Button>
    </div>
  )
}

