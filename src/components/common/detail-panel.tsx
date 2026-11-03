import type { ReactNode } from 'react'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

type DetailPanelProps = {
  open: boolean
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  loading?: boolean
  /** lg = wider panel for content-heavy views */
  size?: 'md' | 'lg'
  children: ReactNode
}

/** Side panel on desktop, full screen on mobile. */
export function DetailPanel({ open, onClose, title, description, actions, loading, size = 'md', children }: DetailPanelProps) {
  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent side="right" className={cn('flex w-full flex-col gap-0 p-0', size === 'lg' ? 'sm:max-w-2xl' : 'sm:max-w-xl')}>
        <SheetHeader className="border-b px-5 py-4 pr-12">
          <SheetTitle className="font-display text-2xl leading-tight font-semibold">
            {loading ? <Skeleton className="h-7 w-48" /> : title}
          </SheetTitle>
          {description ? (
            <SheetDescription asChild>
              <div>{description}</div>
            </SheetDescription>
          ) : (
            <SheetDescription className="sr-only">Details</SheetDescription>
          )}
          {actions && <div className="flex flex-wrap gap-2 pt-2">{actions}</div>}
        </SheetHeader>
        {/* scroll padding: fields focused near the bottom stay clear of sticky form footers */}
        <div className="flex-1 scroll-pb-24 overflow-y-auto px-5 py-5">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            children
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

export function DetailSection({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="mb-6">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  )
}
