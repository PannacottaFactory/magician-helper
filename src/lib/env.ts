export const env = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  priceLabel: import.meta.env.VITE_PRICE_LABEL || '€9.99/month',
}

export const isSupabaseConfigured = Boolean(env.supabaseUrl && env.supabaseAnonKey)

/** Absolute URL of an app route, including the GitHub Pages base path. Used for auth redirects. */
export function appUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  return `${window.location.origin}${base}${path}`
}
