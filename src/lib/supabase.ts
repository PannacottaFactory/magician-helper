import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { env } from './env'

// PKCE flow: magic links and password-reset links come back with `?code=...`
// (query string) instead of tokens in the URL hash. Safer, and compatible with
// any router. The code is exchanged automatically on page load.
export const supabase = createClient<Database>(
  env.supabaseUrl ?? 'http://localhost:54321',
  env.supabaseAnonKey ?? 'missing-anon-key',
  {
    auth: {
      flowType: 'pkce',
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
)
