import { useMemo, useState } from 'react'
import { Link, Outlet } from 'react-router'
import { AlertTriangle, CalendarDays, List, MapPin, PackageCheck, Plus } from 'lucide-react'
import { EmptyState } from '@/components/common/empty-state'
import { ResultCount, SearchInput, Toolbar } from '@/components/common/list-toolbar'
import { WriteButton } from '@/components/common/write-button'
import { PageHeader } from '@/components/layout/page-header'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { ListSkeleton } from '@/features/inventory/inventory-page'
import { useProfile } from '@/features/profile/api'
import { useLocalState } from '@/hooks/use-local-state'
import { useNow } from '@/hooks/use-now'
import { useWithoutPending } from '@/hooks/use-undoable-delete'
import { PAYMENT_STATUSES } from '@/lib/constants'
import { formatCurrency, formatDate, formatTime, pluralize } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useGigs, type GigRow } from './api'
import { GigCalendar } from './gig-calendar'
import { GigFormDialog, type GigDefaults } from './gig-form-dialog'
import { PaymentBadge } from './payment-badge'

type View = 'list' | 'calendar'
type When = 'upcoming' | 'past'

export function GigsPage() {
  const { data, isLoading } = useGigs()
  const gigs = useWithoutPending(data)
  const { data: profile } = useProfile()
  const [view, setView] = useLocalState<View>('gigs-view', 'list')
  const [when, setWhen] = useState<When>('upcoming')
  const [search, setSearch] = useState('')
  const [payment, setPayment] = useState('all')
  const [creating, setCreating] = useState<GigDefaults | null>(null)
  const now = useNow()

  const upcoming = gigs.filter((g) => new Date(g.ends_at ?? g.starts_at).getTime() >= now)
  const pendingAmount = gigs
    .filter((g) => g.payment_status !== 'fully_paid' && g.fee !== null)
    .reduce((s, g) => s + Number(g.fee) - Number(g.amount_received), 0)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return gigs.filter(
      (g) =>
        (payment === 'all' || g.payment_status === payment) &&
        (!q ||
          g.title.toLowerCase().includes(q) ||
          g.client_name?.toLowerCase().includes(q) ||
          g.location?.toLowerCase().includes(q) ||
          g.event_type?.toLowerCase().includes(q)),
    )
  }, [gigs, search, payment])

  const listed = useMemo(() => {
    const isUpcoming = (g: GigRow) => new Date(g.ends_at ?? g.starts_at).getTime() >= now
    const rows = filtered.filter((g) => (when === 'upcoming' ? isUpcoming(g) : !isUpcoming(g)))
    return when === 'upcoming' ? rows : [...rows].reverse()
  }, [filtered, when, now])

  // group by month
  const groups = useMemo(() => {
    const map = new Map<string, GigRow[]>()
    listed.forEach((g) => {
      const key = formatDate(g.starts_at, { month: 'long', year: 'numeric' })
      map.set(key, [...(map.get(key) ?? []), g])
    })
    return [...map.entries()]
  }, [listed])

  return (
    <>
      <PageHeader
        title="Gigs"
        description={
          gigs.length
            ? `${pluralize(upcoming.length, 'upcoming gig')} · ${formatCurrency(pendingAmount, profile?.currency)} still to be paid`
            : 'Your shows, calendar and payments.'
        }
        actions={
          <WriteButton onClick={() => setCreating({})}>
            <Plus aria-hidden="true" /> New gig
          </WriteButton>
        }
      />

      {isLoading ? (
        <ListSkeleton />
      ) : gigs.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No gigs booked yet"
          description="Plan your performances, track fees and deposits, and get an automatic checklist of the props to pack."
          action={
            <WriteButton onClick={() => setCreating({})}>
              <Plus aria-hidden="true" /> Book your first gig
            </WriteButton>
          }
        />
      ) : (
        <>
          <Toolbar>
            <ToggleGroup type="single" variant="outline" value={view} onValueChange={(v) => v && setView(v as View)} aria-label="View">
              <ToggleGroupItem value="list" aria-label="List view" className="px-3">
                <List aria-hidden="true" /> <span className="hidden sm:inline">List</span>
              </ToggleGroupItem>
              <ToggleGroupItem value="calendar" aria-label="Calendar view" className="px-3">
                <CalendarDays aria-hidden="true" /> <span className="hidden sm:inline">Calendar</span>
              </ToggleGroupItem>
            </ToggleGroup>
            {view === 'list' && (
              <>
                <ToggleGroup type="single" variant="outline" value={when} onValueChange={(v) => v && setWhen(v as When)} aria-label="Period">
                  <ToggleGroupItem value="upcoming" className="px-3">
                    Upcoming
                  </ToggleGroupItem>
                  <ToggleGroupItem value="past" className="px-3">
                    Past
                  </ToggleGroupItem>
                </ToggleGroup>
                <SearchInput value={search} onChange={setSearch} placeholder="Search gigs…" className="sm:w-64" />
                <Select value={payment} onValueChange={setPayment}>
                  <SelectTrigger className="sm:w-44" aria-label="Filter by payment status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All payments</SelectItem>
                    {PAYMENT_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
          </Toolbar>

          {view === 'calendar' ? (
            <GigCalendar gigs={gigs} onCreate={(date) => setCreating({ date })} />
          ) : (
            <>
              <ResultCount shown={filtered.length} total={gigs.length} noun="gigs" />
              {groups.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  {when === 'upcoming' ? 'No upcoming gigs match.' : 'No past gigs match.'}
                </p>
              ) : (
                <div className="space-y-6">
                  {groups.map(([month, monthGigs]) => (
                    <section key={month} aria-label={month}>
                      <h2 className="mb-2 text-sm font-semibold text-muted-foreground">{month}</h2>
                      <ul className="space-y-2">
                        {monthGigs.map((g) => (
                          <GigListItem key={g.id} gig={g} past={when === 'past'} />
                        ))}
                      </ul>
                    </section>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      <GigFormDialog open={creating !== null} onOpenChange={(o) => !o && setCreating(null)} defaults={creating ?? undefined} />
      <Outlet />
    </>
  )
}

function GigListItem({ gig, past }: { gig: GigRow; past: boolean }) {
  const date = new Date(gig.starts_at)
  const packed = gig.checklist_total > 0 && gig.checklist_done === gig.checklist_total
  return (
    <li>
      <Link
        to={gig.id}
        className="group flex items-center gap-4 rounded-xl border bg-card p-3 transition-colors hover:border-gold/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <span
          className={cn(
            'flex w-14 shrink-0 flex-col items-center rounded-lg border py-1.5',
            past ? 'text-muted-foreground' : 'border-gold/40 bg-accent/50',
          )}
        >
          <span className="text-[10px] font-semibold tracking-wider uppercase">{formatDate(date, { month: 'short' })}</span>
          <span className={cn('font-display text-2xl leading-none font-semibold', !past && 'text-gold')}>{date.getDate()}</span>
          <span className="text-[10px] text-muted-foreground">{formatDate(date, { weekday: 'short' })}</span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium group-hover:text-gold">{gig.title}</span>
          <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            <span className="tabular-nums">
              {formatTime(gig.starts_at)}
              {gig.ends_at && `–${formatTime(gig.ends_at)}`}
            </span>
            {gig.client_name && <span>{gig.client_name}</span>}
            {gig.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3" aria-hidden="true" />
                <span className="max-w-40 truncate">{gig.location}</span>
              </span>
            )}
          </span>
        </span>
        <span className="hidden flex-col items-end gap-1 sm:flex">
          <span className="text-sm font-medium tabular-nums">
            {gig.fee !== null ? formatCurrency(Number(gig.fee), gig.currency) : ''}
          </span>
          <PaymentBadge status={gig.payment_status} />
        </span>
        <span className="flex flex-col items-end gap-1 text-xs">
          {gig.has_stock_alert && !past && (
            <span className="inline-flex items-center gap-1 text-danger" title="Some props are missing">
              <AlertTriangle className="size-3.5" aria-hidden="true" />
              <span className="sr-only sm:not-sr-only">Stock</span>
            </span>
          )}
          {gig.checklist_total > 0 && !past && (
            <span className={cn('inline-flex items-center gap-1 tabular-nums', packed ? 'text-success' : 'text-muted-foreground')}>
              <PackageCheck className="size-3.5" aria-hidden="true" /> {gig.checklist_done}/{gig.checklist_total}
              <span className="sr-only"> items packed</span>
            </span>
          )}
        </span>
      </Link>
    </li>
  )
}
