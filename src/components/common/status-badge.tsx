import { Badge } from '@/components/ui/badge'
import { STOCK_STATUSES, TRICK_STATUSES, findOption } from '@/lib/constants'
import { cn } from '@/lib/utils'

export function TrickStatusBadge({ status, className }: { status: string; className?: string }) {
  const option = findOption(TRICK_STATUSES, status)
  return (
    <Badge variant="outline" className={cn('gap-1.5 font-medium', option?.badge, className)}>
      <span className={cn('size-1.5 rounded-full', option?.dot)} aria-hidden="true" />
      {option?.label ?? status}
    </Badge>
  )
}

export function StockBadge({ status, className }: { status: string | null; className?: string }) {
  const option = findOption(STOCK_STATUSES, status)
  return (
    <Badge variant="outline" className={cn('font-medium', option?.badge, className)}>
      {option?.label ?? status}
    </Badge>
  )
}
