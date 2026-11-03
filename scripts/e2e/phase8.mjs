// End-to-end API test for phase 8 (business profile, quotes & invoices, calendar feed).
// Usage: same as phase2.mjs (needs SUPABASE_SERVICE_ROLE_KEY in the environment).
import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL
const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const sb = createClient(url, process.env.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: false } })
let failures = 0
const check = (label, cond, extra = '') => {
  if (!cond) failures++
  console.log(cond ? 'ok  ' : 'FAIL', label, cond ? '' : extra ?? '')
}
let userId
try {
  const email = `e2e-${Date.now()}@example.com`
  const { data: created, error: ce } = await admin.auth.admin.createUser({ email, password: 'Test-password-123', email_confirm: true })
  if (ce) throw ce
  userId = created.user.id
  await sb.auth.signInWithPassword({ email, password: 'Test-password-123' })

  const { data: client } = await sb
    .from('clients')
    .insert({ name: 'Jane Doe', company: 'Acme', billing_address: '1 Main St, Lyon', phone: '+33 6 00 00 00 00' })
    .select()
    .single()
  const starts = new Date(Date.now() + 7 * 864e5).toISOString()
  const { data: gig } = await sb
    .from('gigs')
    .insert({ title: 'Acme party, gala; night', client_id: client.id, starts_at: starts, location: 'Hôtel du Parc, Lyon', fee: 900, deposit_amount: 300 })
    .select()
    .single()

  // Documents
  const { data: draft, error: de } = await sb
    .from('documents')
    .insert({
      kind: 'invoice',
      gig_id: gig.id,
      client_id: client.id,
      buyer_name: 'Jane Doe',
      buyer_company: 'Acme',
      lines: [{ description: 'Magic performance', quantity: 1, unit_price: 900 }],
      tax_rate: 20,
      deposit_paid: 300,
      currency: 'EUR',
    })
    .select()
    .single()
  check('draft invoice with computed totals', !de && Number(draft.total) === 1080 && Number(draft.amount_due) === 780, de?.message ?? JSON.stringify(draft))

  const { error: fe1 } = await sb.rpc('finalize_document', { p_id: draft.id })
  check('finalize refused without business details', fe1?.message.includes('business name'), fe1?.message)

  const { error: be } = await sb.from('business_profiles').insert({ business_name: 'Alex Magic', address: 'Lyon', tax_id: 'SIRET 123' })
  check('save business profile', !be, be?.message)

  const { data: final, error: fe2 } = await sb.rpc('finalize_document', { p_id: draft.id })
  const year = new Date().getFullYear()
  check('finalize numbers the invoice', !fe2 && final.number === `INV-${year}-0001` && final.seller.business_name === 'Alex Magic', fe2?.message ?? JSON.stringify(final))

  const { error: ue } = await sb.from('documents').update({ tax_rate: 0 }).eq('id', draft.id)
  check('finalized invoice is frozen', ue?.message.includes('cannot be edited'), ue?.message)

  const { error: dle } = await sb.from('documents').delete().eq('id', draft.id)
  check('finalized invoice cannot be deleted', dle?.message.includes('cannot be deleted'), dle?.message)

  const { error: pe } = await sb.from('documents').update({ status: 'paid' }).eq('id', draft.id)
  check('mark invoice as paid', !pe, pe?.message)

  // Calendar feed
  const { data: feed, error: cfe } = await sb.from('calendar_feeds').insert({}).select().single()
  check('create calendar feed', !cfe && /^[0-9a-f]{64}$/.test(feed.token), cfe?.message)

  const res = await fetch(`${url}/functions/v1/calendar-feed?token=${feed.token}`)
  const ics = await res.text()
  check('feed is served as text/calendar', res.status === 200 && res.headers.get('content-type')?.startsWith('text/calendar'), `${res.status} ${res.headers.get('content-type')}`)
  check('feed contains the gig', ics.includes('BEGIN:VEVENT') && ics.includes(`UID:${gig.id}@magician-helper`), ics.slice(0, 300))
  check('text values are escaped', ics.includes('SUMMARY:Acme party\\, gala\\; night'), ics)
  check('lines use CRLF and are folded', ics.split('\r\n').every((l) => new TextEncoder().encode(l).length <= 75))

  const bad = await fetch(`${url}/functions/v1/calendar-feed?token=${'0'.repeat(64)}`)
  check('unknown token → 404', bad.status === 404, bad.status)
  const malformed = await fetch(`${url}/functions/v1/calendar-feed?token=abc`)
  check('malformed token → 404', malformed.status === 404, malformed.status)

  // Rotating the link invalidates the old one
  await sb.from('calendar_feeds').delete().eq('id', feed.id)
  const old = await fetch(`${url}/functions/v1/calendar-feed?token=${feed.token}`)
  check('deleted feed → 404', old.status === 404, old.status)
} catch (error) {
  failures++
  console.error('FAIL unexpected', error)
} finally {
  if (userId) {
    const { error } = await admin.auth.admin.deleteUser(userId)
    console.log(error ? `FAIL cleanup ${error.message}` : 'ok   test user deleted (finalized invoice removed with the account)')
  }
}
console.log(failures ? `\n${failures} failure(s)` : '\nAll phase 8 checks passed')
process.exit(failures ? 1 : 0)
