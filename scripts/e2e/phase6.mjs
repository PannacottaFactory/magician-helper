// End-to-end test of billing (Stripe TEST mode only): Edge Functions + real webhook delivery.
// Needs SUPABASE_SERVICE_ROLE_KEY in the environment and STRIPE_SECRET_KEY (sk_test_) in .env.stripe.local.
import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL
const anonKey = process.env.VITE_SUPABASE_ANON_KEY
const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const sb = createClient(url, anonKey, { auth: { persistSession: false } })
const STRIPE_KEY = fs.readFileSync('.env.stripe.local', 'utf8').match(/^STRIPE_SECRET_KEY=(.*)$/m)?.[1]?.trim()
if (!STRIPE_KEY?.startsWith('sk_test_')) throw new Error('This test only runs with a Stripe TEST key')
const PRICE_ID = fs.readFileSync('.env.functions.local', 'utf8').match(/^STRIPE_PRICE_ID=(.*)$/m)?.[1]?.trim()

async function stripe(method, path, params = {}) {
  const body = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) body.append(k, String(v))
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method,
    headers: { Authorization: `Bearer ${STRIPE_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: method === 'GET' ? undefined : body,
  })
  const json = await res.json()
  if (!res.ok) throw new Error(`${path}: ${json.error?.message}`)
  return json
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
async function waitForStatus(userId, expected, timeoutMs = 40000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const { data } = await admin.from('profiles').select('subscription_status, current_period_end, cancel_at_period_end').eq('id', userId).single()
    if (expected(data)) return data
    await sleep(2000)
  }
  return null
}

let failures = 0
const check = (label, cond, extra = '') => {
  if (!cond) failures++
  console.log(cond ? 'ok  ' : 'FAIL', label, cond ? '' : extra ?? '')
}
let userId
let customerId
try {
  const email = `e2e-billing-${Date.now()}@example.com`
  const { data: created, error: ce } = await admin.auth.admin.createUser({ email, password: 'Test-password-123', email_confirm: true })
  if (ce) throw ce
  userId = created.user.id
  const { data: session } = await sb.auth.signInWithPassword({ email, password: 'Test-password-123' })
  const token = session.session.access_token
  const call = (name, body = {}, origin = 'https://pannacottafactory.github.io') =>
    fetch(`${url}/functions/v1/${name}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, apikey: anonKey, 'Content-Type': 'application/json', Origin: origin },
      body: JSON.stringify(body),
    })

  const noAuth = await fetch(`${url}/functions/v1/create-checkout-session`, { method: 'POST', headers: { apikey: anonKey } })
  check('checkout refuses anonymous calls', noAuth.status === 401, noAuth.status)

  const preflight = await fetch(`${url}/functions/v1/create-checkout-session`, { method: 'OPTIONS', headers: { Origin: 'http://localhost:5173', 'Access-Control-Request-Method': 'POST' } })
  check('CORS allows local dev origin', preflight.headers.get('access-control-allow-origin') === 'http://localhost:5173')

  const res = await call('create-checkout-session')
  const checkout = await res.json()
  check('create-checkout-session returns a Stripe URL', res.ok && checkout.url?.startsWith('https://checkout.stripe.com'), JSON.stringify(checkout))

  const { data: prof } = await admin.from('profiles').select('stripe_customer_id, trial_ends_at').eq('id', userId).single()
  customerId = prof.stripe_customer_id
  check('Stripe customer stored on profile', customerId?.startsWith('cus_'))

  const fake = await fetch(`${url}/functions/v1/stripe-webhook`, { method: 'POST', headers: { 'stripe-signature': 't=1,v1=forged' }, body: '{}' })
  check('webhook rejects forged signature', fake.status === 400, fake.status)

  // Simulate what Checkout does: card + subscription with the trial aligned on the app trial
  const pm = await stripe('POST', `payment_methods/pm_card_visa/attach`, { customer: customerId })
  await stripe('POST', `customers/${customerId}`, { 'invoice_settings[default_payment_method]': pm.id })
  const sub = await stripe('POST', 'subscriptions', {
    customer: customerId,
    'items[0][price]': PRICE_ID,
    'metadata[user_id]': userId,
    trial_end: Math.floor(new Date(prof.trial_ends_at).getTime() / 1000),
  })
  const trialing = await waitForStatus(userId, (p) => p?.subscription_status === 'trialing')
  check('real webhook delivery → status trialing', !!trialing, JSON.stringify(trialing))
  check('current_period_end synced', !!trialing?.current_period_end)

  const portalRes = await call('create-portal-session')
  const portal = await portalRes.json()
  check('create-portal-session returns a portal URL', portalRes.ok && portal.url?.startsWith('https://billing.stripe.com'), JSON.stringify(portal))

  const again = await call('create-checkout-session')
  check('second checkout refused while subscribed', again.status === 409, again.status)

  await stripe('POST', `subscriptions/${sub.id}`, { cancel_at_period_end: 'true' })
  const canceling = await waitForStatus(userId, (p) => p?.cancel_at_period_end === true)
  check('cancel at period end synced', !!canceling)

  await stripe('DELETE', `subscriptions/${sub.id}`)
  const canceled = await waitForStatus(userId, (p) => p?.subscription_status === 'canceled')
  check('immediate cancel → status canceled', !!canceled)

  const badDelete = await call('delete-account', { confirm: 'nope' })
  check('delete-account requires confirmation', badDelete.status === 400)
  const del = await call('delete-account', { confirm: 'DELETE' })
  check('delete-account succeeds', del.ok, await del.text())
  const { data: gone } = await admin.auth.admin.getUserById(userId)
  check('auth user deleted', !gone?.user)
  const cust = await stripe('GET', `customers/${customerId}`)
  check('Stripe customer deleted', cust.deleted === true)
  if (!gone?.user) userId = null
} catch (e) {
  failures++
  console.log('FAIL exception', e.message)
} finally {
  if (userId) {
    await admin.auth.admin.deleteUser(userId)
    console.log('ok   leftover test user deleted')
  }
}
process.exit(failures ? 1 : 0)
