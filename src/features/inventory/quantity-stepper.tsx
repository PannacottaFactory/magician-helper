import { Minus, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useAccess } from '@/features/profile/api'
import { dbErrorMessage } from '@/lib/db'
import { cn } from '@/lib/utils'
import { useAdjustQuantity } from './api'

export function QuantityStepper({
  id,
  name,
  quantity,
  className,
}: {
  id: string
  name: string
  quantity: number
  className?: string
}) {
  const adjust = useAdjustQuantity()
  const { canWrite } = useAccess()

  function change(delta: number) {
    adjust.mutate({ id, quantity: quantity + delta }, { onError: (e) => toast.error(dbErrorMessage(e)) })
  }

  return (
    <div className={cn('inline-flex items-center gap-1', className)} onClick={(e) => e.stopPropagation()}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-7"
        onClick={() => change(-1)}
        disabled={!canWrite || quantity <= 0}
        aria-label={`Decrease quantity of ${name}`}
      >
        <Minus aria-hidden="true" />
      </Button>
      <span className="w-8 text-center text-sm font-semibold tabular-nums" aria-live="polite">
        {quantity}
      </span>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-7"
        onClick={() => change(1)}
        disabled={!canWrite}
        aria-label={`Increase quantity of ${name}`}
      >
        <Plus aria-hidden="true" />
      </Button>
    </div>
  )
}
