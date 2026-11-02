// End-to-end API test against the real Supabase project (PostgREST embeds, RPC, Storage).
// Creates a temporary confirmed user, exercises the API as that user, then deletes it.
// Usage: node scripts/e2e/phase2.mjs   (needs VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY and
//        SUPABASE_SERVICE_ROLE_KEY in the environment — never commit that last one)
import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL
const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const sb = createClient(url, process.env.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: false } })
const email = `e2e-${Date.now()}@example.com`
let failures = 0
const check = (label, cond, extra = '') => {
  if (!cond) failures++
  console.log(cond ? 'ok  ' : 'FAIL', label, cond ? '' : extra ?? '')
}
let userId
try {
  const { data: created, error: ce } = await admin.auth.admin.createUser({ email, password: 'Test-password-123', email_confirm: true })
  if (ce) throw ce
  userId = created.user.id
  const { error: le } = await sb.auth.signInWithPassword({ email, password: 'Test-password-123' })
  if (le) throw le

  const { data: prof } = await sb.from('profiles').select('*').single()
  check('profile created with trial', prof && new Date(prof.trial_ends_at) > new Date())

  const { data: item, error: ie } = await sb.from('inventory_items').insert({ item_name: 'Deck', quantity: 1, low_stock_threshold: 2 }).select().single()
  check('insert inventory item', !ie, ie?.message)
  check('stock status computed', item?.stock_status === 'running_low', item?.stock_status)

  const { data: trick, error: te } = await sb.from('tricks').insert({ name: 'Ambitious Card', categories: ['card'], tags: ['Opener'] }).select().single()
  check('insert trick', !te, te?.message)

  const { error: pe } = await sb.from('trick_props').upsert([{ trick_id: trick.id, item_id: item.id, quantity_needed: 2 }], { onConflict: 'trick_id,item_id' })
  check('upsert trick prop', !pe, pe?.message)

  const { data: detail, error: de } = await sb
    .from('tricks')
    .select('*, trick_props(id, item_id, quantity_needed, item:inventory_items(id, item_name, quantity, stock_status)), ideas(id, title)')
    .eq('id', trick.id)
    .maybeSingle()
  check('trick detail with embedded props', !de && detail?.trick_props?.[0]?.item?.item_name === 'Deck', de?.message)

  const { data: inv, error: ve } = await sb.from('inventory_overview').select('*')
  check('inventory_overview trick_count', !ve && inv?.[0]?.trick_count === 1, ve?.message)

  const { data: itemDetail, error: ide } = await sb
    .from('inventory_items')
    .select('*, inventory_files(*), trick_props(id, quantity_needed, trick:tricks(id, name, status))')
    .eq('id', item.id)
    .maybeSingle()
  check('inventory detail with embedded tricks', !ide && itemDetail?.trick_props?.[0]?.trick?.name === 'Ambitious Card', ide?.message)

  const { data: idea, error: ie2 } = await sb.from('ideas').insert({ title: 'Coin bite', content: '<p>Bite &amp; restore</p>', tags: ['Gimmick'] }).select().single()
  check('insert idea', !ie2, ie2?.message)
  const { data: newTrickId, error: cve } = await sb.rpc('convert_idea_to_trick', { p_idea_id: idea.id })
  check('convert idea to trick (RPC)', !cve && typeof newTrickId === 'string', cve?.message)
  const { data: ideasList, error: ile } = await sb.from('ideas').select('*, trick:tricks(id, name)')
  check('ideas with embedded trick', !ile && ideasList?.[0]?.trick?.name === 'Coin bite', ile?.message)

  const path = `${userId}/${item.id}/${crypto.randomUUID()}-photo.png`
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')
  const { error: ue } = await sb.storage.from('inventory').upload(path, png, { contentType: 'image/png' })
  check('upload photo to own folder', !ue, ue?.message)
  const { error: fre } = await sb.from('inventory_files').insert({ item_id: item.id, storage_path: path, file_name: 'photo.png', mime_type: 'image/png', size_bytes: png.length, kind: 'photo' })
  check('file row', !fre, fre?.message)
  const { data: signed, error: se } = await sb.storage.from('inventory').createSignedUrls([path], 60)
  check('signed URL', !se && signed?.[0]?.signedUrl, se?.message)
  const fetched = signed?.[0]?.signedUrl ? await fetch(signed[0].signedUrl) : null
  check('signed URL downloads', fetched?.status === 200, fetched?.status)
  const { error: oe } = await sb.storage.from('inventory').upload('00000000-0000-0000-0000-000000000000/x/evil.png', png)
  check('upload to another user folder refused', !!oe)
  const { error: rme } = await sb.storage.from('inventory').remove([path])
  check('remove photo', !rme, rme?.message)
  const { error: dle } = await sb.from('inventory_items').delete().eq('id', item.id)
  check('delete item (cascade)', !dle, dle?.message)
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
