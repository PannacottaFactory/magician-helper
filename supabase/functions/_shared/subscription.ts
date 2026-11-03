import type Stripe from 'npm:stripe@17.7.0'
import { admin, stripe } from './clients.ts'

/** Stripe subscription status → the 4 statuses stored in profiles (null = no access from Stripe). */
export function mapStatus(status: Stripe.Subscription.Status): string | null {
  switch (status) {
    case 'trialing':
    case 'active':
    case 'past_due':
      return status
    case 'canceled':
    case 'unpaid':
    case 'incomplete_expired':
    case 'paused':
      return 'canceled'
    default:
      return null // 'incomplete': first payment not done yet
  }
}

/** Finds the profile of a Stripe customer (metadata first, then stored id). */
async function findUserId(customerId: string, metadataUserId?: string | null): Promise<string | null> {
  if (metadataUserId) return metadataUserId
  const { data } = await admin.from('profiles').select('id').eq('stripe_customer_id', customerId).maybeSingle()
  if (data) return data.id as string
  const customer = await stripe.customers.retrieve(customerId)
  if (!customer.deleted && customer.metadata?.user_id) return customer.metadata.user_id
  return null
}

/**
 * Copies the current state of a subscription to the user's profile.
 * Always re-reads the subscription from Stripe, so events arriving out of
 * order or twice never leave a stale status.
 */
export async function syncSubscription(subscriptionId: string, userIdHint?: string | null) {
  const sub = await stripe.subscriptions.retrieve(subscriptionId)
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id
  const userId = await findUserId(customerId, userIdHint ?? sub.metadata?.user_id)
  if (!userId) {
    console.warn(`No user found for subscription ${subscriptionId}`)
    return
  }
  // current_period_end moved to subscription items in recent API versions
  const periodEnd =
    (sub as unknown as { current_period_end?: number }).current_period_end ??
    (sub.items?.data?.[0] as unknown as { current_period_end?: number } | undefined)?.current_period_end ??
    null

  const { error } = await admin
    .from('profiles')
    .update({
      stripe_customer_id: customerId,
      stripe_subscription_id: sub.id,
      subscription_status: mapStatus(sub.status),
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      cancel_at_period_end: sub.cancel_at_period_end,
    })
    .eq('id', userId)
  if (error) throw error
}
