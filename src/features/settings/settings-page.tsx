import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FileArchive, FileJson, Loader2, Monitor, Moon, Sun } from 'lucide-react'
import { NumberInput } from '@/components/common/number-input'
import { exportCsvZip, exportJson } from '@/lib/export'
import { pluralize } from '@/lib/format'
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
import { CURRENCIES } from '@/lib/constants'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
        <CurrencyCard />
        <PracticeCard />
        <ThemeCard />
        <DataCard />
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

function CurrencyCard() {
  const { data: profile } = useProfile()
  const update = useUpdateProfile()
  return (
    <Card>
      <CardHeader>
        <CardTitle>Currency</CardTitle>
        <CardDescription>Default currency for new gigs and inventory costs.</CardDescription>
      </CardHeader>
      <CardContent>
        <Select
          value={profile?.currency ?? 'EUR'}
          onValueChange={(currency) =>
            update.mutate(
              { currency },
              {
                onSuccess: () => toast.success(`Default currency set to ${currency}.`),
                onError: () => toast.error('Could not save your currency.'),
              },
            )
          }
        >
          <SelectTrigger className="w-full sm:w-72" aria-label="Default currency">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CURRENCIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  )
}

function PracticeCard() {
  const { data: profile } = useProfile()
  const update = useUpdateProfile()
  const [days, setDays] = useState<number | null>(null)
  const value = days ?? profile?.stale_trick_days ?? 14

  function save() {
    if (!value || value < 1 || value > 365 || value === profile?.stale_trick_days) return
    update.mutate(
      { stale_trick_days: value },
      {
        onSuccess: () => toast.success('Practice reminder updated.'),
        onError: () => toast.error('Could not save this setting.'),
      },
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Practice reminders</CardTitle>
        <CardDescription>The dashboard lists tricks you haven't practiced for this many days.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <label htmlFor="stale-days" className="sr-only">
            Days without practice
          </label>
          <NumberInput id="stale-days" min={1} max={365} className="w-24" value={value} onChange={setDays} onBlur={save} />
          <span className="text-sm text-muted-foreground">days without practice</span>
        </div>
      </CardContent>
    </Card>
  )
}

function DataCard() {
  const [busy, setBusy] = useState<'json' | 'csv' | null>(null)

  async function run(kind: 'json' | 'csv') {
    setBusy(kind)
    try {
      const count = kind === 'json' ? await exportJson() : await exportCsvZip()
      toast.success(`Export ready — ${pluralize(count, 'record')}.`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Export failed.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your data</CardTitle>
        <CardDescription>
          Download everything you've entered — tricks, routines, practice, gigs, clients, inventory and ideas. Available
          at any time, even after your trial.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 sm:flex-row">
        <Button variant="outline" onClick={() => run('json')} disabled={busy !== null}>
          {busy === 'json' ? <Loader2 className="animate-spin" aria-hidden="true" /> : <FileJson aria-hidden="true" />}
          Export JSON
        </Button>
        <Button variant="outline" onClick={() => run('csv')} disabled={busy !== null}>
          {busy === 'csv' ? <Loader2 className="animate-spin" aria-hidden="true" /> : <FileArchive aria-hidden="true" />}
          Export CSV (zip)
        </Button>
      </CardContent>
    </Card>
  )
}
