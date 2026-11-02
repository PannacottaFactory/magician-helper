import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, Loader2, MailCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { appUrl } from '@/lib/env'
import { supabase } from '@/lib/supabase'
import { AuthLayout } from './auth-layout'
import { authErrorMessage } from './auth-errors'
import { signupSchema, type SignupValues } from './schemas'

const perks = ['14 days free, no credit card', 'Your data stays private', 'Export everything, anytime']

export function SignupPage() {
  const navigate = useNavigate()
  const [sentTo, setSentTo] = useState<string | null>(null)
  const form = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { displayName: '', email: '', password: '' },
  })

  async function onSubmit(values: SignupValues) {
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        emailRedirectTo: appUrl('/auth/callback'),
        data: { display_name: values.displayName || null },
      },
    })
    if (error) {
      toast.error(authErrorMessage(error))
      return
    }
    // If email confirmation is disabled in Supabase, the user is signed in right away.
    if (data.session) {
      toast.success('Welcome to Magician Helper! Your 14-day trial has started.')
      navigate('/app', { replace: true })
    } else {
      setSentTo(values.email)
    }
  }

  if (sentTo) {
    return (
      <AuthLayout title="Confirm your email" description={`We sent a confirmation link to ${sentTo}.`}>
        <div className="flex flex-col items-center gap-4 text-center">
          <MailCheck className="size-10 text-gold" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">
            Click the link to activate your account and start your free trial.
          </p>
          <Button asChild variant="outline" className="w-full">
            <Link to="/login">Back to sign in</Link>
          </Button>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Start your free trial"
      description="Organize your magic in minutes."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-gold underline-offset-4 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <ul className="mb-6 space-y-1.5">
        {perks.map((perk) => (
          <li key={perk} className="flex items-center gap-2 text-sm text-muted-foreground">
            <Check className="size-4 text-gold" aria-hidden="true" /> {perk}
          </li>
        ))}
      </ul>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormField
            control={form.control}
            name="displayName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stage name (optional)</FormLabel>
                <FormControl>
                  <Input autoComplete="nickname" placeholder="The Great Zoltan" {...field} />
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
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" autoComplete="new-password" {...field} />
                </FormControl>
                <FormDescription>At least 8 characters.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Loader2 className="animate-spin" aria-hidden="true" />}
            Create my account
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            By signing up you agree to our{' '}
            <Link to="/terms" className="underline underline-offset-4 hover:text-foreground">
              Terms
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="underline underline-offset-4 hover:text-foreground">
              Privacy Policy
            </Link>
            .
          </p>
        </form>
      </Form>
    </AuthLayout>
  )
}
