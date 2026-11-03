import { useMutation } from '@tanstack/react-query'
import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

/** Calls an Edge Function and returns its JSON, with readable errors. */
async function invoke<T>(name: string, body?: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>(name, { body: body ?? {} })
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const payload = (await error.context.json().catch(() => null)) as { error?: string } | null
      throw new Error(payload?.error ?? 'The server could not complete the request.')
    }
    throw new Error('Could not reach the server. Check your connection and try again.')
  }
  return data as T
}

/** Redirects to Stripe Checkout. */
export function useStartCheckout() {
  return useMutation({
    mutationFn: async () => {
      const { url } = await invoke<{ url: string }>('create-checkout-session')
      window.location.assign(url)
    },
  })
}

/** Redirects to the Stripe Customer Portal. */
export function useOpenPortal() {
  return useMutation({
    mutationFn: async () => {
      const { url } = await invoke<{ url: string }>('create-portal-session')
      window.location.assign(url)
    },
  })
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: async () => {
      await invoke<{ ok: true }>('delete-account', { confirm: 'DELETE' })
      await supabase.auth.signOut({ scope: 'local' })
    },
  })
}
