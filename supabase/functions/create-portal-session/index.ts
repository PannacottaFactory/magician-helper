// Opens the Stripe Customer Portal (update card, invoices, cancel) and returns its URL.
import { corsHeaders, json, returnBase } from '../_shared/cors.ts'
import { getProfile, getUser, stripe } from '../_shared/clients.ts'

const PORTAL_CONFIGURATION = Deno.env.get('STRIPE_PORTAL_CONFIGURATION') || undefined

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) })
  if (req.method !== 'POST') return json(req, { error: 'Method not allowed' }, 405)

  try {
    const user = await getUser(req)
    if (!user) return json(req, { error: 'Not signed in' }, 401)

    const profile = await getProfile(user.id)
    if (!profile.stripe_customer_id) return json(req, { error: 'no_customer' }, 404)

    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      locale: 'en',
      return_url: `${returnBase(req)}/app/billing`,
      ...(PORTAL_CONFIGURATION ? { configuration: PORTAL_CONFIGURATION } : {}),
    })
    return json(req, { url: session.url })
  } catch (error) {
    console.error(error)
    return json(req, { error: error instanceof Error ? error.message : 'Unexpected error' }, 500)
  }
})
