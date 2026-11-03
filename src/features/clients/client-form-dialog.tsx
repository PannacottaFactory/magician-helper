import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { optionalUrl } from '@/features/inventory/schemas'
import { dbErrorMessage } from '@/lib/db'
import { useSaveClient, type Client } from './api'

const clientSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(200, 'Too long'),
  company: z.string().trim().max(200, 'Too long'),
  email: z.union([z.literal(''), z.string().trim().email('Enter a valid email').max(320)]),
  phone: z.string().trim().max(50, 'Too long'),
  contact_link: optionalUrl,
  billing_address: z.string().max(1000, 'Too long'),
  notes: z.string().max(20_000),
})
type ClientValues = z.infer<typeof clientSchema>

function toValues(client?: Client | null, defaultName = ''): ClientValues {
  return {
    name: client?.name ?? defaultName,
    company: client?.company ?? '',
    email: client?.email ?? '',
    phone: client?.phone ?? '',
    contact_link: client?.contact_link ?? '',
    billing_address: client?.billing_address ?? '',
    notes: client?.notes ?? '',
  }
}

export function ClientFormDialog({
  open,
  onOpenChange,
  client,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  client?: Client | null
  onSaved?: (client: Client) => void
}) {
  const save = useSaveClient()
  const form = useForm<ClientValues>({ resolver: zodResolver(clientSchema), defaultValues: toValues(client) })

  useEffect(() => {
    if (open) form.reset(toValues(client))
  }, [open, client, form])

  async function onSubmit(values: ClientValues) {
    try {
      const saved = await save.mutateAsync({
        id: client?.id,
        values: {
          name: values.name,
          company: values.company || null,
          email: values.email || null,
          phone: values.phone || null,
          contact_link: values.contact_link || null,
          billing_address: values.billing_address.trim() || null,
          notes: values.notes || null,
        },
      })
      toast.success(client ? 'Client updated.' : `${saved.name} added to your clients.`)
      onSaved?.(saved)
      onOpenChange(false)
    } catch (error) {
      toast.error(dbErrorMessage(error))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{client ? 'Edit client' : 'New client'}</DialogTitle>
          <DialogDescription>The person or company who books you.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Jane Doe" autoComplete="off" autoFocus {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company</FormLabel>
                    <FormControl>
                      <Input placeholder="Acme Inc." autoComplete="off" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" autoComplete="off" placeholder="jane@acme.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input type="tel" autoComplete="off" placeholder="+33 6 12 34 56 78" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="contact_link"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link (website, LinkedIn, Instagram…)</FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="https://…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="billing_address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Billing address</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder={'12 rue de la Paix\n75002 Paris'} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="How you met, preferences, billing details…" {...field} />
                  </FormControl>
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
                {client ? 'Save changes' : 'Add client'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
