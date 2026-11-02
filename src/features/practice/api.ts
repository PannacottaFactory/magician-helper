import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { unwrap } from '@/lib/db'
import { parseDay, todayISO } from '@/lib/format'
import { supabase } from '@/lib/supabase'
import type { TablesInsert } from '@/types/database'

export const practiceKeys = {
  all: ['practice'] as const,
  list: ['practice', 'list'] as const,
}

function fetchPracticeLogs() {
  return unwrap(
    supabase
      .from('practice_logs')
      .select('*, trick:tricks(id, name), routine:routines(id, name)')
      .order('practiced_on', { ascending: false })
      .order('created_at', { ascending: false }),
  )
}
export type PracticeLog = Awaited<ReturnType<typeof fetchPracticeLogs>>[number]

export function usePracticeLogs() {
  return useQuery({ queryKey: practiceKeys.list, queryFn: fetchPracticeLogs })
}

function useInvalidatePractice() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: practiceKeys.all })
    void queryClient.invalidateQueries({ queryKey: ['tricks'] })
    void queryClient.invalidateQueries({ queryKey: ['routines'] })
  }
}

export function useSavePractice() {
  const invalidate = useInvalidatePractice()
  return useMutation({
    mutationFn: ({ id, values }: { id?: string; values: TablesInsert<'practice_logs'> }) =>
      id
        ? unwrap(supabase.from('practice_logs').update(values).eq('id', id).select().single())
        : unwrap(supabase.from('practice_logs').insert(values).select().single()),
    onSettled: invalidate,
  })
}

export async function deletePractice(id: string) {
  await unwrap(supabase.from('practice_logs').delete().eq('id', id))
}

/** Consecutive days with practice, ending today (or yesterday if nothing logged yet today). */
export function computeStreak(days: string[]) {
  const set = new Set(days)
  const day = parseDay(todayISO())
  const iso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  if (!set.has(iso(day))) day.setDate(day.getDate() - 1)
  let streak = 0
  while (set.has(iso(day))) {
    streak++
    day.setDate(day.getDate() - 1)
  }
  return streak
}

/** Minutes practiced over the last 7 days (today included). */
export function minutesLastDays(logs: Pick<PracticeLog, 'practiced_on' | 'time_spent_min'>[], days = 7) {
  const from = parseDay(todayISO())
  from.setDate(from.getDate() - (days - 1))
  return logs
    .filter((log) => parseDay(log.practiced_on) >= from)
    .reduce((sum, log) => sum + (log.time_spent_min ?? 0), 0)
}
