import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarSync, Check, Copy, Loader2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { WriteButton } from '@/components/common/write-button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useUser } from '@/features/auth/auth-provider'
import { unwrap, dbErrorMessage } from '@/lib/db'
import { env } from '@/lib/env'
import { supabase } from '@/lib/supabase'

const feedKey = (userId: string) => ['calendar-feed', userId] as const

function useCalendarFeed() {
  const user = useUser()
  return useQuery({
    queryKey: feedKey(user.id),
    queryFn: () => unwrap(supabase.from('calendar_feeds').select('id, token').maybeSingle()),
  })
}

/** Creates the feed, or replaces it with a new secret (the old link stops working). */
function useResetFeed() {
  const user = useUser()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (mode: 'create' | 'reset' | 'off') => {
      if (mode !== 'create') await unwrap(supabase.from('calendar_feeds').delete().eq('user_id', user.id))
      if (mode === 'off') return null
      return unwrap(supabase.from('calendar_feeds').insert({}).select('id, token').single())
    },
    onSuccess: (data) => queryClient.setQueryData(feedKey(user.id), data),
  })
}

/** Subscription link for Google Calendar, Apple Calendar, Outlook… */
export function CalendarCard() {
  const { data: feed, isLoading } = useCalendarFeed()
  const reset = useResetFeed()
  const [copied, setCopied] = useState(false)
  const [confirm, setConfirm] = useState<'reset' | 'off' | null>(null)

  const httpsUrl = feed ? `${env.supabaseUrl}/functions/v1/calendar-feed?token=${feed.token}` : ''
  const webcalUrl = httpsUrl.replace(/^https?:\/\//, 'webcal://')
  const googleUrl = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcalUrl)}`

  function run(mode: 'create' | 'reset' | 'off') {
    reset.mutate(mode, {
      onSuccess: () =>
        toast.success(mode === 'create' ? 'Calendar link created.' : mode === 'reset' ? 'New link created — the old one no longer works.' : 'Calendar link turned off.'),
      onError: (e) => toast.error(dbErrorMessage(e)),
    })
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(httpsUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Could not copy. Select the link and copy it by hand.')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calendar sync</CardTitle>
        <CardDescription>
          See your gigs in Google Calendar, Apple Calendar or Outlook, next to everything else. They update on their own
          (calendar apps refresh every few hours).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <Skeleton className="h-9 w-full" />
        ) : !feed ? (
          <WriteButton onClick={() => run('create')} disabled={reset.isPending}>
            {reset.isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <CalendarSync aria-hidden="true" />}
            Create my calendar link
          </WriteButton>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="calendar-url">Your private calendar link</Label>
              <div className="flex gap-2">
                <Input id="calendar-url" readOnly value={httpsUrl} onFocus={(e) => e.currentTarget.select()} className="font-mono text-xs" />
                <Button type="button" variant="outline" onClick={copy} aria-label="Copy the calendar link">
                  {copied ? <Check className="text-success" aria-hidden="true" /> : <Copy aria-hidden="true" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Anyone with this link can see your gigs (titles, places and client names). Keep it to yourself.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <a href={googleUrl} target="_blank" rel="noopener noreferrer">
                  Add to Google Calendar<span className="sr-only"> (opens in a new tab)</span>
                </a>
              </Button>
              <Button asChild variant="outline" size="sm">
                <a href={webcalUrl}>Add to Apple Calendar / Outlook</a>
              </Button>
            </div>
            <details className="text-sm text-muted-foreground">
              <summary className="cursor-pointer rounded font-medium text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
                Adding it by hand
              </summary>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Google Calendar (computer): Other calendars → + → From URL → paste the link.</li>
                <li>iPhone: Settings → Calendar → Accounts → Add account → Other → Add subscribed calendar.</li>
                <li>Outlook: Add calendar → Subscribe from web.</li>
              </ul>
            </details>
            <div className="flex flex-wrap gap-2 border-t pt-4">
              <WriteButton variant="ghost" size="sm" onClick={() => setConfirm('reset')} disabled={reset.isPending}>
                <RefreshCw aria-hidden="true" /> Get a new link
              </WriteButton>
              <WriteButton variant="ghost" size="sm" onClick={() => setConfirm('off')} disabled={reset.isPending}>
                Turn off
              </WriteButton>
            </div>
          </>
        )}

        <AlertDialog open={confirm !== null} onOpenChange={(open) => !open && setConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{confirm === 'reset' ? 'Replace your calendar link?' : 'Turn off calendar sync?'}</AlertDialogTitle>
              <AlertDialogDescription>
                The current link stops working right away. Calendars subscribed to it will stop updating
                {confirm === 'reset' ? ' until you add the new link.' : '.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => confirm && run(confirm)}>
                {confirm === 'reset' ? 'Replace the link' : 'Turn off'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}
