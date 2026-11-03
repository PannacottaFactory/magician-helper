import Stripe from 'npm:stripe@17.7.0'
import { createClient, type SupabaseClient, type User } from 'npm:@supabase/supabase-js@2.49.4'

export const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  // fetch-based client: works in the Deno edge runtime
  httpClient: Stripe.createFetchHttpClient(),
})

/** Service-role client: bypasses RLS. Only used server-side, never exposed. */
export const admin: SupabaseClient = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false, autoRefreshToken: false } },
)

/** Returns the signed-in user from the request's Authorization header, or null. */
export async function getUser(req: Request): Promise<User | null> {
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return null
  const { data, error } = await admin.auth.getUser(token)
  if (error) return null
  return data.user
}

export type Profile = {
  id: string
  trial_ends_at: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  subscription_status: string | null
}

export async function getProfile(userId: string): Promise<Profile> {
  const { data, error } = await admin
    .from('profiles')
    .select('id, trial_ends_at, stripe_customer_id, stripe_subscription_id, subscription_status')
    .eq('id', userId)
    .single()
  if (error) throw error
  return data as Profile
}
