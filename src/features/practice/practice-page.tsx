import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { CalendarCheck, Clock, Flame, ListOrdered, Plus, Sparkles, Star, Timer } from 'lucide-react'
import { EmptyState } from '@/components/common/empty-state'
import { ResultCount, SearchInput, Toolbar } from '@/components/common/list-toolbar'
import { StarRating } from '@/components/common/star-rating'
import { WriteButton } from '@/components/common/write-button'
import { PageHeader } from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ListSkeleton } from '@/features/inventory/inventory-page'
import { useWithoutPending } from '@/hooks/use-undoable-delete'
import { PRACTICE_STATUSES, findOption } from '@/lib/constants'
import { formatDay, formatDuration, parseDay, todayISO } from '@/lib/format'
import { cn } from '@/lib/utils'
import { computeStreak, minutesLastDays, usePracticeLogs, type PracticeLog } from './api'
import { PracticeFormDialog } from './practice-form-dialog'
import { practiceTimer, usePracticeTimer } from './timer-store'

function StatCard({ icon: Icon, label, value, hint, tone }: { icon: typeof Flame; label: string; value: string; hint?: string; tone: string }) {
  return (
    <Card className="flex-row items-center gap-3 p-4">
      <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-lg', tone)}>
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-semibold tabular-nums">{value}</p>
        {hint && <p className="truncate text-xs text-muted-foreground">{hint}</p>}
      </div>
    </Card>
  )
}

export function PracticePage() {
  const { data, isLoading } = usePracticeLogs()
  const logs = useWithoutPending(data)
  const timer = usePracticeTimer()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [editing, setEditing] = useState<PracticeLog | null>(null)
  const [creating, setCreating] = useState(false)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return logs.filter(
      (log) =>
        (status === 'all' || log.status === status) &&
        (!q ||
          log.title.toLowerCase().includes(q) ||
          log.trick?.name.toLowerCase().includes(q) ||
          log.notes_and_flaws_to_fix?.toLowerCase().includes(q)),
    )
  }, [logs, search, status])

  // Group by day
  const groups = useMemo(() => {
    const map = new Map<string, PracticeLog[]>()
    filtered.forEach((log) => map.set(log.practiced_on, [...(map.get(log.practiced_on) ?? []), log]))
    return [...map.entries()]
  }, [filtered])

  const streak = computeStreak(logs.map((l) => l.practiced_on))
  const week = minutesLastDays(logs)
  const month = todayISO().slice(0, 7)
  const monthSessions = logs.filter((l) => l.practiced_on.startsWith(month)).length
  const rated = logs.slice(0, 20).filter((l) => l.self_rating)
  const avgRating = rated.length ? rated.reduce((s, l) => s + (l.self_rating ?? 0), 0) / rated.length : null

  const actions = (
    <>
      <WriteButton variant="outline" onClick={() => practiceTimer.start()} disabled={timer.active}>
        <Timer aria-hidden="true" /> {timer.active ? 'Timer running' : 'Start timer'}
      </WriteButton>
      <WriteButton onClick={() => setCreating(true)}>
        <Plus aria-hidden="true" /> Log session
      </WriteButton>
    </>
  )

  return (
    <>
      <PageHeader title="Practice log" description="Every rehearsal counts." actions={actions} />

      {isLoading ? (
        <ListSkeleton />
      ) : logs.length === 0 ? (
        <EmptyState
          icon={Timer}
          title="No practice sessions yet"
          description="Start the timer when you rehearse, or log a session afterwards. Your streak and weekly time will show up here."
          action={<div className="flex flex-col gap-2 sm:flex-row">{actions}</div>}
        />
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              icon={Flame}
              label="Current streak"
              value={`${streak} day${streak === 1 ? '' : 's'}`}
              hint={streak ? 'Keep the chain going!' : 'Practice today to start one'}
              tone="bg-orange-500/15 text-orange-600 dark:text-orange-300"
            />
            <StatCard icon={Clock} label="Last 7 days" value={formatDuration(week)} tone="bg-sky-500/15 text-sky-700 dark:text-sky-300" />
            <StatCard
              icon={CalendarCheck}
              label="Sessions this month"
              value={String(monthSessions)}
              tone="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
            />
            <StatCard
              icon={Star}
              label="Average rating"
              value={avgRating ? `${avgRating.toFixed(1)} / 5` : '—'}
              hint="Last 20 rated sessions"
              tone="bg-gold/15 text-gold"
            />
          </div>

          <Toolbar>
            <SearchInput value={search} onChange={setSearch} placeholder="Search sessions…" className="sm:w-72" />
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="sm:w-44" aria-label="Filter by status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {PRACTICE_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Toolbar>
          <ResultCount shown={filtered.length} total={logs.length} noun="sessions" />

          {groups.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">No sessions match your filters.</p>
          ) : (
            <div className="space-y-6">
              {groups.map(([day, dayLogs]) => {
                const total = dayLogs.reduce((s, l) => s + (l.time_spent_min ?? 0), 0)
                const isToday = day === todayISO()
                return (
                  <section key={day} aria-label={formatDay(day, { weekday: 'long', day: 'numeric', month: 'long' })}>
                    <h2 className="mb-2 flex items-baseline justify-between text-sm font-semibold">
                      <span>
                        {isToday ? 'Today' : formatDay(day, { weekday: 'long', day: 'numeric', month: 'long' })}
                        {!isToday && parseDay(day).getFullYear() !== new Date().getFullYear() && ` ${parseDay(day).getFullYear()}`}
                      </span>
                      <span className="text-xs font-normal text-muted-foreground">{formatDuration(total)}</span>
                    </h2>
                    <ul className="divide-y rounded-xl border">
                      {dayLogs.map((log) => (
                        <PracticeRow key={log.id} log={log} onOpen={() => setEditing(log)} />
                      ))}
                    </ul>
                  </section>
                )
              })}
            </div>
          )}
        </>
      )}

      <PracticeFormDialog open={creating} onOpenChange={setCreating} />
      <PracticeFormDialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)} log={editing} />
    </>
  )
}

