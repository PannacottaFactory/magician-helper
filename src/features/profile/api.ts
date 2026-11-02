import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/features/auth/auth-provider'
import type { Tables, TablesUpdate } from '@/types/database'

export type Profile = Tables<'profiles'>

export const profileKey = (userId: string) => ['profile', userId] as const

export function useProfile() {
  const user = useUser()
  return useQuery({
    queryKey: profileKey(user.id),
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (error) throw error
      return data
    },
  })
}

export function useUpdateProfile() {
  const user = useUser()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (values: TablesUpdate<'profiles'>) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(values)
        .eq('id', user.id)
        .select('*')
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => queryClient.setQueryData(profileKey(user.id), data),
  })
}

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Access rules, mirrored from the SQL function `has_write_access()`.
 * The database is the real gatekeeper; this only drives the UI.
 */
export function getAccess(profile: Profile | undefined) {
  if (!profile) return { canWrite: true, onTrial: false, trialDaysLeft: 0, status: null }
  const msLeft = new Date(profile.trial_ends_at).getTime() - Date.now()
  const trialDaysLeft = Math.max(0, Math.ceil(msLeft / DAY_MS))
  const hasSubscription = ['trialing', 'active', 'past_due'].includes(profile.subscription_status ?? '')
  const onTrial = msLeft > 0 && !hasSubscription
  return {
    canWrite: msLeft > 0 || hasSubscription,
    onTrial,
    trialDaysLeft,
    status: profile.subscription_status,
  }
}

export function useAccess() {
  const { data } = useProfile()
  return getAccess(data)
}
