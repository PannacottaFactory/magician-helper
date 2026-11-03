// Landing page screenshots of the real app.
// Creates a temporary demo account with realistic data, captures a few screens
// from a running preview (npm run build && npx vite preview --port 4173), then deletes the account.
//
// Usage (PowerShell):
//   $env:VITE_SUPABASE_URL="https://xxxx.supabase.co"; $env:VITE_SUPABASE_ANON_KEY="..."; $env:SUPABASE_SERVICE_ROLE_KEY="..."
//   node scripts/screenshots.mjs
// Optional: BASE_URL (default http://localhost:4173), CHROME_PATH.
import puppeteer from 'puppeteer-core'
import { createClient } from '@supabase/supabase-js'
import { mkdirSync } from 'node:fs'
import path from 'node:path'

const BASE = process.env.BASE_URL ?? 'http://localhost:4173'
const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const OUT = path.resolve('public/landing')
const url = process.env.VITE_SUPABASE_URL
const anon = process.env.VITE_SUPABASE_ANON_KEY
const service = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !anon || !service) throw new Error('Set VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY.')

const admin = createClient(url, service, { auth: { persistSession: false } })
const sb = createClient(url, anon, { auth: { persistSession: false } })
// Shown in the sidebar of the screenshots
const email = 'alex.marlowe@example.com'
const password = `Demo-${crypto.randomUUID()}`

const day = 864e5
const dateOnly = (offsetDays) => new Date(Date.now() + offsetDays * day).toISOString().slice(0, 10)
const at = (offsetDays, hour, minute = 0) => {
  const d = new Date(Date.now() + offsetDays * day)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}
async function must(promise) {
  const { data, error } = await promise
  if (error) throw error
  return data
}

// Remove a leftover demo account from an interrupted run
const { data: existing } = await admin.auth.admin.listUsers({ perPage: 1000 })
const leftover = existing?.users.find((u) => u.email === email)
if (leftover) await admin.auth.admin.deleteUser(leftover.id)

const { data: created, error: createError } = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { display_name: 'Alex' },
})
if (createError) throw createError
const userId = created.user.id

