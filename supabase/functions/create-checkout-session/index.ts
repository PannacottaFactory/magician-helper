// Creates a Stripe Checkout session for the monthly subscription and returns its URL.
// If the user still has free-trial days, Stripe's trial ends on the same date:
// the first payment only happens when the 14 days are over.
import { corsHeaders, json, returnBase } from '../_shared/cors.ts'
import { admin, getProfile, getUser, stripe } from '../_shared/clients.ts'

const PRICE_ID = Deno.env.get('STRIPE_PRICE_ID') ?? ''
const MIN_TRIAL_MS = 48 * 60 * 60 * 1000 // Stripe requires trial_end ≥ 48 h in the future

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) })
  if (req.method !== 'POST') return json(req, { error: 'Method not allowed' }, 405)

  try {
    const user = await getUser(req)
    if (!user) return json(req, { error: 'Not signed in' }, 401)
    if (!PRICE_ID) return json(req, { error: 'Billing is not configured yet' }, 500)

    const profile = await getProfile(user.id)
    if (['active', 'trialing', 'past_due'].includes(profile.subscription_status ?? '')) {
      return json(req, { error: 'already_subscribed' }, 409)
    }

    // One Stripe customer per user, created on first checkout
    let customerId = profile.stripe_customer_id
    if (customerId) {
      // customers created before English was enforced
      await stripe.customers.update(customerId, { preferred_locales: ['en'] })
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        // receipts and Stripe emails in English
        preferred_locales: ['en'],
        metadata: { user_id: user.id },
      })
      customerId = customer.id
      const { error } = await admin.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id)
      if (error) throw error
    }

    const trialLeft = new Date(profile.trial_ends_at).getTime() - Date.now()
    const base = returnBase(req)
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      locale: 'en',
      customer: customerId,
      client_reference_id: user.id,
      line_items: [{ price: PRICE_ID, quantity: 1 }],
      subscription_data: {
        metadata: { user_id: user.id },
        ...(trialLeft > MIN_TRIAL_MS ? { trial_end: Math.floor(new Date(profile.trial_ends_at).getTime() / 1000) } : {}),
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      success_url: `${base}/app/billing?checkout=success`,
      cancel_url: `${base}/app/billing?checkout=canceled`,
    })

    return json(req, { url: session.url })
  } catch (error) {
    console.error(error)
    return json(req, { error: error instanceof Error ? error.message : 'Unexpected error' }, 500)
  }
})
