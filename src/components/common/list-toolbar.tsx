import type { ReactNode } from 'react'
import { LayoutGrid, Search, Table2, Columns3, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  className,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}) {
  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
      <Input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="pr-8 pl-8 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <X className="size-3.5" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}

export type ViewMode = 'table' | 'cards' | 'kanban'
const VIEW_META: Record<ViewMode, { label: string; icon: typeof Table2 }> = {
  table: { label: 'Table', icon: Table2 },
  cards: { label: 'Cards', icon: LayoutGrid },
  kanban: { label: 'Kanban', icon: Columns3 },
}

export function ViewSwitcher({
  value,
  onChange,
  views,
}: {
  value: ViewMode
  onChange: (value: ViewMode) => void
  views: ViewMode[]
}) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      value={value}
      onValueChange={(v) => v && onChange(v as ViewMode)}
      aria-label="View"
    >
      {views.map((view) => {
        const { label, icon: Icon } = VIEW_META[view]
        return (
          <ToggleGroupItem key={view} value={view} aria-label={`${label} view`} title={`${label} view`}>
            <Icon aria-hidden="true" />
          </ToggleGroupItem>
        )
      })}
    </ToggleGroup>
  )
}

/** Flexible row of filters under the page header. */
export function Toolbar({ children }: { children: ReactNode }) {
  return <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">{children}</div>
}

export function ResultCount({ shown, total, noun }: { shown: number; total: number; noun: string }) {
  if (shown === total) return null
  return (
    <p className="mb-3 text-xs text-muted-foreground" aria-live="polite">
      Showing {shown} of {total} {noun}
    </p>
  )
}
