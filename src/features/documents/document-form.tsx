import { useEffect } from 'react'
import { useFieldArray, useForm, useWatch, type Control } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { NumberInput } from '@/components/common/number-input'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useClients } from '@/features/clients/api'
import { CURRENCIES } from '@/lib/constants'
import { dbErrorMessage } from '@/lib/db'
import { formatCurrency } from '@/lib/format'
import type { Json } from '@/types/database'
import { useSaveDocument, type DocumentRow } from './api'

const money = (max: number) => z.number({ message: 'Required' }).min(0, 'Cannot be negative').max(max, 'Too large')

const lineSchema = z.object({
  description: z.string().trim().min(1, 'Describe the line').max(500, 'Too long'),
  quantity: z.number({ message: 'Required' }).gt(0, 'Must be positive').max(10_000, 'Too large'),
  unit_price: money(10_000_000),
})

const documentSchema = z
  .object({
    client_id: z.string(),
    title: z.string().trim().max(200, 'Too long'),
    buyer_name: z.string().trim().max(200, 'Too long'),
    buyer_company: z.string().trim().max(200, 'Too long'),
    buyer_address: z.string().max(1000, 'Too long'),
    buyer_email: z.union([z.literal(''), z.string().trim().email('Enter a valid email').max(320)]),
    issue_date: z.string().min(1, 'Required'),
    due_date: z.string(),
    currency: z.string().length(3),
    tax_rate: z.number({ message: 'Required' }).min(0, 'Between 0 and 100').max(100, 'Between 0 and 100'),
    deposit_paid: money(10_000_000),
    notes: z.string().max(5000, 'Too long'),
    lines: z.array(lineSchema).max(50, 'Up to 50 lines'),
  })
  .refine((v) => !v.due_date || v.due_date >= v.issue_date, { path: ['due_date'], message: 'Must be after the issue date' })

type DocumentValues = z.infer<typeof documentSchema>
const NO_CLIENT = 'none'

function toValues(doc: DocumentRow): DocumentValues {
  return {
    client_id: doc.client_id ?? NO_CLIENT,
    title: doc.title ?? '',
    buyer_name: doc.buyer_name ?? '',
    buyer_company: doc.buyer_company ?? '',
    buyer_address: doc.buyer_address ?? '',
    buyer_email: doc.buyer_email ?? '',
    issue_date: doc.issue_date,
    due_date: doc.due_date ?? '',
    currency: doc.currency,
    tax_rate: Number(doc.tax_rate),
    deposit_paid: Number(doc.deposit_paid),
    notes: doc.notes ?? '',
    lines: doc.lines.map((l) => ({ description: l.description, quantity: Number(l.quantity), unit_price: Number(l.unit_price) })),
  }
}

function Totals({ control, kind }: { control: Control<DocumentValues>; kind: string }) {
  const [lines, taxRate, deposit, currency] = useWatch({ control, name: ['lines', 'tax_rate', 'deposit_paid', 'currency'] })
  const subtotal = (lines ?? []).reduce((s, l) => s + Math.round((Number(l.quantity) || 0) * (Number(l.unit_price) || 0) * 100) / 100, 0)
  const tax = Math.round(subtotal * (Number(taxRate) || 0)) / 100
  const total = subtotal + tax
  const due = Math.max(total - (Number(deposit) || 0), 0)
  const row = (label: string, value: number, strong = false) => (
    <div className={strong ? 'flex justify-between border-t pt-2 font-semibold' : 'flex justify-between text-muted-foreground'}>
      <dt>{label}</dt>
      <dd className="tabular-nums">{formatCurrency(value, currency)}</dd>
    </div>
  )
  return (
    <dl className="ml-auto w-full max-w-xs space-y-1 text-sm" aria-live="polite">
      {row('Subtotal', subtotal)}
      {Number(taxRate) > 0 && row(`VAT (${taxRate}%)`, tax)}
      {row('Total', total, kind === 'quote')}
      {Number(deposit) > 0 && row('Deposit received', -Number(deposit))}
      {kind === 'invoice' && row('Amount due', due, true)}
    </dl>
  )
}

