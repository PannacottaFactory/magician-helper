// CORS: only the app itself (GitHub Pages) and local development may call the functions.

const APP_URL = (Deno.env.get('APP_URL') ?? '').replace(/\/$/, '')
const EXTRA = (Deno.env.get('ALLOWED_ORIGINS') ?? 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)

const allowedOrigins = new Set([new URL(APP_URL || 'http://localhost').origin, ...EXTRA])

export function corsHeaders(req: Request): HeadersInit {
  const origin = req.headers.get('origin') ?? ''
  return {
    'Access-Control-Allow-Origin': allowedOrigins.has(origin) ? origin : [...allowedOrigins][0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  }
}

/**
 * Base URL to send the user back to after Stripe: the calling app if it is an
 * allowed origin (local dev), otherwise APP_URL (production, includes the base path).
 */
export function returnBase(req: Request): string {
  const origin = req.headers.get('origin') ?? ''
  if (origin && origin !== new URL(APP_URL).origin && allowedOrigins.has(origin)) return origin
  return APP_URL
}

export function json(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
  })
}
