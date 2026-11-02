import type { PostgrestError } from '@supabase/supabase-js'

type Response = { data: unknown; error: PostgrestError | null }
/** Data type of the successful branch of a Supabase response. */
type SuccessData<R extends Response> = Exclude<R, { error: PostgrestError }>['data']

/** Turns a Supabase response into data or a thrown error (for TanStack Query). */
export async function unwrap<R extends Response>(request: PromiseLike<R>): Promise<SuccessData<R>> {
  const { data, error } = await request
  if (error) throw error
  return data as SuccessData<R>
}

/** Human message for database errors shown in toasts. */
export function dbErrorMessage(error: unknown): string {
  const e = error as Partial<PostgrestError> & { message?: string; statusCode?: string }
  const message = e?.message ?? String(error)
  if (e?.code === '42501' || message.includes('row-level security'))
    return 'Your free trial has ended — subscribe to keep creating and editing.'
  if (e?.code === '23505') return 'This already exists.'
  if (e?.code === '23503') return 'A linked item no longer exists. Refresh the page and try again.'
  if (message.toLowerCase().includes('failed to fetch')) return 'Network error. Check your connection.'
  return message || 'Something went wrong.'
}
