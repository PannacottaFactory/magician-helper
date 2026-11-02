import type { LucideIcon } from 'lucide-react'
import { EmptyState } from '@/components/common/empty-state'
import { PageHeader } from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'

type ComingSoonProps = {
  title: string
  description: string
  icon: LucideIcon
  emptyTitle: string
  emptyText: string
  phase: number
}

/** Temporary page used until the feature is built in its phase. */
export function ComingSoonPage({ title, description, icon, emptyTitle, emptyText, phase }: ComingSoonProps) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <EmptyState
        icon={icon}
        title={emptyTitle}
        description={emptyText}
        action={
          <Badge variant="outline" className="border-gold/40 text-gold">
            Coming in phase {phase}
          </Badge>
        }
      />
    </>
  )
}
