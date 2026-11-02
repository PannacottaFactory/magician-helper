import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { WriteButton } from '@/components/common/write-button'
import { Button } from '@/components/ui/button'
import { PAYMENT_STATUSES, findOption } from '@/lib/constants'
import { formatDate, formatTime, toISODay, todayISO } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { GigRow } from './api'
import { PaymentBadge } from './payment-badge'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

/** Days shown for a month, starting on Monday, whole weeks only. */
function monthDays(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1)
  const offset = (first.getDay() + 6) % 7
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const total = Math.ceil((offset + daysInMonth) / 7) * 7
  return Array.from({ length: total }, (_, i) => new Date(month.getFullYear(), month.getMonth(), 1 - offset + i))
}

export function GigCalendar({ gigs, onCreate }: { gigs: GigRow[]; onCreate: (date: string) => void }) {
  const [month, setMonth] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [selected, setSelected] = useState(todayISO())

  const byDay = useMemo(() => {
    const map = new Map<string, GigRow[]>()
    gigs.forEach((g) => {
      const day = toISODay(new Date(g.starts_at))
      map.set(day, [...(map.get(day) ?? []), g])
    })
    return map
  }, [gigs])

  const days = monthDays(month)
  const today = todayISO()
  const selectedGigs = byDay.get(selected) ?? []
  const shift = (n: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-2xl font-semibold" aria-live="polite">
          {formatDate(month, { month: 'long', year: 'numeric' })}
        </h2>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" onClick={() => shift(-1)} aria-label="Previous month">
            <ChevronLeft aria-hidden="true" />
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              const d = new Date()
              setMonth(new Date(d.getFullYear(), d.getMonth(), 1))
              setSelected(today)
            }}
          >
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={() => shift(1)} aria-label="Next month">
            <ChevronRight aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border">
        <div className="grid grid-cols-7 border-b bg-muted/50 text-center text-xs font-medium text-muted-foreground">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-2">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const iso = toISODay(day)
            const dayGigs = byDay.get(iso) ?? []
            const inMonth = day.getMonth() === month.getMonth()
            const isToday = iso === today
            const isSelected = iso === selected
            return (
              <div
                key={iso}
                className={cn(
                  'relative min-h-16 border-r border-b p-1 last:border-r-0 md:min-h-28 [&:nth-child(7n)]:border-r-0',
                  !inMonth && 'bg-muted/30',
                  isSelected && 'bg-accent/50',
                )}
              >
                <button
                  type="button"
                  onClick={() => setSelected(iso)}
                  aria-pressed={isSelected}
                  aria-label={`${formatDate(day, { weekday: 'long', day: 'numeric', month: 'long' })}${dayGigs.length ? `, ${dayGigs.length} gig${dayGigs.length > 1 ? 's' : ''}` : ''}`}
                  className="flex w-full flex-col items-center gap-1 rounded-md py-1 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none md:items-start md:px-1"
                >
                  <span
                    className={cn(
                      'flex size-7 items-center justify-center rounded-full text-sm tabular-nums',
                      !inMonth && 'text-muted-foreground/60',
                      isToday && 'bg-gold font-semibold text-primary-foreground',
                    )}
                  >
                    {day.getDate()}
                  </span>
                  {/* mobile: dots */}
                  {dayGigs.length > 0 && (
                    <span className="flex gap-0.5 md:hidden" aria-hidden="true">
                      {dayGigs.slice(0, 3).map((g) => (
                        <span key={g.id} className={cn('size-1.5 rounded-full', findOption(PAYMENT_STATUSES, g.payment_status)?.dot)} />
                      ))}
                    </span>
                  )}
                </button>
                {/* desktop: gig chips */}
                <div className="hidden space-y-1 md:block">
                  {dayGigs.slice(0, 3).map((g) => (
                    <Link
                      key={g.id}
                      to={g.id}
                      className={cn(
                        'block truncate rounded border-l-2 bg-card px-1.5 py-0.5 text-xs shadow-sm hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                        g.payment_status === 'fully_paid'
                          ? 'border-l-emerald-400'
                          : g.payment_status === 'invoiced'
                            ? 'border-l-amber-400'
                            : g.payment_status === 'deposit_paid'
                              ? 'border-l-sky-400'
                              : 'border-l-gold',
                      )}
                    >
                      <span className="text-muted-foreground tabular-nums">{formatTime(g.starts_at)}</span> {g.title}
                    </Link>
                  ))}
                  {dayGigs.length > 3 && <span className="px-1.5 text-xs text-muted-foreground">+{dayGigs.length - 3} more</span>}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <section aria-label="Selected day" className="rounded-xl border p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="font-semibold">{formatDate(selected + 'T12:00:00', { weekday: 'long', day: 'numeric', month: 'long' })}</h3>
          <WriteButton size="sm" variant="outline" onClick={() => onCreate(selected)}>
            <Plus aria-hidden="true" /> Gig on this day
          </WriteButton>
        </div>
        {selectedGigs.length ? (
          <ul className="space-y-2">
            {selectedGigs.map((g) => (
              <li key={g.id}>
                <Link
                  to={g.id}
                  className="flex items-center gap-3 rounded-lg border p-3 text-sm hover:border-gold/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <span className="w-12 font-medium text-gold tabular-nums">{formatTime(g.starts_at)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{g.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {[g.client_name, g.location].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                  <PaymentBadge status={g.payment_status} />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Nothing booked this day.</p>
        )}
      </section>
    </div>
  )
}
