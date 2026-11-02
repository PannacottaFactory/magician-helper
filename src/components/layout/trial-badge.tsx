import { Link } from 'react-router'
import { Hourglass } from 'lucide-react'
import { useAccess } from '@/features/profile/api'
import { cn } from '@/lib/utils'

/** Small "X days left" pill shown during the free trial. */
export function TrialBadge({ compact = false }: { compact?: boolean }) {
  const { onTrial, trialDaysLeft } = useAccess()
  if (!onTrial) return null
  const label = `${trialDaysLeft} day${trialDaysLeft === 1 ? '' : 's'} left in trial`
  return (
    <Link
      to="/app/billing"
      title={label}
      aria-label={`${label}. Go to billing`}
      className={cn(
        'flex items-center gap-2 rounded-lg border border-gold/30 bg-accent/60 px-3 py-2 text-xs text-accent-foreground',
        'transition-colors hover:border-gold/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
        compact && 'justify-center px-0',
      )}
    >
      <Hourglass className="size-3.5 shrink-0 text-gold" aria-hidden="true" />
      {compact ? <span className="font-semibold">{trialDaysLeft}d</span> : <span>{label}</span>}
    </Link>
  )
}
