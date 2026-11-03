import { Badge } from '@/components/ui/badge'
import { findOption, statusesFor } from '@/lib/constants'
import { cn } from '@/lib/utils'

export function DocumentStatusBadge({ kind, status, className }: { kind: string; status: string; className?: string }) {
  const option = findOption(statusesFor(kind), status)
  return (
    <Badge variant="outline" className={cn('gap-1.5 font-medium', option?.badge, className)}>
      <span className={cn('size-1.5 rounded-full', option?.dot)} aria-hidden="true" />
      {option?.label ?? status}
    </Badge>
  )
}

export const kindLabel = (kind: string) => (kind === 'quote' ? 'Quote' : 'Invoice')
