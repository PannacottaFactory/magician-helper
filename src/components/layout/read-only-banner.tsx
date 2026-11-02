import { Link } from 'react-router'
import { Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAccess } from '@/features/profile/api'

/** Shown on every app page once the trial is over without a subscription. */
export function ReadOnlyBanner() {
  const { canWrite } = useAccess()
  if (canWrite) return null
  return (
    <div
      role="status"
      className="mb-6 flex flex-col gap-3 rounded-xl border border-gold/40 bg-accent/60 p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-3">
        <Lock className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden="true" />
        <div>
          <p className="text-sm font-medium">Your free trial has ended — your account is read-only.</p>
          <p className="text-xs text-muted-foreground">
            Your data is safe: you can still view and export everything. Subscribe to create and edit again.
          </p>
        </div>
      </div>
      <Button asChild size="sm" className="shrink-0">
        <Link to="/app/billing">Subscribe</Link>
      </Button>
    </div>
  )
}
