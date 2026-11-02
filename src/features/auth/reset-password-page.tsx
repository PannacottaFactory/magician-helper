import { Link, useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { FullPageLoader } from '@/components/common/full-page-loader'
import { supabase } from '@/lib/supabase'
import { AuthLayout } from './auth-layout'
import { authErrorMessage } from './auth-errors'
import { useAuth } from './auth-provider'
import { resetSchema, type ResetValues } from './schemas'

/**
 * Landing page of the "reset password" email link. Supabase exchanges the
 * `?code=` for a session automatically; then the user picks a new password.
 */
export function ResetPasswordPage() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const form = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: '', confirm: '' },
  })

  async function onSubmit({ password }: ResetValues) {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      toast.error(authErrorMessage(error))
      return
    }
    toast.success('Password updated.')
    navigate('/app', { replace: true })
  }

  if (loading) return <FullPageLoader />

  if (!user) {
    return (
      <AuthLayout
        title="Link expired or invalid"
        description="This reset link can't be used anymore. Links expire after one hour and must be opened in the browser where you requested them."
      >
        <Button asChild className="w-full">
          <Link to="/forgot-password">Request a new link</Link>
        </Button>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Choose a new password" description={`For ${user.email}`}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New password</FormLabel>
                <FormControl>
                  <Input type="password" autoComplete="new-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm password</FormLabel>
                <FormControl>
                  <Input type="password" autoComplete="new-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Loader2 className="animate-spin" aria-hidden="true" />}
            Update password
          </Button>
        </form>
      </Form>
    </AuthLayout>
  )
}
