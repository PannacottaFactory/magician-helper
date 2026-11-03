// iCalendar feed of a user's gigs, for Google Calendar / Apple Calendar / Outlook subscriptions.
// GET /functions/v1/calendar-feed?token=<64 hex chars>
// Calendar apps cannot send a Supabase session, so the secret token in the URL is the
// credential (deployed with --no-verify-jwt). Read-only: it never changes any data.
import { createClient } from 'npm:@supabase/supabase-js@2.49.4'

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false, autoRefreshToken: false },
})
const APP_URL = (Deno.env.get('APP_URL') ?? '').replace(/\/$/, '')

type GigRow = {
  id: string
  title: string
  starts_at: string
  ends_at: string | null
  location: string | null
  event_type: string | null
  notes: string | null
  updated_at: string
  client: { name: string; company: string | null; phone: string | null; email: string | null } | null
}

/** 20261104T183000Z */
function icsDate(iso: string) {
  return new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

/** Escapes a TEXT value (RFC 5545 §3.3.11). */
function text(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
}

/** Folds lines longer than 75 octets (RFC 5545 §3.1). */
function fold(line: string) {
  const bytes = new TextEncoder().encode(line)
  if (bytes.length <= 75) return line
  const parts: string[] = []
  let current = ''
  let size = 0
  for (const char of line) {
    const n = new TextEncoder().encode(char).length
    if (size + n > (parts.length ? 74 : 75)) {
      parts.push(current)
      current = ''
      size = 0
    }
    current += char
    size += n
  }
  parts.push(current)
  return parts.join('\r\n ')
}

function eventFor(gig: GigRow) {
  const end = gig.ends_at ?? new Date(new Date(gig.starts_at).getTime() + 2 * 3600_000).toISOString()
  const details = [
    gig.client && `Client: ${[gig.client.name, gig.client.company].filter(Boolean).join(', ')}`,
    gig.client?.phone && `Phone: ${gig.client.phone}`,
    gig.client?.email && `Email: ${gig.client.email}`,
    gig.event_type && `Event: ${gig.event_type}`,
    gig.notes && `\n${gig.notes}`,
    APP_URL && `\nOpen in Magician Helper: ${APP_URL}/app/gigs/${gig.id}`,
  ].filter(Boolean)
  return [
    'BEGIN:VEVENT',
    `UID:${gig.id}@magician-helper`,
    `DTSTAMP:${icsDate(gig.updated_at)}`,
    `LAST-MODIFIED:${icsDate(gig.updated_at)}`,
    `DTSTART:${icsDate(gig.starts_at)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${text(gig.title)}`,
    gig.location && `LOCATION:${text(gig.location)}`,
    details.length && `DESCRIPTION:${text(details.join('\n'))}`,
    APP_URL && `URL:${APP_URL}/app/gigs/${gig.id}`,
    'END:VEVENT',
  ].filter(Boolean) as string[]
}

Deno.serve(async (req) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return new Response('Method not allowed', { status: 405 })

  const token = new URL(req.url).searchParams.get('token') ?? ''
  if (!/^[0-9a-f]{64}$/.test(token)) return new Response('Not found', { status: 404 })

  const { data: feed, error: feedError } = await admin.from('calendar_feeds').select('user_id').eq('token', token).maybeSingle()
  if (feedError) return new Response('Server error', { status: 500 })
  if (!feed) return new Response('Not found', { status: 404 })

  // Past year + everything ahead
  const since = new Date(Date.now() - 365 * 864e5).toISOString()
  const { data: gigs, error } = await admin
    .from('gigs')
    .select('id, title, starts_at, ends_at, location, event_type, notes, updated_at, client:clients(name, company, phone, email)')
    .eq('user_id', feed.user_id)
    .gte('starts_at', since)
    .order('starts_at')
    .limit(2000)
  if (error) return new Response('Server error', { status: 500 })

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Magician Helper//Gigs//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Magician Helper gigs',
    'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
    'X-PUBLISHED-TTL:PT1H',
    ...(gigs as unknown as GigRow[]).flatMap(eventFor),
    'END:VCALENDAR',
  ]

  return new Response(lines.map(fold).join('\r\n') + '\r\n', {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="magician-helper-gigs.ics"',
      'Cache-Control': 'private, max-age=900',
      'X-Robots-Tag': 'noindex',
    },
  })
})
