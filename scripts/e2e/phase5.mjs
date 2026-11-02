// End-to-end API test for phase 5 (global search, CSV-style bulk import, paginated export reads).
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

  // bulk import like the CSV importer: identical keys on every row
  const rows = Array.from({ length: 1205 }, (_, i) => ({
    name: `Imported trick ${i}`, effect: null, secret_and_setup: null, categories: ['card'], difficulty: null,
    duration_min: null, status: 'to_learn', tags: ['Imported'], video_url: null, references_text: null, other_props: null, notes: null,
  }))
  let importError = null
  for (let i = 0; i < rows.length; i += 200) {
    const { error } = await sb.from('tricks').insert(rows.slice(i, i + 200))
    if (error) importError = error
  }
  check('bulk import 1205 tricks in batches', !importError, importError?.message)

  // paginated read (export)
  const all = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from('tricks').select('*').order('created_at').order('id').range(from, from + 999)
    if (error) throw error
    all.push(...data)
    if (data.length < 1000) break
  }
  check('paginated export read gets every row', all.length === 1205, `${all.length}`)

  await sb.from('clients').insert({ name: 'Imported Club', company: 'Magic Co' })
  const { data: results, error: se } = await sb.rpc('search_all', { q: 'imported', per_kind: 6 })
  const kinds = new Set(results?.map((r) => r.kind))
  check('search_all returns several kinds, capped per kind', !se && kinds.has('trick') && kinds.has('client') && results.filter((r) => r.kind === 'trick').length === 6, se?.message)

  const { data: none } = await sb.rpc('search_all', { q: 'zzzz-nothing' })
  check('search with no match', Array.isArray(none) && none.length === 0)

  const { data: profile, error: pe } = await sb.from('profiles').select('display_name, currency, theme, stale_trick_days, trial_ends_at, subscription_status, created_at').single()
  check('export profile columns readable', !pe && profile.stale_trick_days === 14, pe?.message)

  const { error: ue } = await sb.from('profiles').update({ stale_trick_days: 21 }).eq('id', userId)
  check('update stale_trick_days', !ue, ue?.message)
} catch (e) {
  failures++
  console.log('FAIL exception', e.message)
} finally {
  if (userId) {
    const { error } = await admin.auth.admin.deleteUser(userId)
    console.log(error ? `FAIL cleanup ${error.message}` : 'ok   test user deleted')
  }
}
process.exit(failures ? 1 : 0)
