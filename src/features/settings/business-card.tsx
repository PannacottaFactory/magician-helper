import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { NumberInput } from '@/components/common/number-input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { useBusinessProfile, useSaveBusinessProfile, type BusinessProfile } from '@/features/documents/api'
import { useAccess } from '@/features/profile/api'
import { dbErrorMessage } from '@/lib/db'

const schema = z.object({
  business_name: z.string().trim().max(200, 'Too long'),
  address: z.string().max(1000, 'Too long'),
  email: z.union([z.literal(''), z.string().trim().email('Enter a valid email').max(320)]),
  phone: z.string().trim().max(50, 'Too long'),
  website: z.string().trim().max(500, 'Too long'),
  tax_id: z.string().trim().max(200, 'Too long'),
  default_tax_rate: z.number({ message: 'Required' }).min(0, 'Between 0 and 100').max(100, 'Between 0 and 100'),
  payment_terms_days: z.number({ message: 'Required' }).int().min(0, '0 to 365 days').max(365, '0 to 365 days'),
  quote_validity_days: z.number({ message: 'Required' }).int().min(1, '1 to 365 days').max(365, '1 to 365 days'),
  payment_instructions: z.string().max(1000, 'Too long'),
  legal_note: z.string().max(1000, 'Too long'),
})
type Values = z.infer<typeof schema>

function toValues(p: BusinessProfile | null | undefined): Values {
  return {
    business_name: p?.business_name ?? '',
    address: p?.address ?? '',
    email: p?.email ?? '',
    phone: p?.phone ?? '',
    website: p?.website ?? '',
    tax_id: p?.tax_id ?? '',
    default_tax_rate: Number(p?.default_tax_rate ?? 0),
    payment_terms_days: p?.payment_terms_days ?? 30,
    quote_validity_days: p?.quote_validity_days ?? 30,
    payment_instructions: p?.payment_instructions ?? '',
    legal_note: p?.legal_note ?? '',
  }
}

const orNull = (v: string) => v.trim() || null

/** Seller details printed on quotes and invoices. */
export function BusinessCard() {
  const { data: profile, isLoading } = useBusinessProfile()
  const save = useSaveBusinessProfile()
  const { canWrite } = useAccess()
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: toValues(null) })

  useEffect(() => {
    if (!isLoading) form.reset(toValues(profile))
  }, [profile, isLoading, form])

  async function onSubmit(v: Values) {
    try {
      await save.mutateAsync({
        business_name: orNull(v.business_name),
        address: orNull(v.address),
        email: orNull(v.email),
        phone: orNull(v.phone),
        website: orNull(v.website),
        tax_id: orNull(v.tax_id),
        default_tax_rate: v.default_tax_rate,
        payment_terms_days: v.payment_terms_days,
        quote_validity_days: v.quote_validity_days,
        payment_instructions: orNull(v.payment_instructions),
        legal_note: orNull(v.legal_note),
      })
      toast.success('Business details saved.')
    } catch (error) {
      toast.error(dbErrorMessage(error))
    }
  }

  const text = (name: keyof Values, label: string, props: { placeholder?: string; type?: string; description?: string } = {}) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input type={props.type} placeholder={props.placeholder} {...field} value={field.value as string} />
          </FormControl>
          {props.description && <FormDescription>{props.description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
  const area = (name: keyof Values, label: string, placeholder: string, description?: string) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Textarea rows={3} placeholder={placeholder} {...field} value={field.value as string} />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
  const number = (name: 'default_tax_rate' | 'payment_terms_days' | 'quote_validity_days', label: string, decimals = false) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <NumberInput decimals={decimals} value={field.value} onChange={(v) => field.onChange(v ?? 0)} min={0} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )

  return (
    <Card id="business" className="scroll-mt-20">
      <CardHeader>
        <CardTitle>Business details</CardTitle>
        <CardDescription>
          Printed on your quotes and invoices. Each finalized document keeps the details it was issued with.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <fieldset disabled={!canWrite} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {text('business_name', 'Business or stage name', { placeholder: 'Alex Marlowe Magic' })}
                  {text('tax_id', 'Tax / registration number', { placeholder: 'SIRET 123 456 789 00012', description: 'SIRET, VAT number, company number…' })}
                </div>
                {area('address', 'Address', '8 avenue Foch\n69006 Lyon, France')}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {text('email', 'Email', { type: 'email' })}
                  {text('phone', 'Phone')}
                  {text('website', 'Website')}
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {number('default_tax_rate', 'Default VAT rate (%)', true)}
                  {number('payment_terms_days', 'Payment terms (days)')}
                  {number('quote_validity_days', 'Quotes valid for (days)')}
                </div>
                {area('payment_instructions', 'Payment instructions', 'Bank transfer — IBAN FR76 …  BIC …', 'Shown on invoices.')}
                {area(
                  'legal_note',
                  'Legal mentions',
                  'VAT not applicable, art. 293 B of the French tax code. Late payment penalty: 3× the legal interest rate; fixed recovery fee: €40.',
                  'Small print at the bottom of every document. Check what your country requires.',
                )}
                <div className="flex justify-end">
                  <Button type="submit" disabled={form.formState.isSubmitting || !form.formState.isDirty}>
                    {form.formState.isSubmitting && <Loader2 className="animate-spin" aria-hidden="true" />}
                    Save
                  </Button>
                </div>
              </fieldset>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  )
}
