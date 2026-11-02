import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatDay, formatDuration, parseDay, toISODay, todayISO } from '@/lib/format'
import { cn } from '@/lib/utils'

/**
 * Minutes practiced on each of the last 7 days. Single series → no legend
 * (the section title names it); per-bar hover tooltip; screen-reader table.
 */
export function PracticeWeekChart({ logs }: { logs: { practiced_on: string; time_spent_min: number | null }[] }) {
  const today = todayISO()
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = parseDay(today)
    d.setDate(d.getDate() - (6 - i))
    const iso = toISODay(d)
    const minutes = logs.filter((l) => l.practiced_on === iso).reduce((s, l) => s + (l.time_spent_min ?? 0), 0)
    return { iso, minutes, label: formatDay(iso, { weekday: 'short' }) }
  })
  const max = Math.max(30, ...days.map((d) => d.minutes))

  return (
    <figure>
      <div className="flex h-36 items-end gap-2 border-b border-border pb-px" aria-hidden="true">
        {days.map((d) => (
          <Tooltip key={d.iso}>
            <TooltipTrigger asChild>
              {/* full-height hit target, bigger than the bar itself */}
              <div className="group flex h-full flex-1 cursor-default items-end justify-center">
                <div
                  className={cn(
                    'w-full max-w-9 rounded-t-[4px] transition-colors',
                    d.minutes ? 'bg-gold group-hover:bg-gold/80' : 'bg-transparent',
                  )}
                  style={{ height: d.minutes ? `${Math.max(4, (d.minutes / max) * 100)}%` : 0 }}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {formatDay(d.iso, { weekday: 'long', day: 'numeric', month: 'short' })}: {d.minutes ? formatDuration(d.minutes) : 'no practice'}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
      <div className="mt-1.5 flex gap-2 text-center text-[11px] text-muted-foreground" aria-hidden="true">
        {days.map((d) => (
          <span key={d.iso} className={cn('flex-1', d.iso === today && 'font-semibold text-foreground')}>
            {d.label}
          </span>
        ))}
      </div>
      <table className="sr-only">
        <caption>Minutes practiced over the last 7 days</caption>
        <thead>
          <tr>
            <th scope="col">Day</th>
            <th scope="col">Minutes</th>
          </tr>
        </thead>
        <tbody>
          {days.map((d) => (
            <tr key={d.iso}>
              <td>{formatDay(d.iso, { weekday: 'long', day: 'numeric', month: 'long' })}</td>
              <td>{d.minutes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
