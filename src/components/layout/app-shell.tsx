import { useEffect, useRef } from 'react'
import { Link, Outlet, useLocation } from 'react-router'
import { Logo } from '@/components/common/logo'
import { PracticeTimerWidget } from '@/features/practice/practice-timer-widget'
import { CommandPalette } from '@/features/search/command-palette'
import { setSearchOpen } from '@/features/search/search-store'
import { Search } from 'lucide-react'
import { useProfile } from '@/features/profile/api'
import { useTheme, type Theme } from '@/hooks/use-theme'
import { BottomTabs } from './bottom-tabs'
import { ReadOnlyBanner } from './read-only-banner'
import { Sidebar } from './sidebar'

/** Applies the theme saved in the user's profile once, when it first loads. */
function useProfileTheme() {
  const { data: profile } = useProfile()
  const { setTheme } = useTheme()
  const applied = useRef(false)
  useEffect(() => {
    if (profile && !applied.current) {
      applied.current = true
      setTheme(profile.theme as Theme)
    }
  }, [profile, setTheme])
}

export function AppShell() {
  useProfileTheme()
  const { pathname } = useLocation()
  // "/app/tricks/123" → "/app/tricks": opening a detail panel is not a page change
  const section = pathname.split('/').slice(0, 3).join('/')

  // Move focus to the main region on navigation (keyboard & screen reader users)
  const mainRef = useRef<HTMLElement>(null)
  useEffect(() => {
    mainRef.current?.focus({ preventScroll: true })
    window.scrollTo({ top: 0 })
  }, [section])

  return (
    <div className="min-h-dvh">
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <Sidebar />

      {/* Mobile top bar */}
      <header className="sticky top-0 z-20 flex h-14 items-center border-b bg-background/90 px-4 backdrop-blur md:hidden">
        <Link to="/app" className="flex items-center gap-2" aria-label="Magician Helper home">
          <Logo className="size-7" />
          <span className="font-display text-lg font-semibold">
            Magician <span className="text-gold">Helper</span>
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="ml-auto rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          aria-label="Search"
        >
          <Search className="size-5" aria-hidden="true" />
        </button>
      </header>

      <main
        id="main"
        ref={mainRef}
        tabIndex={-1}
        className="pb-24 outline-none md:pb-0 md:pl-16 lg:pl-60"
      >
        <div key={section} className="mx-auto w-full max-w-7xl px-4 py-6 animate-in fade-in-0 duration-300 sm:px-6 lg:px-8 lg:py-8">
          <ReadOnlyBanner />
          <Outlet />
        </div>
      </main>
      <BottomTabs />
      <PracticeTimerWidget />
      <CommandPalette />
    </div>
  )
}
