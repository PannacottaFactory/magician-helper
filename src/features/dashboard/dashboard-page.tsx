import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CalendarPlus,
  Check,
  Clock,
  Coins,
  Flame,
  Hourglass,
  ListOrdered,
  NotebookPen,
  PackageCheck,
  Sparkles,
  Timer,
} from 'lucide-react'
import { StockBadge, TrickStatusBadge } from '@/components/common/status-badge'
import { WriteButton } from '@/components/common/write-button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useUser } from '@/features/auth/auth-provider'
import { useGigs } from '@/features/gigs/api'
import { GigFormDialog } from '@/features/gigs/gig-form-dialog'
import { PaymentBadge } from '@/features/gigs/payment-badge'
import { useInventory } from '@/features/inventory/api'
import { ItemVisual } from '@/features/inventory/item-visual'
import { computeStreak, minutesLastDays, usePracticeLogs } from '@/features/practice/api'
import { PracticeFormDialog } from '@/features/practice/practice-form-dialog'
import { practiceTimer } from '@/features/practice/timer-store'
import { useProfile } from '@/features/profile/api'
import { useRoutines } from '@/features/routines/api'
import { useTricks } from '@/features/tricks/api'
import { useNow } from '@/hooks/use-now'
import { formatCurrency, formatDate, formatDayRelative, formatDuration, formatRelative, formatTime, parseDay, todayISO } from '@/lib/format'
import { cn } from '@/lib/utils'
import { PracticeWeekChart } from './practice-week-chart'

// Stable empty list: `data ?? []` would create a new array on every render
const NONE: never[] = []

