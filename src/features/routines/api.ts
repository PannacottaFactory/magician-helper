import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { unwrap } from '@/lib/db'
import { supabase } from '@/lib/supabase'
import type { Tables, TablesInsert } from '@/types/database'

export type Routine = Tables<'routines'>
/** Routine + stats from the routines_overview view. */
export type RoutineRow = Routine & {
  trick_count: number
  total_duration_min: number
  avg_difficulty: number | null
  not_ready_count: number
}

export const routineKeys = {
  all: ['routines'] as const,
  list: ['routines', 'list'] as const,
  detail: (id: string) => ['routines', 'detail', id] as const,
  props: (id: string) => ['routines', 'props', id] as const,
}

export function useRoutines() {
  return useQuery({
    queryKey: routineKeys.list,
    queryFn: async () => (await unwrap(supabase.from('routines_overview').select('*').order('name'))) as RoutineRow[],
  })
}

function fetchRoutine(id: string) {
  return unwrap(
    supabase
      .from('routines')
      .select(
        '*, routine_tricks(id, position, transition_notes, trick:tricks(id, name, status, duration_min, difficulty, other_props)), practice_logs(id, practiced_on, title, time_spent_min, self_rating)',
      )
      .eq('id', id)
      .order('position', { referencedTable: 'routine_tricks' })
      .order('practiced_on', { referencedTable: 'practice_logs', ascending: false })
      .maybeSingle(),
  )
}
export type RoutineDetail = NonNullable<Awaited<ReturnType<typeof fetchRoutine>>>
export type RoutineTrickItem = RoutineDetail['routine_tricks'][number]

export function useRoutine(id: string | undefined) {
  return useQuery({
    queryKey: routineKeys.detail(id ?? ''),
    enabled: Boolean(id),
    queryFn: () => fetchRoutine(id!),
  })
}

export function useRoutineProps(id: string | undefined) {
  return useQuery({
    queryKey: routineKeys.props(id ?? ''),
    enabled: Boolean(id),
    queryFn: () => unwrap(supabase.from('routine_props').select('*').eq('routine_id', id!).order('item_name')),
  })
}

function useInvalidateRoutines() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: routineKeys.all })
    void queryClient.invalidateQueries({ queryKey: ['tricks'] })
  }
}

export function useSaveRoutine() {
  const invalidate = useInvalidateRoutines()
  return useMutation({
    mutationFn: ({ id, values }: { id?: string; values: TablesInsert<'routines'> }) =>
      id
        ? unwrap(supabase.from('routines').update(values).eq('id', id).select().single())
        : unwrap(supabase.from('routines').insert(values).select().single()),
    onSettled: invalidate,
  })
}

export function useAddTrickToRoutine(routineId: string) {
  const invalidate = useInvalidateRoutines()
  return useMutation({
    mutationFn: (trickId: string) =>
      unwrap(supabase.rpc('add_trick_to_routine', { p_routine_id: routineId, p_trick_id: trickId })),
    onSettled: invalidate,
  })
}

export function useRemoveRoutineTrick() {
  const invalidate = useInvalidateRoutines()
  return useMutation({
    mutationFn: (routineTrickId: string) =>
      unwrap(supabase.from('routine_tricks').delete().eq('id', routineTrickId)),
    onSettled: invalidate,
  })
}

export function useUpdateTransitionNotes() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      unwrap(supabase.from('routine_tricks').update({ transition_notes: notes || null }).eq('id', id)),
    onSettled: () => queryClient.invalidateQueries({ queryKey: routineKeys.all }),
  })
}

/** Saves a new order after drag & drop (optimistic). */
export function useReorderRoutine(routineId: string) {
  const queryClient = useQueryClient()
  const key = routineKeys.detail(routineId)
  return useMutation({
    mutationFn: (ids: string[]) =>
      unwrap(supabase.rpc('reorder_routine_tricks', { p_routine_id: routineId, p_ids: ids })),
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<RoutineDetail | null>(key)
      if (previous) {
        const byId = new Map(previous.routine_tricks.map((rt) => [rt.id, rt]))
        queryClient.setQueryData<RoutineDetail>(key, {
          ...previous,
          routine_tricks: ids.map((id, i) => ({ ...byId.get(id)!, position: i })),
        })
      }
      return { previous }
    },
    onError: (_e, _ids, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: routineKeys.all }),
  })
}

export async function deleteRoutine(id: string) {
  await unwrap(supabase.from('routines').delete().eq('id', id))
}
