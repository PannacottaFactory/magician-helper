import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Check, Loader2, Plus, UserPlus, X } from 'lucide-react'
import { toast } from 'sonner'
import { NumberInput } from '@/components/common/number-input'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useClients } from '@/features/clients/api'
import { ClientFormDialog } from '@/features/clients/client-form-dialog'
import { useProfile } from '@/features/profile/api'
import { useRoutines } from '@/features/routines/api'
import { CURRENCIES, EVENT_TYPES, PAYMENT_STATUSES } from '@/lib/constants'
import { dbErrorMessage } from '@/lib/db'
import { combineDateTime, formatDuration, toISODay, toTimeInput, todayISO } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useSaveGig, type GigDetail } from './api'

const NONE = 'none'

const gigSchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required').max(200, 'Too long'),
    client_id: z.string(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a date'),
    start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Pick a start time'),
    end_time: z.string(),
    location: z.string().trim().max(500, 'Too long'),
    event_type: z.string().trim().max(100, 'Too long'),
    fee: z.number().min(0, 'Cannot be negative').max(99_999_999).nullable(),
    currency: z.string().regex(/^[A-Z]{3}$/),
    deposit_amount: z.number().min(0, 'Cannot be negative').max(99_999_999).nullable(),
    payment_status: z.enum(['pending', 'deposit_paid', 'invoiced', 'fully_paid']),
    routine_ids: z.array(z.string()),
    notes: z.string().max(20_000),
  })
  .refine((v) => v.deposit_amount === null || v.fee === null || v.deposit_amount <= v.fee, {
    message: 'The deposit cannot be higher than the fee',
    path: ['deposit_amount'],
  })
type GigValues = z.infer<typeof gigSchema>

export type GigDefaults = { date?: string; clientId?: string }

function toValues(gig: GigDetail | null | undefined, defaults: GigDefaults | undefined, currency: string): GigValues {
  return {
    title: gig?.title ?? '',
    client_id: gig?.client_id ?? defaults?.clientId ?? NONE,
    date: gig ? toISODay(new Date(gig.starts_at)) : (defaults?.date ?? todayISO()),
    start_time: gig ? toTimeInput(gig.starts_at) : '20:00',
    end_time: gig?.ends_at ? toTimeInput(gig.ends_at) : '',
    location: gig?.location ?? '',
    event_type: gig?.event_type ?? '',
    fee: gig?.fee === null || gig?.fee === undefined ? null : Number(gig.fee),
    currency: gig?.currency ?? currency,
    deposit_amount: gig?.deposit_amount === null || gig?.deposit_amount === undefined ? null : Number(gig.deposit_amount),
    payment_status: (gig?.payment_status as GigValues['payment_status']) ?? 'pending',
    routine_ids: gig?.gig_routines.map((gr) => gr.routine?.id).filter((id): id is string => Boolean(id)) ?? [],
    notes: gig?.notes ?? '',
  }
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-4 border-t pt-5 first:border-t-0 first:pt-0">
      <legend className="mb-1 text-xs font-semibold tracking-wider text-gold uppercase">{title}</legend>
      {children}
    </fieldset>
  )
}

