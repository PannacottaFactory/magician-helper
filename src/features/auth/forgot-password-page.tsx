import { useState } from 'react'
import { Link } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, MailCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { appUrl } from '@/lib/env'
import { supabase } from '@/lib/supabase'
import { AuthLayout } from './auth-layout'
import { authErrorMessage } from './auth-errors'
import { forgotSchema, type ForgotValues } from './schemas'

export function ForgotPasswordPage() {
  const [sentTo, setSentTo] = useState<string | null>(null)
  const form = useForm<ForgotValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
  })

  async function onSubmit({ email }: ForgotValues) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: appUrl('/reset-password'),
    })
    if (error) {
      toast.error(authErrorMessage(error))
      return
    }
    setSentTo(email)
  }

  const backLink = (
    <Link to="/login" className="font-medium text-gold underline-offset-4 hover:underline">
      Back to sign in
    </Link>
  )

  if (sentTo) {
    return (
      <AuthLayout title="Check your inbox" footer={backLink}>
        <div className="flex flex-col items-center gap-4 text-center">
          <MailCheck className="size-10 text-gold" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">
            If an account exists for <strong className="text-foreground">{sentTo}</strong>, you'll receive a link to
            choose a new password. Open it on this device.
          </p>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Forgot your password?"
      description="Enter your email and we'll send you a reset link."
      footer={backLink}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" autoComplete="email" placeholder="you@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Loader2 className="animate-spin" aria-hidden="true" />}
            Send reset link
          </Button>
        </form>
      </Form>
    </AuthLayout>
  )
}
