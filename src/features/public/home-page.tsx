import { Link } from 'react-router'
import { Wordmark } from '@/components/common/logo'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/auth-provider'

/** Temporary home page. The full landing page is built in phase 7. */
export function HomePage() {
  const { user } = useAuth()
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-56 left-1/2 size-[640px] -translate-x-1/2 rounded-full bg-gold/10 blur-3xl"
      />
      <header className="relative mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Wordmark />
        <nav className="flex items-center gap-2" aria-label="Account">
          {user ? (
            <Button asChild>
              <Link to="/app">Open the app</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost">
                <Link to="/login">Sign in</Link>
              </Button>
              <Button asChild>
                <Link to="/signup">Start free trial</Link>
              </Button>
            </>
          )}
        </nav>
      </header>
      <main className="relative mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <p className="mb-4 text-xs font-semibold tracking-[0.25em] text-gold uppercase">For working magicians</p>
        <h1 className="font-display text-5xl font-semibold tracking-tight sm:text-6xl">
          Your magic, <span className="text-gold">organized.</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
          Repertoire, routines, practice, gigs and props — all in one elegant place. Spend less time on admin and more
          time on the craft.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link to="/signup">Start your 14-day free trial</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/login">Sign in</Link>
          </Button>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">No credit card required.</p>
      </main>
      <footer className="relative mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-xs text-muted-foreground sm:px-6">
        <span>© {new Date().getFullYear()} Magician Helper</span>
        <span className="flex gap-4">
          <Link to="/privacy" className="hover:text-foreground">
            Privacy
          </Link>
          <Link to="/terms" className="hover:text-foreground">
            Terms
          </Link>
        </span>
      </footer>
    </div>
  )
}
