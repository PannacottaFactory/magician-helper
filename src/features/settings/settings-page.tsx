import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Monitor, Moon, Sun } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useUser } from '@/features/auth/auth-provider'
import { useProfile, useUpdateProfile } from '@/features/profile/api'
import { useTheme, type Theme } from '@/hooks/use-theme'
import { cn } from '@/lib/utils'

const profileSchema = z.object({
  display_name: z.string().trim().max(100, 'Too long'),
})
type ProfileValues = z.infer<typeof profileSchema>

const themes: { value: Theme; label: string; icon: typeof Moon }[] = [
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'system', label: 'System', icon: Monitor },
]

export function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" description="Your profile and preferences." />
      <div className="grid max-w-2xl gap-6">
        <ProfileCard />
        <ThemeCard />
      </div>
    </>
  )
}

function ProfileCard() {
  const user = useUser()
  const { data: profile, isLoading } = useProfile()
  const update = useUpdateProfile()
  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { display_name: '' },
  })

  useEffect(() => {
    if (profile) form.reset({ display_name: profile.display_name ?? '' })
  }, [profile, form])

  async function onSubmit(values: ProfileValues) {
    try {
      await update.mutateAsync({ display_name: values.display_name || null })
      toast.success('Profile saved.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save your profile.')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Signed in as {user.email}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <FormField
                control={form.control}
                name="display_name"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Stage name</FormLabel>
                    <FormControl>
                      <Input placeholder="The Great Zoltan" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={form.formState.isSubmitting || !form.formState.isDirty}>
                {form.formState.isSubmitting && <Loader2 className="animate-spin" aria-hidden="true" />}
                Save
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  )
}

function ThemeCard() {
  const { theme, setTheme } = useTheme()
  const update = useUpdateProfile()

  function choose(value: Theme) {
    setTheme(value)
    update.mutate({ theme: value }, { onError: () => toast.error('Could not save your theme preference.') })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>Matte black is the house style, but the stage lights are yours.</CardDescription>
      </CardHeader>
      <CardContent>
        <div role="radiogroup" aria-label="Theme" className="grid grid-cols-3 gap-3">
          {themes.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={theme === value}
              onClick={() => choose(value)}
              className={cn(
                'flex flex-col items-center gap-2 rounded-xl border p-4 text-sm transition-colors',
                'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                theme === value ? 'border-gold bg-accent text-accent-foreground' : 'hover:bg-muted',
              )}
            >
              <Icon className={cn('size-5', theme === value ? 'text-gold' : 'text-muted-foreground')} aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
