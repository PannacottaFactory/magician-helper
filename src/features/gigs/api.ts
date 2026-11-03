import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { PaymentStatus } from '@/lib/constants'
import { unwrap } from '@/lib/db'
import { supabase } from '@/lib/supabase'
import type { Tables, TablesInsert } from '@/types/database'

export type Gig = Tables<'gigs'>
/** Gig + values computed by the gigs_overview view. */
export type GigRow = Gig & {
  client_name: string | null
  amount_received: number
  routine_count: number
  checklist_total: number
  checklist_done: number
  has_stock_alert: boolean
}

export const gigKeys = {
  all: ['gigs'] as const,
  list: ['gigs', 'list'] as const,
  detail: (id: string) => ['gigs', 'detail', id] as const,
  checklist: (id: string) => ['gigs', 'checklist', id] as const,
}

export function useGigs() {
  return useQuery({
    queryKey: gigKeys.list,
    queryFn: async () => (await unwrap(supabase.from('gigs_overview').select('*').order('starts_at'))) as GigRow[],
  })
}

function fetchGig(id: string) {
  return unwrap(
    supabase
      .from('gigs')
      .select(
        '*, client:clients(id, name, company, email, phone, billing_address), gig_routines(id, position, routine:routines(id, name, status, routine_tricks(id, trick:tricks(duration_min, status))))',
      )
      .eq('id', id)
      .order('position', { referencedTable: 'gig_routines' })
      .maybeSingle(),
  )
}
export type GigDetail = NonNullable<Awaited<ReturnType<typeof fetchGig>>>

export function useGig(id: string | undefined) {
  return useQuery({ queryKey: gigKeys.detail(id ?? ''), enabled: Boolean(id), queryFn: () => fetchGig(id!) })
}

function fetchChecklist(gigId: string) {
  return unwrap(
    supabase
      .from('gig_checklist_items')
      .select('*, item:inventory_items(id, item_name, quantity, stock_status, catalog_key)')
      .eq('gig_id', gigId)
      .order('created_at'),
  )
}
export type ChecklistItem = Awaited<ReturnType<typeof fetchChecklist>>[number]

export function useGigChecklist(gigId: string | undefined) {
  return useQuery({
    queryKey: gigKeys.checklist(gigId ?? ''),
    enabled: Boolean(gigId),
    queryFn: () => fetchChecklist(gigId!),
  })
}

function useInvalidateGigs() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: gigKeys.all })
    void queryClient.invalidateQueries({ queryKey: ['clients'] })
    void queryClient.invalidateQueries({ queryKey: ['routines'] })
  }
}

/** Replaces the routines linked to a gig (the database trigger refreshes the checklist). */
async function syncGigRoutines(gigId: string, routineIds: string[]) {
  const existing = await unwrap(supabase.from('gig_routines').select('id, routine_id').eq('gig_id', gigId))
  const keep = new Set(routineIds)
  const toDelete = existing.filter((r) => !keep.has(r.routine_id)).map((r) => r.id)
  if (toDelete.length) await unwrap(supabase.from('gig_routines').delete().in('id', toDelete))
  const have = new Set(existing.map((r) => r.routine_id))
  const toInsert = routineIds
    .map((routine_id, position) => ({ gig_id: gigId, routine_id, position }))
    .filter((r) => !have.has(r.routine_id))
  if (toInsert.length) await unwrap(supabase.from('gig_routines').insert(toInsert))
}

export function useSaveGig() {
  const invalidate = useInvalidateGigs()
  return useMutation({
    mutationFn: async ({ id, values, routineIds }: { id?: string; values: TablesInsert<'gigs'>; routineIds: string[] }) => {
      const gig = id
        ? await unwrap(supabase.from('gigs').update(values).eq('id', id).select().single())
        : await unwrap(supabase.from('gigs').insert(values).select().single())
      await syncGigRoutines(gig.id, routineIds)
      return gig
    },
    onSettled: invalidate,
  })
}

export function useUpdatePaymentStatus() {
  const invalidate = useInvalidateGigs()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: PaymentStatus }) =>
      unwrap(supabase.from('gigs').update({ payment_status: status }).eq('id', id)),
    onSettled: invalidate,
  })
}

export function useToggleChecklistItem(gigId: string) {
  const queryClient = useQueryClient()
  const key = gigKeys.checklist(gigId)
  return useMutation({
    mutationFn: ({ id, checked }: { id: string; checked: boolean }) =>
      unwrap(supabase.from('gig_checklist_items').update({ is_checked: checked }).eq('id', id)),
    onMutate: async ({ id, checked }) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<ChecklistItem[]>(key)
      queryClient.setQueryData<ChecklistItem[]>(key, (items) =>
        items?.map((item) => (item.id === id ? { ...item, is_checked: checked } : item)),
      )
      return { previous }
    },
    onError: (_e, _v, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: gigKeys.list }),
  })
}

export function useAddChecklistItem(gigId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (label: string) => unwrap(supabase.from('gig_checklist_items').insert({ gig_id: gigId, label })),
    onSettled: () => queryClient.invalidateQueries({ queryKey: gigKeys.all }),
  })
}

export function useDeleteChecklistItem(gigId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => unwrap(supabase.from('gig_checklist_items').delete().eq('id', id)),
    onSettled: () => queryClient.invalidateQueries({ queryKey: gigKeys.checklist(gigId) }),
  })
}

export function useSyncChecklist(gigId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => unwrap(supabase.rpc('sync_gig_checklist', { p_gig_id: gigId })),
    onSettled: () => queryClient.invalidateQueries({ queryKey: gigKeys.all }),
  })
}

export async function deleteGig(id: string) {
  await unwrap(supabase.from('gigs').delete().eq('id', id))
}

/** Everything printed on the show sheet, read fresh when the PDF is generated. */
export async function fetchShowSheet(gigId: string) {
  const gig = await unwrap(
    supabase
      .from('gigs')
      .select(
        'id, title, starts_at, ends_at, location, event_type, notes, client:clients(name, company, phone, email), gig_routines(id, position, routine:routines(id, name, routine_tricks(id, position, transition_notes, trick:tricks(id, name, duration_min))))',
      )
      .eq('id', gigId)
      .order('position', { referencedTable: 'gig_routines' })
      .single(),
  )
  const checklist = await unwrap(
    supabase.from('gig_checklist_items').select('id, label, quantity_needed, is_checked, source').eq('gig_id', gigId).order('label'),
  )
  const routines = gig.gig_routines
    .filter((gr) => gr.routine)
    .map((gr) => ({
      id: gr.routine!.id,
      name: gr.routine!.name,
      tricks: [...gr.routine!.routine_tricks]
        .sort((a, b) => a.position - b.position)
        .filter((rt) => rt.trick)
        .map((rt) => ({ id: rt.id, name: rt.trick!.name, duration_min: rt.trick!.duration_min, transition_notes: rt.transition_notes })),
    }))
  // Props first (auto), then manual items
  const sorted = [...checklist].sort((a, b) => Number(a.source === 'manual') - Number(b.source === 'manual') || a.label.localeCompare(b.label))
  return { gig, routines, checklist: sorted }
}
export type ShowSheetData = Awaited<ReturnType<typeof fetchShowSheet>>
