import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Mail, MailCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { appUrl } from '@/lib/env'
import { supabase } from '@/lib/supabase'
import { AuthLayout } from './auth-layout'
import { authErrorMessage } from './auth-errors'
import { loginSchema, magicLinkSchema, type LoginValues, type MagicLinkValues } from './schemas'

export function LoginPage() {
  const [mode, setMode] = useState<'password' | 'magic'>('password')
  const [sentTo, setSentTo] = useState<string | null>(null)

  if (sentTo) {
    return (
      <AuthLayout title="Check your inbox" description={`We sent a sign-in link to ${sentTo}.`}>
        <div className="flex flex-col items-center gap-4 text-center">
          <MailCheck className="size-10 text-gold" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">
            Open the link on this device to sign in. It may take a minute to arrive — check your spam folder too.
          </p>
          <Button variant="outline" className="w-full" onClick={() => setSentTo(null)}>
            Back to sign in
          </Button>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Welcome back"
      description="Sign in to your repertoire."
      footer={
        <>
          New here?{' '}
          <Link to="/signup" className="font-medium text-gold underline-offset-4 hover:underline">
            Start your 14-day free trial
          </Link>
        </>
      }
    >
      {mode === 'password' ? <PasswordForm /> : <MagicLinkForm onSent={setSentTo} />}
      <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
      </div>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => setMode(mode === 'password' ? 'magic' : 'password')}
      >
        {mode === 'password' ? (
          <>
            <Mail aria-hidden="true" /> Email me a magic link
          </>
        ) : (
          'Sign in with a password'
        )}
      </Button>
    </AuthLayout>
  )
}

function PasswordForm() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/app'
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(values: LoginValues) {
    const { error } = await supabase.auth.signInWithPassword(values)
    if (error) {
      toast.error(authErrorMessage(error))
      return
    }
    navigate(from, { replace: true })
  }

  return (
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
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>Password</FormLabel>
                <Link
                  to="/forgot-password"
                  className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <FormControl>
                <Input type="password" autoComplete="current-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && <Loader2 className="animate-spin" aria-hidden="true" />}
          Sign in
        </Button>
      </form>
    </Form>
  )
}

function MagicLinkForm({ onSent }: { onSent: (email: string) => void }) {
  const form = useForm<MagicLinkValues>({
    resolver: zodResolver(magicLinkSchema),
    defaultValues: { email: '' },
  })

  async function onSubmit({ email }: MagicLinkValues) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: appUrl('/auth/callback'), shouldCreateUser: false },
    })
    if (error) {
      toast.error(authErrorMessage(error))
      return
    }
    onSent(email)
  }

  return (
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
          Send magic link
        </Button>
      </form>
    </Form>
  )
}