function greeting(hour: number) {
  if (hour < 5) return 'Good night'
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function Kpi({ icon: Icon, label, value, hint, tone, to }: { icon: typeof Coins; label: string; value: ReactNode; hint?: ReactNode; tone: string; to: string }) {
  return (
    <Link to={to} className="group rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
      <Card className="h-full gap-2 p-4 transition-colors group-hover:border-gold/40">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className={cn('flex size-7 items-center justify-center rounded-md', tone)}>
            <Icon className="size-4" aria-hidden="true" />
          </span>
          {label}
        </div>
        <p className="truncate text-2xl font-semibold tabular-nums">{value}</p>
        {hint && <p className="truncate text-xs text-muted-foreground">{hint}</p>}
      </Card>
    </Link>
  )
}

function Panel({ title, icon: Icon, to, linkLabel, children }: { title: string; icon: typeof Coins; to: string; linkLabel: string; children: ReactNode }) {
  return (
    <Card className="gap-3 p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-semibold">
          <Icon className="size-4 text-gold" aria-hidden="true" /> {title}
        </h2>
        <Link to={to} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-gold focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
          {linkLabel} <ArrowRight className="size-3" aria-hidden="true" />
        </Link>
      </div>
      {children}
    </Card>
  )
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">{children}</p>
}

export function DashboardPage() {
  const user = useUser()
  const now = useNow()
  const { data: profile } = useProfile()
  const gigsQ = useGigs()
  const tricksQ = useTricks()
  const inventoryQ = useInventory()
  const practiceQ = usePracticeLogs()
  const routinesQ = useRoutines()
  const [logging, setLogging] = useState(false)
  const [booking, setBooking] = useState(false)

  const currency = profile?.currency ?? 'EUR'
  const gigs = gigsQ.data ?? NONE
  const tricks = tricksQ.data ?? NONE
  const inventory = inventoryQ.data ?? NONE
  const logs = practiceQ.data ?? NONE
  const routines = routinesQ.data ?? NONE
  const loading = gigsQ.isLoading || tricksQ.isLoading || inventoryQ.isLoading || practiceQ.isLoading

  const stats = useMemo(() => {
    const month = todayISO().slice(0, 7)
    const monthGigs = gigs.filter((g) => {
      const d = new Date(g.starts_at)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === month
    })
    // revenue per currency (most users have only one)
    const revenue = new Map<string, number>()
    monthGigs.forEach((g) => revenue.set(g.currency, (revenue.get(g.currency) ?? 0) + Number(g.fee ?? 0)))
    const pending = new Map<string, number>()
    gigs
      .filter((g) => g.payment_status !== 'fully_paid' && g.fee !== null)
      .forEach((g) => pending.set(g.currency, (pending.get(g.currency) ?? 0) + Number(g.fee) - Number(g.amount_received)))
    const upcoming = gigs.filter((g) => new Date(g.ends_at ?? g.starts_at).getTime() >= now)
    const staleDays = profile?.stale_trick_days ?? 14
    const staleLimit = parseDay(todayISO())
    staleLimit.setDate(staleLimit.getDate() - staleDays)
    const toRework = tricks
      .map((t) => {
        if (t.status === 'needs_polish') return { trick: t, reason: 'Needs polish' }
        if (t.status === 'to_learn') return null
        if (!t.last_practiced) return { trick: t, reason: 'Never practiced' }
        if (parseDay(t.last_practiced) < staleLimit) return { trick: t, reason: `Last practiced ${formatDayRelative(t.last_practiced)}` }
        return null
      })
      .filter((x) => x !== null)
    return {
      revenue,
      pending,
      upcoming,
      monthGigs,
      toRework,
      lowStock: inventory.filter((i) => i.stock_status !== 'in_stock'),
      week: minutesLastDays(logs),
      streak: computeStreak(logs.map((l) => l.practiced_on)),
      staleDays,
    }
  }, [gigs, tricks, inventory, logs, profile, now])

  const money = (map: Map<string, number>) => {
    const main = map.get(currency) ?? 0
    const others = [...map.entries()].filter(([c, v]) => c !== currency && v > 0)
    return {
      value: formatCurrency(main, currency),
      extra: others.length ? `+ ${others.map(([c, v]) => formatCurrency(v, c)).join(' + ')}` : undefined,
    }
  }
  const revenue = money(stats.revenue)
  const pending = money(stats.pending)
  const nextGig = stats.upcoming[0]
  const name = profile?.display_name || user.email?.split('@')[0]

  const steps = [
    { done: inventory.length > 0, label: 'Add your props', hint: 'Start from the classic props catalog', to: '/app/inventory', icon: BookOpen },
    { done: tricks.length > 0, label: 'Add your first trick', hint: 'Effect, secret, props, difficulty', to: '/app/tricks', icon: Sparkles },
    { done: routines.length > 0, label: 'Build a routine', hint: 'Order tricks into a setlist', to: '/app/routines', icon: ListOrdered },
    { done: gigs.length > 0, label: 'Book a gig', hint: 'Get your preparation checklist', to: '/app/gigs', icon: CalendarDays },
  ]
  const onboarding = !loading && steps.some((s) => !s.done)

  return (
    <>
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{formatDate(new Date(now), { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            {greeting(new Date(now).getHours())}
            {name ? `, ${name}` : ''}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <WriteButton variant="outline" onClick={() => practiceTimer.start()}>
            <Timer aria-hidden="true" /> Practice
          </WriteButton>
          <WriteButton variant="outline" onClick={() => setLogging(true)}>
            <NotebookPen aria-hidden="true" /> Log session
          </WriteButton>
          <WriteButton onClick={() => setBooking(true)}>
            <CalendarPlus aria-hidden="true" /> New gig
          </WriteButton>
        </div>
      </header>

      {onboarding && (
        <Card className="mb-6 gap-4 border-gold/30 bg-gradient-to-br from-accent/60 to-card p-5">
          <div>
            <h2 className="font-display text-xl font-semibold">Set the stage</h2>
            <p className="text-sm text-muted-foreground">
              Four steps to get the most out of Magician Helper — {steps.filter((s) => s.done).length} of 4 done.
            </p>
          </div>
          <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <li key={step.to}>
                <Link
                  to={step.to}
                  className={cn(
                    'flex h-full items-start gap-3 rounded-lg border bg-card p-3 transition-colors hover:border-gold/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                    step.done && 'opacity-60',
                  )}
                >
                  <span
                    className={cn(
                      'flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold',
                      step.done ? 'border-success bg-success text-white' : 'border-gold/50 text-gold',
                    )}
                  >
                    {step.done ? <Check className="size-4" aria-label="Done" /> : i + 1}
                  </span>
                  <span>
                    <span className={cn('block text-sm font-medium', step.done && 'line-through')}>{step.label}</span>
                    <span className="block text-xs text-muted-foreground">{step.hint}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </Card>
      )}

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true" aria-label="Loading">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi
              icon={Coins}
              label="Revenue this month"
              value={revenue.value}
              hint={revenue.extra ?? `${stats.monthGigs.length} gig${stats.monthGigs.length === 1 ? '' : 's'} in ${formatDate(new Date(now), { month: 'long' })}`}
              tone="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
              to="/app/gigs"
            />
            <Kpi
              icon={Hourglass}
              label="Pending payments"
              value={pending.value}
              hint={pending.extra ?? 'Balance not yet received'}
              tone="bg-amber-500/15 text-amber-700 dark:text-amber-300"
              to="/app/gigs"
            />
            <Kpi
              icon={Flame}
              label="Practice · last 7 days"
              value={formatDuration(stats.week)}
              hint={stats.streak ? `🔥 ${stats.streak}-day streak` : 'No streak yet — practice today!'}
              tone="bg-orange-500/15 text-orange-600 dark:text-orange-300"
              to="/app/practice"
            />
            <Kpi
              icon={CalendarDays}
              label="Next gig"
              value={nextGig ? formatRelative(nextGig.starts_at) : '—'}
              hint={nextGig ? nextGig.title : 'Nothing booked'}
              tone="bg-sky-500/15 text-sky-700 dark:text-sky-300"
              to={nextGig ? `/app/gigs/${nextGig.id}` : '/app/gigs'}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Upcoming gigs" icon={CalendarDays} to="/app/gigs" linkLabel="All gigs">
              {stats.upcoming.length ? (
                <ul className="space-y-2">
                  {stats.upcoming.slice(0, 5).map((g) => {
                    const packed = g.checklist_total > 0 && g.checklist_done === g.checklist_total
                    return (
                      <li key={g.id}>
                        <Link
                          to={`/app/gigs/${g.id}`}
                          className="flex items-center gap-3 rounded-lg border p-2.5 text-sm transition-colors hover:border-gold/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                        >
                          <span className="flex w-11 shrink-0 flex-col items-center rounded-md bg-accent/60 py-1">
                            <span className="text-[10px] font-semibold uppercase">{formatDate(g.starts_at, { month: 'short' })}</span>
                            <span className="font-display text-lg leading-none font-semibold text-gold">{new Date(g.starts_at).getDate()}</span>
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium">{g.title}</span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {formatTime(g.starts_at)}
                              {g.client_name ? ` · ${g.client_name}` : ''}
                            </span>
                          </span>
                          <span className="flex flex-col items-end gap-1">
                            <PaymentBadge status={g.payment_status} />
                            <span className="flex items-center gap-2 text-xs">
                              {g.has_stock_alert && (
                                <span className="inline-flex items-center gap-1 text-destructive">
                                  <AlertTriangle className="size-3" aria-hidden="true" /> Stock
                                </span>
                              )}
                              {g.checklist_total > 0 && (
                                <span className={cn('inline-flex items-center gap-1 tabular-nums', packed ? 'text-success' : 'text-muted-foreground')}>
                                  <PackageCheck className="size-3" aria-hidden="true" /> {g.checklist_done}/{g.checklist_total}
                                </span>
                              )}
                            </span>
                          </span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <Empty>No upcoming gigs. Time to book one!</Empty>
              )}
            </Panel>

            <Panel title="Practice" icon={Clock} to="/app/practice" linkLabel="Practice log">
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="text-muted-foreground">Minutes practiced, last 7 days</span>
                <span className="font-medium tabular-nums">{formatDuration(stats.week)}</span>
              </div>
              <PracticeWeekChart logs={logs} />
            </Panel>

            <Panel title="Tricks to rework" icon={Sparkles} to="/app/tricks" linkLabel="All tricks">
              {stats.toRework.length ? (
                <ul className="divide-y rounded-lg border">
                  {stats.toRework.slice(0, 6).map(({ trick, reason }) => (
                    <li key={trick.id}>
                      <Link
                        to={`/app/tricks/${trick.id}`}
                        className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">{trick.name}</span>
                          <span className="block truncate text-xs text-muted-foreground">{reason}</span>
                        </span>
                        <TrickStatusBadge status={trick.status} />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <Empty>
                  {tricks.length
                    ? `Everything practiced within the last ${stats.staleDays} days. Bravo!`
                    : 'Add tricks to get practice reminders here.'}
                </Empty>
              )}
            </Panel>

            <Panel title="Stock alerts" icon={AlertTriangle} to="/app/inventory" linkLabel="Inventory">
              {stats.lowStock.length ? (
                <ul className="divide-y rounded-lg border">
                  {stats.lowStock.slice(0, 6).map((item) => (
                    <li key={item.id}>
                      <Link
                        to={`/app/inventory/${item.id}`}
                        className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                      >
                        <ItemVisual catalogKey={item.catalog_key} className="h-7 w-9 shrink-0 overflow-hidden rounded" />
                        <span className="min-w-0 flex-1 truncate">{item.item_name}</span>
                        <span className="text-xs text-muted-foreground tabular-nums">{item.quantity} left</span>
                        <StockBadge status={item.stock_status} />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <Empty>{inventory.length ? 'All props are in stock.' : 'Add props to get stock alerts here.'}</Empty>
              )}
            </Panel>
          </div>
        </>
      )}

      <PracticeFormDialog open={logging} onOpenChange={setLogging} />
      <GigFormDialog open={booking} onOpenChange={setBooking} />
    </>
  )
}
