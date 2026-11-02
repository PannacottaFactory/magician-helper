import { useMemo, useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { SearchInput } from '@/components/common/list-toolbar'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { dbErrorMessage } from '@/lib/db'
import { pluralize } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useAddCatalogItems, useInventory } from '../api'
import { CATALOG_GROUPS, PROP_CATALOG, type CatalogGroup } from './catalog-data'
import { CatalogIllustration } from './illustrations'

export function CatalogDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { data: inventory = [] } = useInventory()
  const add = useAddCatalogItems()
  const [group, setGroup] = useState<CatalogGroup | 'All'>('All')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const owned = useMemo(() => new Set(inventory.map((i) => i.catalog_key).filter(Boolean)), [inventory])

  const visible = PROP_CATALOG.filter(
    (item) =>
      (group === 'All' || item.group === group) &&
      (!search.trim() || item.name.toLowerCase().includes(search.trim().toLowerCase())),
  )

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  async function onAdd() {
    const items = PROP_CATALOG.filter((item) => selected.has(item.key))
    try {
      await add.mutateAsync(
        items.map((item) => ({
          item_name: item.name,
          catalog_key: item.key,
          quantity: item.quantity,
          low_stock_threshold: item.lowStockThreshold,
          notes: item.notes,
        })),
      )
      toast.success(`${pluralize(items.length, 'item')} added to your inventory. Adjust quantities anytime.`)
      setSelected(new Set())
      onOpenChange(false)
    } catch (error) {
      toast.error(dbErrorMessage(error))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92dvh] flex-col gap-4 sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Add classic props</DialogTitle>
          <DialogDescription>
            Pick what you own — quantities and stock alerts are pre-filled, you can change them later.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search the catalog…" />
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by family">
            {(['All', ...CATALOG_GROUPS] as const).map((g) => (
              <button
                key={g}
                type="button"
                aria-pressed={group === g}
                onClick={() => setGroup(g)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                  group === g ? 'border-gold/60 bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className="-mx-6 flex-1 overflow-y-auto px-6">
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {visible.map((item) => {
              const isSelected = selected.has(item.key)
              const isOwned = owned.has(item.key)
              return (
                <li key={item.key}>
                  <button
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => toggle(item.key)}
                    className={cn(
                      'group relative w-full overflow-hidden rounded-xl border text-left transition-all',
                      'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                      isSelected ? 'border-gold ring-1 ring-gold' : 'hover:border-gold/40',
                    )}
                  >
                    <CatalogIllustration catalogKey={item.key} className="aspect-[4/3] w-full" />
                    <span
                      className={cn(
                        'absolute top-2 right-2 flex size-6 items-center justify-center rounded-full border transition-colors',
                        isSelected ? 'border-gold bg-gold text-primary-foreground' : 'border-white/40 bg-black/30',
                      )}
                      aria-hidden="true"
                    >
                      {isSelected && <Check className="size-3.5" />}
                    </span>
                    <span className="block p-2.5">
                      <span className="block truncate text-sm font-medium">{item.name}</span>
                      <span className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                        {item.group}
                        {isOwned && <span className="text-gold">In inventory</span>}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
          {visible.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">Nothing found.</p>}
        </div>

        <DialogFooter className="items-center gap-2 sm:justify-between">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {selected.size ? `${pluralize(selected.size, 'item')} selected` : 'Nothing selected'}
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={onAdd} disabled={!selected.size || add.isPending}>
              {add.isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
              Add {selected.size ? pluralize(selected.size, 'item') : 'items'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
