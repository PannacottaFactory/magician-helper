import { Link } from 'react-router'
import { Wordmark } from '@/components/common/logo'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
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

/** Placeholder until phase 7 adds the Privacy Policy and Terms templates. */
export function LegalPlaceholderPage({ title }: { title: string }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 px-4 py-12">
      <Link to="/" className="self-start">
        <Wordmark />
      </Link>
      <h1 className="font-display text-4xl font-semibold">{title}</h1>
      <p className="text-muted-foreground">This page is being written and will be published soon.</p>
    </div>
  )
}
