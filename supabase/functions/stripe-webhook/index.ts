// Receives Stripe events and keeps profiles.subscription_status in sync.
// Deployed with --no-verify-jwt: Stripe does not send a Supabase token; the
// request is authenticated by verifying the Stripe signature instead.
import Stripe from 'npm:stripe@17.7.0'
import { admin, stripe } from '../_shared/clients.ts'
import { syncSubscription } from '../_shared/subscription.ts'

const WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? ''
const cryptoProvider = Stripe.createSubtleCryptoProvider()

const HANDLED = new Set([
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'customer.subscription.paused',
  'customer.subscription.resumed',
  'invoice.paid',
  'invoice.payment_failed',
])

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  const signature = req.headers.get('stripe-signature')
  if (!signature) return new Response('Missing signature', { status: 400 })

  let event: Stripe.Event
  try {
    const body = await req.text()
    event = await stripe.webhooks.constructEventAsync(body, signature, WEBHOOK_SECRET, undefined, cryptoProvider)
  } catch (error) {
    console.error('Invalid signature', error)
    return new Response('Invalid signature', { status: 400 })
  }

  if (!HANDLED.has(event.type)) return new Response('ignored', { status: 200 })

  // Idempotency: skip events already processed
  const { data: seen } = await admin.from('stripe_events').select('id').eq('id', event.id).maybeSingle()
  if (seen) return new Response('duplicate', { status: 200 })

  try {
    const object = event.data.object as unknown as Record<string, unknown>
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode === 'subscription' && session.subscription) {
          const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id
          await syncSubscription(subscriptionId, session.client_reference_id)
        }
        break
      }
      case 'invoice.paid':
      case 'invoice.payment_failed': {
        // the subscription id moved under invoice.parent in recent API versions
        const invoice = object as {
          subscription?: string | { id: string } | null
          parent?: { subscription_details?: { subscription?: string } }
        }
        const sub = invoice.subscription ?? invoice.parent?.subscription_details?.subscription
        const subscriptionId = typeof sub === 'string' ? sub : sub?.id
        if (subscriptionId) await syncSubscription(subscriptionId)
        break
      }
      default: {
        // customer.subscription.*
        await syncSubscription((event.data.object as Stripe.Subscription).id)
      }
    }
    await admin.from('stripe_events').insert({ id: event.id, type: event.type })
    return new Response('ok', { status: 200 })
  } catch (error) {
    console.error(`Failed to process ${event.type}`, error)
    // 500 → Stripe retries later
    return new Response('Processing error', { status: 500 })
  }
})
