import { useEffect, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router'
import { Wordmark } from '@/components/common/logo'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/auth-provider'
import { GUIDES_PATH, guidePath } from './guides/guides-meta'
import { ORGANIZER_PATH } from './seo'

// Landing sections: a plain link so it also works from the guide and legal pages
const home = (hash: string) => `${import.meta.env.BASE_URL}#${hash}`

export function PublicHeader() {
  const { user } = useAuth()
  return (
    <header className="sticky top-0 z-30 border-b border-transparent bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link to="/" className="rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none" aria-label="Magician Helper home">
          <Wordmark />
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <a href={home('features')} className="hover:text-foreground">Features</a>
          <a href={home('pricing')} className="hover:text-foreground">Pricing</a>
          <Link to={GUIDES_PATH} className="hover:text-foreground">Guides</Link>
          <a href={home('faq')} className="hover:text-foreground">FAQ</a>
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <Button asChild>
              <Link to="/app">Open the app</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" className="hidden sm:inline-flex">
                <Link to="/login">Sign in</Link>
              </Button>
              <Button asChild>
                <Link to="/signup">Start free trial</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export function PublicFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div className="space-y-2">
          <Wordmark />
          <p className="max-w-xs text-sm text-muted-foreground">The magic helper app for working magicians: trick organizer, routines, practice log, gigs, clients, props, quotes and invoices.</p>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-10 gap-y-2 text-sm text-muted-foreground">
          <Link to="/signup" className="hover:text-foreground">Start free trial</Link>
          <Link to="/privacy" className="hover:text-foreground">Privacy Policy</Link>
          <Link to="/login" className="hover:text-foreground">Sign in</Link>
          <Link to="/terms" className="hover:text-foreground">Terms of Service</Link>
          <Link to={GUIDES_PATH} className="hover:text-foreground">Guides for magicians</Link>
          <Link to="/terms#legal-notice" className="hover:text-foreground">Legal notice</Link>
          <Link to={ORGANIZER_PATH} className="hover:text-foreground">Magic trick organizer</Link>
          <Link to={guidePath('magic-trick-list-template')} className="hover:text-foreground">Trick list template</Link>
          <Link to={guidePath('apps-for-magicians')} className="hover:text-foreground">Apps for magicians</Link>
        </nav>
      </div>
      <p className="pb-8 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} Magician Helper. All rights reserved.</p>
    </footer>
  )
}

export function PublicLayout({ children }: { children: ReactNode }) {
  const { pathname, hash } = useLocation()
  // client-side navigation between public pages starts at the top
  useEffect(() => {
    if (!hash) window.scrollTo({ top: 0 })
  }, [pathname, hash])
  return (
    <div className="grain flex min-h-dvh flex-col">
      <a
        href="#content"
        className="sr-only z-50 rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <PublicHeader />
      <main id="content" className="flex-1">
        {children}
      </main>
      <PublicFooter />
    </div>
  )
}
