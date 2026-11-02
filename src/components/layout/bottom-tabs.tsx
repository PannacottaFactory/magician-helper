import { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router'
import { LogOut, MoreHorizontal } from 'lucide-react'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { mobileMore, mobileTabs } from './nav-items'
import { TrialBadge } from './trial-badge'

const tabClass =
  'flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring'

/** Mobile navigation: 4 main tabs + a "More" sheet. Hidden from md and up. */
export function BottomTabs() {
  const [moreOpen, setMoreOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const moreActive = mobileMore.some((item) => location.pathname.startsWith(item.to))

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-sidebar-border bg-sidebar/95 pb-safe backdrop-blur md:hidden"
        aria-label="Main navigation"
      >
        <div className="flex">
          {mobileTabs.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(tabClass, isActive ? 'text-gold' : 'text-muted-foreground hover:text-foreground')
                }
              >
                <Icon className="size-5" aria-hidden="true" />
                {item.label}
              </NavLink>
            )
          })}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={cn(tabClass, moreActive ? 'text-gold' : 'text-muted-foreground hover:text-foreground')}
            aria-haspopup="dialog"
            aria-expanded={moreOpen}
          >
            <MoreHorizontal className="size-5" aria-hidden="true" />
            More
          </button>
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl pb-safe">
          <SheetHeader>
            <SheetTitle>More</SheetTitle>
            <SheetDescription className="sr-only">Other sections of the app</SheetDescription>
          </SheetHeader>
          <div className="grid grid-cols-3 gap-2 px-4">
            {mobileMore.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMoreOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex flex-col items-center gap-2 rounded-xl border p-4 text-xs font-medium transition-colors',
                      'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                      isActive ? 'border-gold/50 bg-accent text-accent-foreground' : 'hover:bg-muted',
                    )
                  }
                >
                  <Icon className="size-5 text-gold" aria-hidden="true" />
                  {item.label}
                </NavLink>
              )
            })}
          </div>
          <div className="space-y-2 p-4">
            <TrialBadge />
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-lg border p-3 text-sm text-muted-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              onClick={async () => {
                setMoreOpen(false)
                await supabase.auth.signOut()
                navigate('/login', { replace: true })
              }}
            >
              <LogOut className="size-4" aria-hidden="true" /> Sign out
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