export function GigFormDialog({
  open,
  onOpenChange,
  gig,
  defaults,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  gig?: GigDetail | null
  defaults?: GigDefaults
}) {
  const save = useSaveGig()
  const navigate = useNavigate()
  const { data: profile } = useProfile()
  const { data: clients = [] } = useClients()
  const [creatingClient, setCreatingClient] = useState(false)
  const defaultCurrency = profile?.currency ?? 'EUR'
  const form = useForm<GigValues>({ resolver: zodResolver(gigSchema), defaultValues: toValues(gig, defaults, defaultCurrency) })

  useEffect(() => {
    if (open) form.reset(toValues(gig, defaults, defaultCurrency))
  }, [open, gig, defaults, defaultCurrency, form])

  async function onSubmit(values: GigValues) {
    const startsAt = combineDateTime(values.date, values.start_time)
    let endsAt: string | null = null
    if (values.end_time) {
      endsAt = combineDateTime(values.date, values.end_time)
      // ends after midnight
      if (new Date(endsAt) <= new Date(startsAt)) endsAt = new Date(new Date(endsAt).getTime() + 86_400_000).toISOString()
    }
    try {
      const saved = await save.mutateAsync({
        id: gig?.id,
        values: {
          title: values.title,
          client_id: values.client_id === NONE ? null : values.client_id,
          starts_at: startsAt,
          ends_at: endsAt,
          location: values.location || null,
          event_type: values.event_type || null,
          fee: values.fee,
          currency: values.currency,
          deposit_amount: values.deposit_amount,
          payment_status: values.payment_status,
          notes: values.notes || null,
        },
        routineIds: values.routine_ids,
      })
      onOpenChange(false)
      if (gig) toast.success('Gig updated.')
      else {
        toast.success(`“${saved.title}” booked!`)
        navigate(`/app/gigs/${saved.id}`)
      }
    } catch (error) {
      toast.error(dbErrorMessage(error))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{gig ? `Edit “${gig.title}”` : 'New gig'}</DialogTitle>
          <DialogDescription>Link routines to get an automatic preparation checklist.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
            <Section title="Event">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Acme Christmas party" autoFocus {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-[1fr_7rem_7rem]">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="col-span-2 sm:col-span-1">
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="start_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="end_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="Venue, address…" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="event_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event type</FormLabel>
                      <FormControl>
                        <Input list="gig-event-types" placeholder="Corporate event" {...field} />
                      </FormControl>
                      <datalist id="gig-event-types">
                        {EVENT_TYPES.map((t) => (
                          <option key={t} value={t} />
                        ))}
                      </datalist>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="client_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client</FormLabel>
                    <div className="flex gap-2">
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={NONE}>No client</SelectItem>
                          {clients.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                              {c.company ? ` · ${c.company}` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button type="button" variant="outline" size="icon" onClick={() => setCreatingClient(true)} aria-label="New client">
                        <UserPlus aria-hidden="true" />
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </Section>

            <Section title="Show">
              <FormField
                control={form.control}
                name="routine_ids"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Routines</FormLabel>
                    <RoutinePicker value={field.value} onChange={field.onChange} />
                    <FormDescription>Their props are added to the gig's preparation checklist.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </Section>

            <Section title="Payment">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <FormField
                  control={form.control}
                  name="fee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fee</FormLabel>
                      <FormControl>
                        <NumberInput decimals min={0} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="deposit_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deposit</FormLabel>
                      <FormControl>
                        <NumberInput decimals min={0} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CURRENCIES.map((c) => (
                            <SelectItem key={c.value} value={c.value}>
                              {c.value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="payment_status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PAYMENT_STATUSES.map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                      <Textarea rows={3} placeholder="Contact on site, parking, dress code, timing…" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </Section>

            <DialogFooter className="sticky bottom-0 -mx-6 -mb-6 border-t bg-background px-6 py-4">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="animate-spin" aria-hidden="true" />}
                {gig ? 'Save changes' : 'Book gig'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
        <ClientFormDialog
          open={creatingClient}
          onOpenChange={setCreatingClient}
          onSaved={(client) => form.setValue('client_id', client.id, { shouldDirty: true })}
        />
      </DialogContent>
    </Dialog>
  )
}

function RoutinePicker({ value, onChange }: { value: string[]; onChange: (value: string[]) => void }) {
  const { data: routines = [] } = useRoutines()
  const [open, setOpen] = useState(false)
  const selected = value.map((id) => routines.find((r) => r.id === id)).filter((r) => r !== undefined)
  const total = selected.reduce((s, r) => s + r.total_duration_min, 0)

  return (
    <div className="space-y-2">
      {selected.length > 0 && (
        <ul className="divide-y rounded-lg border">
          {selected.map((r) => (
            <li key={r.id} className="flex items-center gap-2 px-3 py-2 text-sm">
              <span className="min-w-0 flex-1 truncate">{r.name}</span>
              <span className="text-xs text-muted-foreground">{formatDuration(r.total_duration_min)}</span>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="size-7"
                onClick={() => onChange(value.filter((id) => id !== r.id))}
                aria-label={`Remove ${r.name}`}
              >
                <X aria-hidden="true" />
              </Button>
            </li>
          ))}
          <li className="flex justify-between px-3 py-2 text-xs text-muted-foreground">
            <span>Total show time</span>
            <span className="font-medium text-foreground">{formatDuration(total)}</span>
          </li>
        </ul>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" size="sm">
            <Plus aria-hidden="true" /> Add routines
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <Command>
            <CommandInput placeholder="Search routines…" />
            <CommandList>
              <CommandEmpty>No routine found. Create one in Routines first.</CommandEmpty>
              <CommandGroup>
                {routines.map((r) => {
                  const isSelected = value.includes(r.id)
                  return (
                    <CommandItem
                      key={r.id}
                      value={`${r.name} ${r.id}`}
                      onSelect={() => onChange(isSelected ? value.filter((id) => id !== r.id) : [...value, r.id])}
                    >
                      <Check className={cn('size-4', isSelected ? 'text-gold opacity-100' : 'opacity-0')} aria-hidden="true" />
                      <span className="flex-1 truncate">{r.name}</span>
                      <span className="text-xs text-muted-foreground">{formatDuration(r.total_duration_min)}</span>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
