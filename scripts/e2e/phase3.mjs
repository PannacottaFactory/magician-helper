// End-to-end API test for phase 3 (routines, practice log, catalog items, computed views).
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

  const { data: items, error: ie } = await sb
    .from('inventory_items')
    .insert([
      { item_name: 'Bicycle Standard deck (red)', catalog_key: 'bicycle-red', quantity: 2, low_stock_threshold: 1 },
      { item_name: 'Sponge balls', catalog_key: 'sponge-balls', quantity: 0, low_stock_threshold: 2 },
    ])
    .select()
  check('bulk insert catalog items', !ie && items.length === 2, ie?.message)

  const { data: tricks, error: te } = await sb
    .from('tricks')
    .insert([
      { name: 'Ambitious Card', duration_min: 5, difficulty: 2, status: 'performance_ready', other_props: 'Sharpie' },
      { name: 'Sponge balls routine', duration_min: 6, difficulty: 3, status: 'learning' },
    ])
    .select()
  check('insert tricks', !te, te?.message)
  // bulk insert: every row must have the same keys (missing ones become NULL, not their default)
  const { error: tpe } = await sb.from('trick_props').insert([
    { trick_id: tricks[0].id, item_id: items[0].id, quantity_needed: 1 },
    { trick_id: tricks[1].id, item_id: items[1].id, quantity_needed: 4 },
  ])
  check('insert trick props', !tpe, tpe?.message)

  const { data: routine, error: re } = await sb.from('routines').insert({ name: 'Walkaround', audience_types: ['corporate'] }).select().single()
  check('insert routine', !re, re?.message)
  for (const t of tricks) {
    const { error } = await sb.rpc('add_trick_to_routine', { p_routine_id: routine.id, p_trick_id: t.id })
    check(`add_trick_to_routine ${t.name}`, !error, error?.message)
  }

  const { data: detail, error: de } = await sb
    .from('routines')
    .select('*, routine_tricks(id, position, transition_notes, trick:tricks(id, name, status, duration_min, difficulty, other_props)), practice_logs(id, practiced_on, title, time_spent_min, self_rating)')
    .eq('id', routine.id)
    .order('position', { referencedTable: 'routine_tricks' })
    .maybeSingle()
  check('routine detail with ordered tricks', !de && detail.routine_tricks.map((r) => r.trick.name).join() === 'Ambitious Card,Sponge balls routine', de?.message)

  const ids = detail.routine_tricks.map((r) => r.id).reverse()
  const { error: oe } = await sb.rpc('reorder_routine_tricks', { p_routine_id: routine.id, p_ids: ids })
  const { data: after } = await sb.from('routine_tricks').select('id, position').eq('routine_id', routine.id).order('position')
  check('reorder RPC', !oe && after[0].id === ids[0], oe?.message)

  const { error: ne } = await sb.from('routine_tricks').update({ transition_notes: 'Ask for a volunteer' }).eq('id', ids[0])
  check('update transition notes', !ne, ne?.message)

  const { data: overview, error: ve } = await sb.from('routines_overview').select('*').single()
  check('routines_overview stats', !ve && overview.trick_count === 2 && overview.total_duration_min === 11 && overview.not_ready_count === 1, ve?.message ?? JSON.stringify(overview))

  const { data: props, error: pe } = await sb.from('routine_props').select('*').eq('routine_id', routine.id).order('item_name')
  check('routine_props consolidated', !pe && props.length === 2 && props[1].stock_status === 'out_of_stock', pe?.message)

  const today = new Date().toISOString().slice(0, 10)
  const { error: le } = await sb.from('practice_logs').insert({ practiced_on: today, title: 'Double lift', trick_id: tricks[0].id, routine_id: routine.id, time_spent_min: 25, self_rating: 4 })
  check('insert practice log', !le, le?.message)
  const { data: logs, error: lle } = await sb.from('practice_logs').select('*, trick:tricks(id, name), routine:routines(id, name)')
  check('practice logs with trick & routine', !lle && logs[0].trick.name === 'Ambitious Card' && logs[0].routine.name === 'Walkaround', lle?.message)

  const { data: to, error: toe } = await sb.from('tricks_overview').select('*').eq('id', tricks[0].id).single()
  check('tricks_overview last_practiced', !toe && to.last_practiced === today && to.practice_minutes === 25 && to.routine_count === 1, toe?.message)

  const { data: td, error: tde } = await sb
    .from('tricks')
    .select('*, trick_props(id, item_id, quantity_needed, item:inventory_items(id, item_name, quantity, stock_status, catalog_key)), ideas(id, title), routine_tricks(id, routine:routines(id, name, status)), practice_logs(id, practiced_on, title, time_spent_min, self_rating)')
    .eq('id', tricks[0].id)
    .order('practiced_on', { referencedTable: 'practice_logs', ascending: false })
    .maybeSingle()
  check('trick detail with routines & practice', !tde && td.routine_tricks[0].routine.name === 'Walkaround' && td.practice_logs.length === 1 && td.trick_props[0].item.catalog_key === 'bicycle-red', tde?.message)

  const { error: dre } = await sb.from('routines').delete().eq('id', routine.id)
  const { data: kept } = await sb.from('practice_logs').select('routine_id')
  check('delete routine keeps practice log', !dre && kept.length === 1 && kept[0].routine_id === null, dre?.message)
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
