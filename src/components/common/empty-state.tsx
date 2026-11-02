import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type EmptyStateProps = {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

/** Friendly placeholder shown when a list has no data yet. */
export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-16 text-center',
        'animate-in fade-in-50 duration-500',
        className,
      )}
    >
      <div className="relative mb-5">
        <div className="absolute inset-0 rounded-full bg-gold/10 blur-xl" aria-hidden="true" />
        <div className="relative flex size-16 items-center justify-center rounded-full border border-gold/30 bg-card">
          <Icon className="size-7 text-gold" aria-hidden="true" />
        </div>
      </div>
      <h2 className="text-lg font-semibold">{title}</h2>
      {description && <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