export function DocumentForm({
  doc,
  canWrite,
  onDirtyChange,
}: {
  doc: DocumentRow
  canWrite: boolean
  onDirtyChange: (dirty: boolean) => void
}) {
  const save = useSaveDocument()
  const { data: clients = [] } = useClients()
  const form = useForm<DocumentValues>({ resolver: zodResolver(documentSchema), defaultValues: toValues(doc) })
  const lines = useFieldArray({ control: form.control, name: 'lines' })
  const { isDirty, isSubmitting } = form.formState

  // The parent remounts this form (key) when the saved document changes, so a background
  // refetch never wipes edits in progress.
  useEffect(() => onDirtyChange(isDirty), [isDirty, onDirtyChange])

  function pickClient(id: string) {
    form.setValue('client_id', id, { shouldDirty: true })
    const client = clients.find((c) => c.id === id)
    if (!client) return
    form.setValue('buyer_name', client.name ?? '', { shouldDirty: true })
    form.setValue('buyer_company', client.company ?? '', { shouldDirty: true })
    form.setValue('buyer_email', client.email ?? '', { shouldDirty: true })
    form.setValue('buyer_address', client.billing_address ?? '', { shouldDirty: true })
  }

  async function onSubmit(values: DocumentValues) {
    try {
      await save.mutateAsync({
        id: doc.id,
        values: {
          client_id: values.client_id === NO_CLIENT ? null : values.client_id,
          title: values.title || null,
          buyer_name: values.buyer_name || null,
          buyer_company: values.buyer_company || null,
          buyer_address: values.buyer_address.trim() || null,
          buyer_email: values.buyer_email || null,
          issue_date: values.issue_date,
          due_date: values.due_date || null,
          currency: values.currency,
          tax_rate: values.tax_rate,
          deposit_paid: values.deposit_paid,
          notes: values.notes.trim() || null,
          lines: values.lines as unknown as Json,
        },
      })
      toast.success('Draft saved.')
    } catch (error) {
      toast.error(dbErrorMessage(error))
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <fieldset disabled={!canWrite} className="space-y-6">
          <section className="space-y-3" aria-labelledby="doc-client">
            <h3 id="doc-client" className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              {doc.kind === 'quote' ? 'Prepared for' : 'Bill to'}
            </h3>
            <FormField
              control={form.control}
              name="client_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client</FormLabel>
                  <Select value={field.value} onValueChange={pickClient}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NO_CLIENT}>Not linked to a client</SelectItem>
                      {clients.map((c) => (
                        <SelectItem key={c.id!} value={c.id!}>
                          {c.name}
                          {c.company ? ` · ${c.company}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>Fills in the details below. You can still edit them for this document.</FormDescription>
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="buyer_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input autoComplete="off" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="buyer_company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company</FormLabel>
                    <FormControl>
                      <Input autoComplete="off" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="buyer_address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Billing address</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="buyer_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" autoComplete="off" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </section>

          <section className="space-y-3" aria-labelledby="doc-details">
            <h3 id="doc-details" className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Details
            </h3>
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Input placeholder="Gala dinner — close-up magic" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="issue_date"
                render={({ field }) => (
                  <FormItem>
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
                name="due_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{doc.kind === 'quote' ? 'Valid until' : 'Due date'}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormDescription>Empty = from your settings</FormDescription>
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
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>
          </section>

          <section className="space-y-3" aria-labelledby="doc-lines">
            <h3 id="doc-lines" className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Lines
            </h3>
            {lines.fields.length === 0 && (
              <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                Add what you are charging for: the performance, travel, extra time…
              </p>
            )}
            <ol className="space-y-3">
              {lines.fields.map((line, index) => (
                <li key={line.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 rounded-lg border p-3 sm:grid-cols-[minmax(0,1fr)_5rem_8rem_auto]">
                  <FormField
                    control={form.control}
                    name={`lines.${index}.description`}
                    render={({ field }) => (
                      <FormItem className="col-span-2 sm:col-span-1">
                        <FormLabel className="sr-only sm:not-sr-only">Description</FormLabel>
                        <FormControl>
                          <Input placeholder="Description" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="col-span-2 grid grid-cols-2 gap-2 sm:contents">
                    <FormField
                      control={form.control}
                      name={`lines.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Qty</FormLabel>
                          <FormControl>
                            <NumberInput decimals value={field.value} onChange={(v) => field.onChange(v ?? undefined)} min={0} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`lines.${index}.unit_price`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit price</FormLabel>
                          <FormControl>
                            <NumberInput decimals value={field.value} onChange={(v) => field.onChange(v ?? undefined)} min={0} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="col-start-2 row-start-1 self-start text-muted-foreground sm:col-start-auto sm:row-start-auto sm:mt-[1.4rem]"
                    onClick={() => lines.remove(index)}
                    aria-label={`Remove line ${index + 1}`}
                  >
                    <X aria-hidden="true" />
                  </Button>
                </li>
              ))}
            </ol>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => lines.append({ description: '', quantity: 1, unit_price: 0 })}
              disabled={lines.fields.length >= 50}
            >
              <Plus aria-hidden="true" /> Add a line
            </Button>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="tax_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>VAT rate (%)</FormLabel>
                    <FormControl>
                      <NumberInput decimals value={field.value} onChange={(v) => field.onChange(v ?? 0)} min={0} max={100} />
                    </FormControl>
                    <FormDescription>0 if you don't charge VAT.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {doc.kind === 'invoice' && (
                <FormField
                  control={form.control}
                  name="deposit_paid"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deposit already received</FormLabel>
                      <FormControl>
                        <NumberInput decimals value={field.value} onChange={(v) => field.onChange(v ?? 0)} min={0} />
                      </FormControl>
                      <FormDescription>Deducted from the amount due.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
            <Totals control={form.control} kind={doc.kind} />
          </section>

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes for the client</FormLabel>
                <FormControl>
                  <Textarea rows={3} placeholder="Thank you for your booking!" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </fieldset>

        {canWrite && (
          <div className="sticky bottom-0 -mx-5 flex justify-end gap-2 border-t bg-background/95 px-5 py-3 backdrop-blur">
            <Button type="button" variant="ghost" disabled={!isDirty || isSubmitting} onClick={() => form.reset(toValues(doc))}>
              Discard changes
            </Button>
            <Button type="submit" disabled={!isDirty || isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" aria-hidden="true" />}
              Save draft
            </Button>
          </div>
        )}
      </form>
    </Form>
  )
}
