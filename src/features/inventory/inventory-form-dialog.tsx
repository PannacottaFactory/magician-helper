import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { NumberInput } from '@/components/common/number-input'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useProfile } from '@/features/profile/api'
import { dbErrorMessage } from '@/lib/db'
import { useSaveInventoryItem, type InventoryItem } from './api'
import { inventorySchema, type InventoryValues } from './schemas'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  item?: Pick<
    InventoryItem,
    'id' | 'item_name' | 'quantity' | 'low_stock_threshold' | 'buy_link' | 'cost' | 'notes'
  > | null
  /** Pre-filled name (e.g. when creating from the trick props picker). */
  defaultName?: string
  onSaved?: (item: InventoryItem) => void
}

function toValues(item: Props['item'], defaultName = ''): InventoryValues {
  return {
    item_name: item?.item_name ?? defaultName,
    quantity: item?.quantity ?? 1,
    low_stock_threshold: item?.low_stock_threshold ?? 0,
    buy_link: item?.buy_link ?? '',
    cost: item?.cost ?? null,
    notes: item?.notes ?? '',
  }
}

export function InventoryFormDialog({ open, onOpenChange, item, defaultName, onSaved }: Props) {
  const save = useSaveInventoryItem()
  const { data: profile } = useProfile()
  const form = useForm<InventoryValues>({
    resolver: zodResolver(inventorySchema),
    defaultValues: toValues(item, defaultName),
  })

  useEffect(() => {
    if (open) form.reset(toValues(item, defaultName))
  }, [open, item, defaultName, form])

  async function onSubmit(values: InventoryValues) {
    try {
      const saved = await save.mutateAsync({
        id: item?.id,
        values: {
          item_name: values.item_name,
          quantity: values.quantity ?? 0,
          low_stock_threshold: values.low_stock_threshold ?? 0,
          buy_link: values.buy_link || null,
          cost: values.cost,
          notes: values.notes || null,
        },
      })
      toast.success(item ? 'Item updated.' : `“${saved.item_name}” added to your inventory.`)
      onSaved?.(saved)
      onOpenChange(false)
    } catch (error) {
      toast.error(dbErrorMessage(error))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{item ? 'Edit item' : 'New inventory item'}</DialogTitle>
          <DialogDescription>Props, gimmicks and consumables you need for your shows.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <FormField
              control={form.control}
              name="item_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Bicycle deck (red)" autoFocus {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <NumberInput min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="low_stock_threshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Low-stock alert at</FormLabel>
                    <FormControl>
                      <NumberInput min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_9rem]">
              <FormField
                control={form.control}
                name="buy_link"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Where to buy</FormLabel>
                    <FormControl>
                      <Input type="url" placeholder="https://…" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost ({profile?.currency ?? 'EUR'})</FormLabel>
                    <FormControl>
                      <NumberInput decimals min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Maintenance, where it's stored…" {...field} />
                  </FormControl>
                  <FormDescription>You can add photos and files after saving.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="animate-spin" aria-hidden="true" />}
                {item ? 'Save changes' : 'Add item'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
