import { Link, NavLink } from 'react-router'
import { Search } from 'lucide-react'
import { setSearchOpen, shortcutLabel } from '@/features/search/search-store'
import { Logo } from '@/components/common/logo'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { mainNav, type NavItem } from './nav-items'
import { TrialBadge } from './trial-badge'
import { UserMenu } from './user-menu'

function SidebarLink({ item }: { item: NavItem }) {
  const Icon = item.icon
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <NavLink
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            cn(
              'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              'text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground',
              'focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none',
              'md:justify-center lg:justify-start',
              isActive && 'bg-sidebar-accent text-sidebar-foreground',
            )
          }
        >
          {({ isActive }) => (
            <>
              <span
                className={cn(
                  'absolute top-1.5 bottom-1.5 left-0 w-0.5 rounded-full bg-gold transition-opacity',
                  isActive ? 'opacity-100' : 'opacity-0',
                )}
                aria-hidden="true"
              />
              <Icon
                className={cn('size-[18px] shrink-0', isActive ? 'text-gold' : 'text-muted-foreground')}
                aria-hidden="true"
              />
              <span className="md:sr-only lg:not-sr-only">{item.label}</span>
            </>
          )}
        </NavLink>
      </TooltipTrigger>
      {/* Tooltip only useful when the sidebar is collapsed to icons (md) */}
      <TooltipContent side="right" className="lg:hidden">
        {item.label}
      </TooltipContent>
    </Tooltip>
  )
}

/** Desktop navigation: icon rail on medium screens, full sidebar on large screens. */
export function Sidebar() {
  return (
    <aside
      className="fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex md:w-16 lg:w-60"
      aria-label="Main navigation"
    >
      <Link
        to="/app"
        className="flex h-16 items-center gap-2 px-4 md:justify-center lg:justify-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Logo className="size-7" />
        <span className="hidden font-display text-xl font-semibold tracking-wide lg:inline">
          Magician <span className="text-gold">Helper</span>
        </span>
      </Link>
      <div className="px-2 pb-2 lg:px-3">
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          aria-label={`Search (${shortcutLabel})`}
          title={`Search (${shortcutLabel})`}
          className="flex w-full items-center gap-2 rounded-lg border border-sidebar-border bg-sidebar-accent/40 px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-gold/40 hover:text-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none md:justify-center lg:justify-start"
        >
          <Search className="size-4 shrink-0" aria-hidden="true" />
          <span className="hidden flex-1 text-left lg:inline">Search…</span>
          <kbd className="hidden rounded border border-sidebar-border px-1.5 text-[10px] lg:inline">{shortcutLabel}</kbd>
        </button>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-2 lg:px-3">
        {mainNav.map((item) => (
          <SidebarLink key={item.to} item={item} />
        ))}
      </nav>
      <div className="space-y-2 border-t border-sidebar-border p-2 lg:p-3">
        <div className="hidden lg:block">
          <TrialBadge />
        </div>
        <div className="lg:hidden">
          <TrialBadge compact />
        </div>
        <div className="hidden lg:block">
          <UserMenu />
        </div>
        <div className="lg:hidden">
          <UserMenu compact />
        </div>
      </div>
    </aside>
  )
}