try {
  await must(sb.auth.signInWithPassword({ email, password }))
  await must(sb.from('profiles').update({ display_name: 'Alex' }).eq('id', userId))

  // Inventory (from the built-in catalog)
  const items = await must(
    sb
      .from('inventory_items')
      .insert(
        [
          ['Bicycle Standard deck (red)', 'bicycle-red', 6, 2],
          ['Bicycle Standard deck (blue)', 'bicycle-blue', 4, 2],
          ['Invisible deck', 'invisible-deck', 1, 0],
          ['Half dollars', 'half-dollars', 4, 0],
          ['Sponge balls', 'sponge-balls', 1, 2],
          ['Linking rings', 'linking-rings', 1, 0],
          ['Sharpie marker', 'sharpie', 3, 1],
          ['Flash paper', 'flash-paper', 0, 3],
          ['Silk handkerchiefs', 'silks', 6, 0],
          ['Thumb tip', 'thumb-tip', 2, 0],
          ['Peek wallet', 'peek-wallet', 1, 0],
          ['Close-up pad', 'close-up-pad', 1, 0],
        ].map(([item_name, catalog_key, quantity, low_stock_threshold]) => ({ item_name, catalog_key, quantity, low_stock_threshold })),
      )
      .select(),
  )
  const item = (key) => items.find((i) => i.catalog_key === key).id

  // Tricks
  const T = (name, status, categories, difficulty, duration_min, tags, effect) => ({
    name,
    status,
    categories,
    difficulty,
    duration_min,
    tags,
    effect,
    secret_and_setup: 'Kept hidden until you tap Reveal.',
  })
  const tricks = await must(
    sb
      .from('tricks')
      .insert([
        T('Ambitious Card', 'performance_ready', ['card', 'close_up'], 2, 6, ['Opener', 'Walkaround'], 'A signed card keeps rising to the top of the deck.'),
        T('Invisible Deck', 'performance_ready', ['card', 'mentalism'], 1, 4, ['Closer'], 'The only reversed card is the one they named.'),
        T('Coins Across', 'needs_polish', ['coin', 'close_up'], 3, 5, ['Walkaround'], 'Four coins travel one by one from hand to hand.'),
        T('Sponge Balls', 'performance_ready', ['close_up'], 2, 5, ['Family friendly', 'Kids'], 'Balls multiply in the spectator’s own hand.'),
        T('Card to Wallet', 'needs_polish', ['card'], 3, 4, ['Closer', 'Signature'], 'The signed card appears inside a zipped wallet.'),
        T('Linking Rings', 'learning', ['stage'], 3, 8, ['Stage', 'Family friendly'], 'Solid steel rings link and unlink.'),
        T('Book Test', 'learning', ['mentalism', 'stage'], 2, 7, ['Mentalism'], 'A word thought of on any page is revealed.'),
        T('Torn & Restored Silk', 'to_learn', ['stage'], 2, 4, ['Stage'], 'A torn silk is visibly restored.'),
        T('Triumph', 'performance_ready', ['card'], 2, 4, ['Walkaround'], 'A shuffled mess of face-up and face-down cards rights itself.'),
        T('Coin Bite', 'to_learn', ['coin'], 2, 2, ['Comedy'], 'A bite out of a borrowed coin — then it is restored.'),
      ])
      .select(),
  )
  const trick = (name) => tricks.find((t) => t.name === name).id
  await must(
    sb.from('trick_props').insert([
      { trick_id: trick('Ambitious Card'), item_id: item('bicycle-red'), quantity_needed: 1 },
      { trick_id: trick('Ambitious Card'), item_id: item('sharpie'), quantity_needed: 1 },
      { trick_id: trick('Invisible Deck'), item_id: item('invisible-deck'), quantity_needed: 1 },
      { trick_id: trick('Coins Across'), item_id: item('half-dollars'), quantity_needed: 4 },
      { trick_id: trick('Sponge Balls'), item_id: item('sponge-balls'), quantity_needed: 4 },
      { trick_id: trick('Card to Wallet'), item_id: item('peek-wallet'), quantity_needed: 1 },
      { trick_id: trick('Card to Wallet'), item_id: item('bicycle-blue'), quantity_needed: 1 },
      { trick_id: trick('Triumph'), item_id: item('bicycle-blue'), quantity_needed: 1 },
      { trick_id: trick('Linking Rings'), item_id: item('linking-rings'), quantity_needed: 1 },
    ]),
  )

  // Routines
  const routines = await must(
    sb
      .from('routines')
      .insert([
        { name: 'Corporate walkaround', status: 'ready', audience_types: ['corporate', 'wedding'], description: 'Strolling set, 20 minutes, no table.' },
        { name: 'Family stage show', status: 'drafting', audience_types: ['kids', 'stage_show'], description: 'Bright, visual, lots of volunteers.' },
      ])
      .select(),
  )
  for (const name of ['Ambitious Card', 'Sponge Balls', 'Coins Across', 'Triumph', 'Card to Wallet']) {
    await must(sb.rpc('add_trick_to_routine', { p_routine_id: routines[0].id, p_trick_id: trick(name) }))
  }
  for (const name of ['Sponge Balls', 'Linking Rings', 'Book Test']) {
    await must(sb.rpc('add_trick_to_routine', { p_routine_id: routines[1].id, p_trick_id: trick(name) }))
  }

  // Practice: a two-week streak
  const sessions = [
    [0, 'Double lift', 'Ambitious Card', 25, 4],
    [-1, 'Retention vanish', 'Coins Across', 30, 3],
    [-2, 'Pass to wallet', 'Card to Wallet', 20, 3],
    [-3, 'Full run-through', null, 45, 4],
    [-4, 'Shuffle control', 'Triumph', 15, 5],
    [-5, 'Ring links', 'Linking Rings', 35, 2],
    [-6, 'Book Test patter', 'Book Test', 20, 3],
    [-8, 'Retention vanish', 'Coins Across', 25, 3],
    [-9, 'Sponge loads', 'Sponge Balls', 15, 4],
    [-11, 'Double lift', 'Ambitious Card', 20, 4],
  ]
  await must(
    sb.from('practice_logs').insert(
      sessions.map(([offset, title, trickName, minutes, rating]) => ({
        practiced_on: dateOnly(offset),
        title,
        trick_id: trickName ? trick(trickName) : null,
        routine_id: trickName ? null : routines[0].id,
        time_spent_min: minutes,
        self_rating: rating,
        status: 'done',
        notes_and_flaws_to_fix: rating < 4 ? 'Slow down the second phase.' : null,
      })),
    ),
  )

  // Clients and gigs
  const clients = await must(
    sb
      .from('clients')
      .insert([
        { name: 'Claire Martin', company: 'Lumen Events', email: 'claire@example.com', phone: null, notes: null },
        { name: 'Tom & Julia', company: null, email: 'tomjulia@example.com', phone: null, notes: 'Wedding — garden reception.' },
        { name: 'Sarah Klein', company: 'Northwind', email: 'sarah@example.com', phone: null, notes: null },
      ])
      .select(),
  )
  const gigs = await must(
    sb
      .from('gigs')
      .insert([
        { title: 'Lumen Events gala dinner', client_id: clients[0].id, starts_at: at(3, 19, 30), location: 'Hôtel du Parc, Lyon', event_type: 'Corporate event', fee: 950, deposit_amount: 300, payment_status: 'deposit_paid', currency: 'EUR' },
        { title: 'Tom & Julia’s wedding', client_id: clients[1].id, starts_at: at(9, 16, 0), location: 'Château de Vaux', event_type: 'Wedding', fee: 1200, deposit_amount: 400, payment_status: 'pending', currency: 'EUR' },
        { title: 'Northwind summer party', client_id: clients[2].id, starts_at: at(17, 18, 0), location: 'Rooftop, Paris 9e', event_type: 'Corporate event', fee: 800, deposit_amount: null, payment_status: 'pending', currency: 'EUR' },
        { title: 'Birthday party — Léo, 8', client_id: null, starts_at: at(-6, 15, 0), location: 'Private home', event_type: 'Kids party', fee: 350, deposit_amount: null, payment_status: 'fully_paid', currency: 'EUR' },
      ])
      .select(),
  )
  await must(sb.from('gig_routines').insert([{ gig_id: gigs[0].id, routine_id: routines[0].id, position: 0 }]))
  await must(sb.from('gig_checklist_items').insert([{ gig_id: gigs[0].id, label: 'Business cards', quantity_needed: 1, source: 'manual' }]))
  const checklist = await must(sb.from('gig_checklist_items').select('id,label').eq('gig_id', gigs[0].id))
  for (const row of checklist.filter((c) => /red|Sharpie|Half/.test(c.label))) {
    await must(sb.from('gig_checklist_items').update({ is_checked: true }).eq('id', row.id))
  }

  // Ideas
  await must(
    sb.from('ideas').insert([
      { title: 'Ring on a shoelace', content: '<p>Borrowed ring links onto the spectator’s own shoelace.</p>', tags: ['Walkaround'] },
      { title: 'Opener line', content: '<p>“I’m not here to fool you. Just to make you doubt a little.”</p>', tags: ['Patter'] },
    ]),
  )

  // Screenshots
  mkdirSync(OUT, { recursive: true })
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true })
  const page = await browser.newPage()
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1.5 })
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle0' })
  await page.evaluate(() => {
    localStorage.setItem('mh:tricks-view', JSON.stringify('kanban'))
  })
  await page.type('input[type=email]', email)
  await page.type('input[type=password]', password)
  await page.click('button[type=submit]')
  await page.waitForFunction(() => location.pathname.startsWith('/app'), { timeout: 20000 })

  async function shot(route, file, { width, height, scale, mobile = false, scrollTo } = {}) {
    await page.setViewport({ width, height, deviceScaleFactor: scale, isMobile: mobile, hasTouch: mobile })
    await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle0' })
    await new Promise((r) => setTimeout(r, 900))
    if (scrollTo) {
      await page.evaluate((text) => {
        const heading = [...document.querySelectorAll('h2,h3')].find((h) => h.textContent?.includes(text))
        heading?.scrollIntoView({ block: 'start' })
      }, scrollTo)
      await new Promise((r) => setTimeout(r, 400))
    }
    // Remove the transient toasts/focus rings from the picture
    await page.evaluate(() => (document.activeElement instanceof HTMLElement ? document.activeElement.blur() : null))
    await page.screenshot({ path: path.join(OUT, file), type: 'webp', quality: 82 })
    console.log('saved', file)
  }

  const desktop = { width: 1280, height: 800, scale: 1.5 }
  const phone = { width: 390, height: 844, scale: 2, mobile: true }
  await shot('/app', 'dashboard-desktop.webp', desktop)
  await shot('/app/tricks', 'tricks-kanban-desktop.webp', desktop)
  await shot(`/app/routines/${routines[0].id}`, 'routine-mobile.webp', phone)
  await shot(`/app/gigs/${gigs[0].id}`, 'gig-checklist-mobile.webp', { ...phone, scrollTo: 'Routines' })
  await browser.close()
} finally {
  await admin.auth.admin.deleteUser(userId)
  console.log('demo user deleted')
}
