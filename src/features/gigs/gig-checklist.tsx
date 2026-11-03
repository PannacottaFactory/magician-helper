import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { AlertTriangle, Loader2, Plus, RefreshCw, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { ItemVisual } from '@/features/inventory/item-visual'
import { useAccess } from '@/features/profile/api'
import { dbErrorMessage } from '@/lib/db'
import { cn } from '@/lib/utils'
import {
  useAddChecklistItem,
  useDeleteChecklistItem,
  useGigChecklist,
  useSyncChecklist,
  useToggleChecklistItem,
  type ChecklistItem,
} from './api'

function stockProblem(item: ChecklistItem) {
  if (!item.item) return null
  if (item.item.quantity === 0) return 'Out of stock'
  if (item.item.quantity < item.quantity_needed) return `Only ${item.item.quantity} in stock`
  return null
}

/** Preparation checklist: props from the gig's routines + manual items. */
export function GigChecklist({ gigId }: { gigId: string }) {
  const { data: items = [], isLoading } = useGigChecklist(gigId)
  const { canWrite } = useAccess()
  const toggle = useToggleChecklistItem(gigId)
  const add = useAddChecklistItem(gigId)
  const remove = useDeleteChecklistItem(gigId)
  const sync = useSyncChecklist(gigId)
  const [draft, setDraft] = useState('')

  // Inventory props first, then everyday props, then manual items
  const sorted = [...items].sort((a, b) => {
    const rank = (i: ChecklistItem) => (i.source === 'manual' ? 2 : i.item_id ? 0 : 1)
    return rank(a) - rank(b) || a.label.localeCompare(b.label)
  })
  const done = items.filter((i) => i.is_checked).length
  const problems = items.filter((i) => stockProblem(i))

  function onAdd(event: FormEvent) {
    event.preventDefault()
    const label = draft.trim()
    if (!label) return
    add.mutate(label, { onSuccess: () => setDraft(''), onError: (e) => toast.error(dbErrorMessage(e)) })
  }

  if (isLoading) return <Skeleton className="h-32 w-full" />

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div
          className="h-2 flex-1 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-label="Checklist progress"
          aria-valuemin={0}
          aria-valuemax={items.length}
          aria-valuenow={done}
        >
          <div
            className={cn('h-full rounded-full transition-all duration-500', done === items.length && items.length ? 'bg-success' : 'bg-gold')}
            style={{ width: items.length ? `${(done / items.length) * 100}%` : '0%' }}
          />
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">
          {done}/{items.length} packed
        </span>
        {canWrite && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() =>
              sync.mutate(undefined, {
                onSuccess: () => toast.success('Checklist updated from the routines.'),
                onError: (e) => toast.error(dbErrorMessage(e)),
              })
            }
            disabled={sync.isPending}
            title="Re-read the props of the linked routines"
          >
            {sync.isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <RefreshCw aria-hidden="true" />}
            Refresh
          </Button>
        )}
      </div>

      {problems.length > 0 && (
        <p className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm" role="status">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden="true" />
          <span>
            <span className="font-medium">Stock problem: </span>
            {problems.map((p) => `${p.label} (${stockProblem(p)?.toLowerCase()})`).join(', ')}
          </span>
        </p>
      )}

      {sorted.length ? (
        <ul className="divide-y rounded-lg border">
          {sorted.map((item) => {
            const problem = stockProblem(item)
            const id = `check-${item.id}`
            return (
              <li key={item.id} className={cn('flex items-center gap-3 px-3 py-2', item.is_checked && 'bg-muted/40')}>
                <Checkbox
                  id={id}
                  checked={item.is_checked}
                  disabled={!canWrite}
                  onCheckedChange={(checked) =>
                    toggle.mutate({ id: item.id, checked: checked === true }, { onError: (e) => toast.error(dbErrorMessage(e)) })
                  }
                />
                {item.item && <ItemVisual catalogKey={item.item.catalog_key} className="h-7 w-9 shrink-0 overflow-hidden rounded" />}
                <label
                  htmlFor={id}
                  className={cn('min-w-0 flex-1 cursor-pointer text-sm', item.is_checked && 'text-muted-foreground line-through')}
                >
                  {item.label}
                  {item.quantity_needed > 1 && <span className="text-muted-foreground"> × {item.quantity_needed}</span>}
                </label>
                {problem && (
                  <span className="shrink-0 rounded-full border border-destructive/40 bg-destructive/10 px-2 py-0.5 text-xs text-danger">
                    {problem}
                  </span>
                )}
                {item.item && (
                  <Link to={`/app/inventory/${item.item.id}`} className="sr-only focus:not-sr-only focus:text-xs focus:underline">
                    Open {item.label} in inventory
                  </Link>
                )}
                {item.source === 'manual' && canWrite && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-7 text-muted-foreground"
                    onClick={() => remove.mutate(item.id, { onError: (e) => toast.error(dbErrorMessage(e)) })}
                    aria-label={`Remove ${item.label}`}
                  >
                    <X aria-hidden="true" />
                  </Button>
                )}
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
          Link routines to this gig to generate the list of props to pack — or add items by hand.
        </p>
      )}

      {canWrite && (
        <form onSubmit={onAdd} className="flex gap-2">
          <label htmlFor={`add-${gigId}`} className="sr-only">
            Add a checklist item
          </label>
          <Input
            id={`add-${gigId}`}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add an item (business cards, mic, table…)"
            maxLength={200}
          />
          <Button type="submit" variant="outline" disabled={!draft.trim() || add.isPending} aria-label="Add item">
            <Plus aria-hidden="true" />
          </Button>
        </form>
      )}
    </div>
  )
}
