import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, CalendarClock, Check, CreditCard, ExternalLink, Hourglass, Loader2, Lock, ShieldCheck, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useUser } from '@/features/auth/auth-provider'
import { getAccess, profileKey, useProfile, type Profile } from '@/features/profile/api'
import { useNow } from '@/hooks/use-now'
import { env } from '@/lib/env'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useOpenPortal, useStartCheckout } from './api'

const FEATURES = [
  'Unlimited tricks, routines, ideas and props',
  'Practice log with timer and streaks',
  'Gigs, calendar, clients and payment tracking',
  'Automatic preparation checklists',
  'Photos & files for your props',
  'Export all your data anytime',
]

type Plan = {
  label: string
  tone: string
  icon: typeof Check
  headline: string
  detail?: string
}

function describePlan(profile: Profile, now: number): Plan {
  const access = getAccess(profile)
  const status = profile.subscription_status
  const periodEnd = profile.current_period_end ? formatDate(profile.current_period_end) : null
  if (status === 'active') {
    return profile.cancel_at_period_end
      ? {
          label: 'Canceling',
          tone: 'border-warning/50 bg-warning/10 text-warning',
          icon: CalendarClock,
          headline: 'Your subscription is canceled',
          detail: periodEnd ? `You keep full access until ${periodEnd}. You can resume it anytime before then.` : undefined,
        }
      : {
          label: 'Active',
          tone: 'border-success/40 bg-success/10 text-success',
          icon: ShieldCheck,
          headline: 'You are subscribed — thank you!',
          detail: periodEnd ? `Next renewal on ${periodEnd}.` : undefined,
        }
  }
  if (status === 'trialing') {
    return {
      label: 'Subscribed',
      tone: 'border-success/40 bg-success/10 text-success',
      icon: ShieldCheck,
      headline: 'Subscribed — enjoy the rest of your free trial',
      detail: periodEnd
        ? profile.cancel_at_period_end
          ? `Your subscription will end on ${periodEnd}, before the first payment.`
          : `Your first payment will be taken on ${periodEnd}.`
        : undefined,
    }
  }
  if (status === 'past_due') {
    return {
      label: 'Payment issue',
      tone: 'border-destructive/50 bg-destructive/10 text-destructive',
      icon: AlertTriangle,
      headline: 'Your last payment failed',
      detail: 'Stripe will retry automatically. Update your card to avoid losing edit access.',
    }
  }
  if (access.onTrial) {
    const ends = new Date(profile.trial_ends_at)
    return {
      label: 'Free trial',
      tone: 'border-gold/50 bg-gold/10 text-gold',
      icon: Hourglass,
      headline: `${access.trialDaysLeft} day${access.trialDaysLeft === 1 ? '' : 's'} left in your free trial`,
      detail: `Trial ends on ${formatDate(ends)}${ends.getTime() - now < 2 * 86_400_000 ? '' : '. Subscribe now and you will only be charged when it ends'}.`,
    }
  }
  return {
    label: 'Read-only',
    tone: 'border-border bg-muted text-muted-foreground',
    icon: Lock,
    headline: status === 'canceled' ? 'Your subscription has ended' : 'Your free trial has ended',
    detail: 'Your data is safe and you can still view and export it. Subscribe to create and edit again.',
  }
}

export function BillingPage() {
  const user = useUser()
  const now = useNow()
  const queryClient = useQueryClient()
  const { data: profile, isLoading, refetch } = useProfile()
  const checkout = useStartCheckout()
  const portal = useOpenPortal()
  const [params, setParams] = useSearchParams()
  const handled = useRef(false)
  const pollRef = useRef<number | undefined>(undefined)

  // stop polling when leaving the page
  useEffect(() => () => window.clearInterval(pollRef.current), [])

  // Back from Stripe Checkout: the webhook may take a few seconds → poll the profile
  useEffect(() => {
    const result = params.get('checkout')
    if (!result || handled.current) return
    handled.current = true
    setParams({}, { replace: true })
    if (result === 'canceled') {
      toast('Checkout canceled — no payment was made.')
      return
    }
    toast.success('Thank you! Activating your subscription…')
    let tries = 0
    pollRef.current = window.setInterval(async () => {
      tries++
      const { data } = await refetch()
      if (['active', 'trialing'].includes(data?.subscription_status ?? '') || tries >= 15) {
        window.clearInterval(pollRef.current)
        void queryClient.invalidateQueries({ queryKey: profileKey(user.id) })
        if (tries < 15) toast.success('Your subscription is active.')
      }
    }, 2000)
  }, [params, setParams, refetch, queryClient, user.id])

  function onError(error: unknown) {
    const message = error instanceof Error ? error.message : 'Something went wrong.'
    toast.error(message === 'already_subscribed' ? 'You are already subscribed.' : message)
  }

  if (isLoading || !profile) {
    return (
      <>
        <PageHeader title="Billing" description="Your plan and payments." />
        <Skeleton className="h-56 max-w-2xl" />
      </>
    )
  }

  const plan = describePlan(profile, now)
  const Icon = plan.icon
  const subscribed = ['active', 'trialing', 'past_due'].includes(profile.subscription_status ?? '')
  const pending = checkout.isPending || portal.isPending

  return (
    <>
      <PageHeader title="Billing" description="Your plan and payments." />
      <div className="grid max-w-4xl gap-6 lg:grid-cols-[1fr_20rem]">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={cn('gap-1.5', plan.tone)}>
                <Icon className="size-3.5" aria-hidden="true" /> {plan.label}
              </Badge>
            </div>
            <CardTitle className="font-display text-2xl">{plan.headline}</CardTitle>
            {plan.detail && <CardDescription>{plan.detail}</CardDescription>}
          </CardHeader>
          <CardContent className="space-y-4">
            {subscribed ? (
              <>
                <Button onClick={() => portal.mutate(undefined, { onError })} disabled={pending}>
                  {portal.isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <CreditCard aria-hidden="true" />}
                  Manage subscription
                </Button>
                <p className="text-xs text-muted-foreground">
                  Update your card, download invoices or cancel — securely on Stripe.
                </p>
              </>
            ) : (
              <>
                <Button size="lg" onClick={() => checkout.mutate(undefined, { onError })} disabled={pending}>
                  {checkout.isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Sparkles aria-hidden="true" />}
                  Subscribe — {env.priceLabel}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Secure payment by Stripe. Cancel anytime in two clicks.
                </p>
                {profile.stripe_customer_id && (
                  <Button variant="link" className="h-auto p-0 text-xs" onClick={() => portal.mutate(undefined, { onError })} disabled={pending}>
                    <ExternalLink className="size-3" aria-hidden="true" /> Past invoices
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-gold/30">
          <CardHeader>
            <CardTitle>Magician Helper</CardTitle>
            <CardDescription>
              <span className="font-display text-3xl font-semibold text-foreground">{env.priceLabel.split('/')[0]}</span>
              <span className="text-muted-foreground"> / month</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {FEATURES.map((f) => (
                <li key={f} className="flex gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden="true" /> {f}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
