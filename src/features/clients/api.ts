import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { unwrap } from '@/lib/db'
import { supabase } from '@/lib/supabase'
import type { Tables, TablesInsert } from '@/types/database'

export type Client = Tables<'clients'>
export type ClientRow = Client & {
  gig_count: number
  total_fees: number
  last_gig_at: string | null
  next_gig_at: string | null
}

export const clientKeys = {
  all: ['clients'] as const,
  list: ['clients', 'list'] as const,
  detail: (id: string) => ['clients', 'detail', id] as const,
}

export function useClients() {
  return useQuery({
    queryKey: clientKeys.list,
    queryFn: async () => (await unwrap(supabase.from('clients_overview').select('*').order('name'))) as ClientRow[],
  })
}

function fetchClient(id: string) {
  return unwrap(
    supabase
      .from('clients')
      .select('*, gigs(id, title, starts_at, ends_at, fee, currency, payment_status, location)')
      .eq('id', id)
      .order('starts_at', { referencedTable: 'gigs', ascending: false })
      .maybeSingle(),
  )
}
export type ClientDetail = NonNullable<Awaited<ReturnType<typeof fetchClient>>>

export function useClient(id: string | undefined) {
  return useQuery({ queryKey: clientKeys.detail(id ?? ''), enabled: Boolean(id), queryFn: () => fetchClient(id!) })
}

export function useSaveClient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id?: string; values: TablesInsert<'clients'> }) =>
      id
        ? unwrap(supabase.from('clients').update(values).eq('id', id).select().single())
        : unwrap(supabase.from('clients').insert(values).select().single()),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: clientKeys.all })
      void queryClient.invalidateQueries({ queryKey: ['gigs'] })
    },
  })
}

export async function deleteClient(id: string) {
  await unwrap(supabase.from('clients').delete().eq('id', id))
}
