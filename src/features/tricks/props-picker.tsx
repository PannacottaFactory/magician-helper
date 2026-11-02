import { useState } from 'react'
import { Check, PackagePlus, Plus, X } from 'lucide-react'
import { NumberInput } from '@/components/common/number-input'
import { StockBadge } from '@/components/common/status-badge'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useInventory } from '@/features/inventory/api'
import { InventoryFormDialog } from '@/features/inventory/inventory-form-dialog'
import { cn } from '@/lib/utils'
import type { TrickValues } from './schemas'

type PropValue = TrickValues['props'][number]

/** Pick inventory items used by a trick, with the quantity needed. */
export function PropsPicker({ value, onChange }: { value: PropValue[]; onChange: (value: PropValue[]) => void }) {
  const { data: inventory = [] } = useInventory()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [creatingName, setCreatingName] = useState<string | null>(null)
  const selected = new Set(value.map((p) => p.item_id))

  function toggle(id: string, name: string) {
    if (selected.has(id)) onChange(value.filter((p) => p.item_id !== id))
    else onChange([...value, { item_id: id, item_name: name, quantity_needed: 1 }])
  }

  const exactMatch = inventory.some((i) => i.item_name?.toLowerCase() === query.trim().toLowerCase())

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <ul className="divide-y rounded-lg border">
          {value.map((prop, index) => {
            const item = inventory.find((i) => i.id === prop.item_id)
            return (
              <li key={prop.item_id} className="flex items-center gap-2 px-3 py-2">
                <span className="min-w-0 flex-1 truncate text-sm">{prop.item_name}</span>
                {item && item.stock_status !== 'in_stock' && <StockBadge status={item.stock_status} />}
                <label className="sr-only" htmlFor={`prop-qty-${prop.item_id}`}>
                  Quantity of {prop.item_name}
                </label>
                <NumberInput
                  id={`prop-qty-${prop.item_id}`}
                  min={1}
                  className="h-8 w-16"
                  value={prop.quantity_needed}
                  onChange={(q) => onChange(value.map((p, i) => (i === index ? { ...p, quantity_needed: q } : p)))}
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="size-7"
                  onClick={() => onChange(value.filter((p) => p.item_id !== prop.item_id))}
                  aria-label={`Remove ${prop.item_name}`}
                >
                  <X aria-hidden="true" />
                </Button>
              </li>
            )
          })}
        </ul>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" size="sm">
            <Plus aria-hidden="true" /> Link props from inventory
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <Command>
            <CommandInput placeholder="Search your inventory…" value={query} onValueChange={setQuery} />
            <CommandList>
              <CommandEmpty>No item found.</CommandEmpty>
              <CommandGroup>
                {inventory.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={`${item.item_name} ${item.id}`}
                    onSelect={() => toggle(item.id!, item.item_name ?? '')}
                  >
                    <Check
                      className={cn('size-4', selected.has(item.id!) ? 'opacity-100 text-gold' : 'opacity-0')}
                      aria-hidden="true"
                    />
                    <span className="flex-1 truncate">{item.item_name}</span>
                    <span className="text-xs text-muted-foreground">×{item.quantity}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
              {query.trim() && !exactMatch && (
                <CommandGroup>
                  <CommandItem
                    value={`create ${query}`}
                    onSelect={() => {
                      setCreatingName(query.trim())
                      setOpen(false)
                    }}
                  >
                    <PackagePlus className="size-4 text-gold" aria-hidden="true" />
                    Create “{query.trim()}” in inventory
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <InventoryFormDialog
        open={creatingName !== null}
        onOpenChange={(o) => !o && setCreatingName(null)}
        defaultName={creatingName ?? ''}
        onSaved={(item) => {
          onChange([...value, { item_id: item.id, item_name: item.item_name, quantity_needed: 1 }])
          setQuery('')
        }}
      />
    </div>
  )
}
