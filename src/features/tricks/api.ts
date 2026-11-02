import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { inventoryKeys } from '@/features/inventory/api'
import { DEFAULT_TRICK_TAGS, type TrickStatus } from '@/lib/constants'
import { unwrap } from '@/lib/db'
import { supabase } from '@/lib/supabase'
import type { Tables, TablesInsert } from '@/types/database'

export type Trick = Tables<'tricks'>
export type TrickPropInput = { item_id: string; quantity_needed: number }

export const trickKeys = {
  all: ['tricks'] as const,
  list: ['tricks', 'list'] as const,
  detail: (id: string) => ['tricks', 'detail', id] as const,
}

export function useTricks() {
  return useQuery({
    queryKey: trickKeys.list,
    queryFn: () => unwrap(supabase.from('tricks').select('*').order('name')),
  })
}

export function useTrick(id: string | undefined) {
  return useQuery({
    queryKey: trickKeys.detail(id ?? ''),
    enabled: Boolean(id),
    queryFn: () =>
      unwrap(
        supabase
          .from('tricks')
          .select(
            '*, trick_props(id, item_id, quantity_needed, item:inventory_items(id, item_name, quantity, stock_status)), ideas(id, title)',
          )
          .eq('id', id!)
          .maybeSingle(),
      ),
  })
}

/** Default tags + every tag already used, for autocomplete. */
export function useTrickTagSuggestions() {
  const { data } = useTricks()
  return useMemo(() => {
    const all = new Map<string, string>()
    DEFAULT_TRICK_TAGS.forEach((t) => all.set(t.toLowerCase(), t))
    data?.forEach((trick) => trick.tags.forEach((t) => all.set(t.toLowerCase(), t)))
    return [...all.values()].sort((a, b) => a.localeCompare(b))
  }, [data])
}

function useInvalidateTricks() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: trickKeys.all })
    void queryClient.invalidateQueries({ queryKey: inventoryKeys.all })
    void queryClient.invalidateQueries({ queryKey: ['ideas'] })
  }
}

/** Replaces the inventory props linked to a trick with the given list. */
async function syncTrickProps(trickId: string, props: TrickPropInput[]) {
  const existing = await unwrap(supabase.from('trick_props').select('id, item_id').eq('trick_id', trickId))
  const keep = new Set(props.map((p) => p.item_id))
  const toDelete = existing.filter((row) => !keep.has(row.item_id)).map((row) => row.id)
  if (toDelete.length) await unwrap(supabase.from('trick_props').delete().in('id', toDelete))
  if (props.length) {
    await unwrap(
      supabase
        .from('trick_props')
        .upsert(
          props.map((p) => ({ trick_id: trickId, item_id: p.item_id, quantity_needed: p.quantity_needed })),
          { onConflict: 'trick_id,item_id' },
        ),
    )
  }
}

export function useSaveTrick() {
  const invalidate = useInvalidateTricks()
  return useMutation({
    mutationFn: async ({
      id,
      values,
      props,
    }: {
      id?: string
      values: TablesInsert<'tricks'>
      props?: TrickPropInput[]
    }) => {
      const trick = id
        ? await unwrap(supabase.from('tricks').update(values).eq('id', id).select().single())
        : await unwrap(supabase.from('tricks').insert(values).select().single())
      if (props) await syncTrickProps(trick.id, props)
      return trick
    },
    onSettled: invalidate,
  })
}

/** Status change from the kanban or the detail panel (optimistic). */
export function useUpdateTrickStatus() {
  const queryClient = useQueryClient()
  const invalidate = useInvalidateTricks()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TrickStatus }) =>
      unwrap(supabase.from('tricks').update({ status }).eq('id', id).select().single()),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: trickKeys.list })
      const previous = queryClient.getQueryData<Trick[]>(trickKeys.list)
      queryClient.setQueryData<Trick[]>(trickKeys.list, (rows) =>
        rows?.map((row) => (row.id === id ? { ...row, status } : row)),
      )
      return { previous }
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(trickKeys.list, context.previous)
    },
    onSettled: invalidate,
  })
}

export async function deleteTrick(id: string) {
  await unwrap(supabase.from('tricks').delete().eq('id', id))
}
