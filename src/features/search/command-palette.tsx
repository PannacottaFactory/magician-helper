import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { Command as CommandPrimitive } from 'cmdk'
import {
  CalendarDays,
  Lightbulb,
  ListOrdered,
  Loader2,
  Package,
  Search,
  Sparkles,
  Timer,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { accountNav, mainNav } from '@/components/layout/nav-items'
import { practiceTimer } from '@/features/practice/timer-store'
import { useAccess } from '@/features/profile/api'
import { ROUTINE_STATUSES, STOCK_STATUSES, TRICK_STATUSES, labelOf } from '@/lib/constants'
import { unwrap } from '@/lib/db'
import { formatDay } from '@/lib/format'
import { supabase } from '@/lib/supabase'
import { setSearchOpen, useSearchOpen } from './search-store'

type Kind = 'trick' | 'routine' | 'gig' | 'client' | 'inventory' | 'idea' | 'practice'

const KINDS: Record<Kind, { label: string; icon: LucideIcon; route: (id: string) => string; tone: string }> = {
  trick: { label: 'Tricks', icon: Sparkles, route: (id) => `/app/tricks/${id}`, tone: 'text-gold' },
  routine: { label: 'Routines', icon: ListOrdered, route: (id) => `/app/routines/${id}`, tone: 'text-violet-500' },
  gig: { label: 'Gigs', icon: CalendarDays, route: (id) => `/app/gigs/${id}`, tone: 'text-sky-500' },
  client: { label: 'Clients', icon: Users, route: (id) => `/app/clients/${id}`, tone: 'text-rose-500' },
  inventory: { label: 'Inventory', icon: Package, route: (id) => `/app/inventory/${id}`, tone: 'text-emerald-500' },
  idea: { label: 'Ideas', icon: Lightbulb, route: (id) => `/app/ideas/${id}`, tone: 'text-amber-500' },
  practice: { label: 'Practice sessions', icon: Timer, route: () => '/app/practice', tone: 'text-orange-500' },
}

function subtitleFor(kind: Kind, subtitle: string | null) {
  if (!subtitle) return ''
  switch (kind) {
    case 'trick':
      return labelOf(TRICK_STATUSES, subtitle)
    case 'routine':
      return labelOf(ROUTINE_STATUSES, subtitle)
    case 'inventory':
      return labelOf(STOCK_STATUSES, subtitle)
    case 'gig':
    case 'practice':
      return formatDay(subtitle)
    default:
      return subtitle
  }
}

function useDebounced<T>(value: T, delay = 200) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(id)
  }, [value, delay])
  return debounced
}

/** Global search (Cmd/Ctrl+K) across every object, plus quick navigation. */
export function CommandPalette() {
  const open = useSearchOpen()
  const navigate = useNavigate()
  const { canWrite } = useAccess()
  const [query, setQuery] = useState('')
  const q = useDebounced(query.trim())

  // Keyboard shortcut
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen(!open)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  const { data: results = [], isFetching } = useQuery({
    queryKey: ['search', q],
    enabled: open && q.length >= 2,
    staleTime: 10_000,
    queryFn: () => unwrap(supabase.rpc('search_all', { q, per_kind: 6 })),
  })

  function go(path: string) {
    setSearchOpen(false)
    setQuery('')
    navigate(path)
  }

  const grouped = (Object.keys(KINDS) as Kind[])
    .map((kind) => ({ kind, items: results.filter((r) => r.kind === kind) }))
    .filter((g) => g.items.length)

  const pages = [...mainNav, ...accountNav]
  const filteredPages = pages.filter((p) => !query || p.label.toLowerCase().includes(query.trim().toLowerCase()))

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setSearchOpen(o)
        if (!o) setQuery('')
      }}
    >
      <DialogContent className="top-[15%] translate-y-0 overflow-hidden p-0 sm:max-w-xl" showCloseButton={false}>
        <DialogTitle className="sr-only">Search</DialogTitle>
        <DialogDescription className="sr-only">Search tricks, routines, gigs, clients, props, ideas and practice sessions.</DialogDescription>
        <Command shouldFilter={false} className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground">
          <div className="flex items-center gap-2 border-b px-3">
            {isFetching ? (
              <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" aria-hidden="true" />
            ) : (
              <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            )}
            {/* cmdk input keeps keyboard navigation of the list */}
            <CommandPrimitiveInput value={query} onValueChange={setQuery} />
            <kbd className="hidden rounded border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground sm:inline">Esc</kbd>
          </div>
          <CommandList className="max-h-[60dvh]">
            {q.length >= 2 && !isFetching && grouped.length === 0 && <CommandEmpty>No results for “{q}”.</CommandEmpty>}

            {grouped.map(({ kind, items }) => {
              const meta = KINDS[kind]
              const Icon = meta.icon
              return (
                <CommandGroup key={kind} heading={meta.label}>
                  {items.map((r) => (
                    <CommandItem key={`${kind}-${r.id}`} value={`${kind}-${r.id}`} onSelect={() => go(meta.route(r.id))}>
                      <Icon className={`size-4 ${meta.tone}`} aria-hidden="true" />
                      <span className="flex-1 truncate">{r.title}</span>
                      <span className="text-xs text-muted-foreground">{subtitleFor(kind, r.subtitle)}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )
            })}

            {grouped.length > 0 && filteredPages.length > 0 && <CommandSeparator />}

            {q.length < 2 && canWrite && (
              <CommandGroup heading="Actions">
                <CommandItem
                  value="action-timer"
                  onSelect={() => {
                    practiceTimer.start()
                    setSearchOpen(false)
                  }}
                >
                  <Timer className="size-4 text-orange-500" aria-hidden="true" />
                  Start a practice timer
                </CommandItem>
              </CommandGroup>
            )}

            {filteredPages.length > 0 && (
              <CommandGroup heading="Go to">
                {filteredPages.map((p) => {
                  const Icon = p.icon
                  return (
                    <CommandItem key={p.to} value={`page-${p.to}`} onSelect={() => go(p.to)}>
                      <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
                      {p.label}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            )}

            {q.length < 2 && (
              <p className="px-4 py-3 text-xs text-muted-foreground">
                Type at least 2 letters to search everything: tricks, routines, gigs, clients, props, ideas…
              </p>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}

// cmdk's Input styled for the palette (shadcn CommandInput adds its own icon and wrapper)
function CommandPrimitiveInput({ value, onValueChange }: { value: string; onValueChange: (v: string) => void }) {
  return (
    <CommandPrimitive.Input
      value={value}
      onValueChange={onValueChange}
      placeholder="Search everything…"
      aria-label="Search everything"
      className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
    />
  )
}