function PracticeRow({ log, onOpen }: { log: PracticeLog; onOpen: () => void }) {
  const status = findOption(PRACTICE_STATUSES, log.status)
  return (
    <li className="group relative flex flex-col gap-2 px-4 py-3 transition-colors hover:bg-muted/50 sm:flex-row sm:items-center sm:gap-4">
      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={onOpen}
          className="text-left font-medium after:absolute after:inset-0 focus-visible:outline-none group-focus-within:text-gold"
        >
          {log.title}
        </button>
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
          {log.trick && (
            <Link
              to={`/app/tricks/${log.trick.id}`}
              className="relative z-10 inline-flex items-center gap-1 rounded-full border border-gold/30 px-2 py-0.5 text-gold hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <Sparkles className="size-3" aria-hidden="true" /> {log.trick.name}
            </Link>
          )}
          {log.routine && (
            <Link
              to={`/app/routines/${log.routine.id}`}
              className="relative z-10 inline-flex items-center gap-1 rounded-full border border-violet-500/30 px-2 py-0.5 text-violet-700 hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none dark:text-violet-300"
            >
              <ListOrdered className="size-3" aria-hidden="true" /> {log.routine.name}
            </Link>
          )}
          {log.notes_and_flaws_to_fix && (
            <span className="line-clamp-1 text-muted-foreground">{log.notes_and_flaws_to_fix}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 text-sm">
        {log.self_rating && <StarRating value={log.self_rating} max={5} label="Self rating" />}
        {log.status !== 'done' && (
          <Badge variant="outline" className={status?.badge}>
            {status?.label}
          </Badge>
        )}
        <span className="w-16 text-right text-muted-foreground tabular-nums">{formatDuration(log.time_spent_min)}</span>
      </div>
      <span className="pointer-events-none absolute inset-0 ring-ring ring-inset group-has-[button:focus-visible]:ring-2" aria-hidden="true" />
    </li>
  )
}
