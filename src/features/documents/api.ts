import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useUser } from '@/features/auth/auth-provider'
import type { GigDetail } from '@/features/gigs/api'
import { unwrap } from '@/lib/db'
import { formatCurrency, formatDate, todayISO } from '@/lib/format'
import { supabase } from '@/lib/supabase'
import type { Json, Tables, TablesInsert, TablesUpdate } from '@/types/database'

export type DocumentKind = 'quote' | 'invoice'
export type DocumentLine = { description: string; quantity: number; unit_price: number }
export type DocumentRow = Omit<Tables<'documents'>, 'lines' | 'seller' | 'kind'> & {
  kind: DocumentKind
  lines: DocumentLine[]
  seller: Seller | null
}
export type BusinessProfile = Tables<'business_profiles'>
/** The seller block printed on a document (frozen in `documents.seller` when finalized). */
export type Seller = Pick<
  BusinessProfile,
  'business_name' | 'address' | 'email' | 'phone' | 'website' | 'tax_id' | 'legal_note' | 'payment_instructions'
>

export const documentKeys = {
  all: ['documents'] as const,
  list: ['documents', 'list'] as const,
  detail: (id: string) => ['documents', 'detail', id] as const,
  byGig: (gigId: string) => ['documents', 'gig', gigId] as const,
}
export const businessKey = (userId: string) => ['business-profile', userId] as const

const asDocument = (row: Tables<'documents'>) => row as unknown as DocumentRow

export function useDocuments() {
  return useQuery({
    queryKey: documentKeys.list,
    queryFn: async () =>
      (await unwrap(supabase.from('documents').select('*').order('issue_date', { ascending: false }).order('created_at', { ascending: false }))).map(
        asDocument,
      ),
  })
}

export function useDocument(id: string | undefined) {
  return useQuery({
    queryKey: documentKeys.detail(id ?? ''),
    enabled: Boolean(id),
    queryFn: async () => {
      const row = await unwrap(supabase.from('documents').select('*').eq('id', id!).maybeSingle())
      return row ? asDocument(row) : null
    },
  })
}

export function useGigDocuments(gigId: string | undefined) {
  return useQuery({
    queryKey: documentKeys.byGig(gigId ?? ''),
    enabled: Boolean(gigId),
    queryFn: async () =>
      (await unwrap(supabase.from('documents').select('*').eq('gig_id', gigId!).order('created_at'))).map(asDocument),
  })
}

function useInvalidateDocuments() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: documentKeys.all })
  }
}

export function useCreateDocument() {
  const invalidate = useInvalidateDocuments()
  return useMutation({
    mutationFn: async (values: TablesInsert<'documents'>) =>
      asDocument(await unwrap(supabase.from('documents').insert(values).select().single())),
    onSettled: invalidate,
  })
}

export function useSaveDocument() {
  const invalidate = useInvalidateDocuments()
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: TablesUpdate<'documents'> }) =>
      asDocument(await unwrap(supabase.from('documents').update(values).eq('id', id).select().single())),
    onSettled: invalidate,
  })
}

export function useFinalizeDocument() {
  const invalidate = useInvalidateDocuments()
  return useMutation({
    mutationFn: async (id: string) =>
      asDocument((await unwrap(supabase.rpc('finalize_document', { p_id: id }))) as Tables<'documents'>),
    onSettled: invalidate,
  })
}

export function useUpdateDocumentStatus() {
  const invalidate = useInvalidateDocuments()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ doc, status }: { doc: DocumentRow; status: string }) => {
      await unwrap(supabase.from('documents').update({ status }).eq('id', doc.id))
      // A paid invoice means the gig is fully paid
      if (doc.kind === 'invoice' && doc.gig_id && status === 'paid') {
        await unwrap(supabase.from('gigs').update({ payment_status: 'fully_paid' }).eq('id', doc.gig_id))
      }
    },
    onSettled: () => {
      invalidate()
      void queryClient.invalidateQueries({ queryKey: ['gigs'] })
    },
  })
}

export async function deleteDocument(id: string) {
  await unwrap(supabase.from('documents').delete().eq('id', id))
}

// ---------------------------------------------------------------------------
// Business profile
// ---------------------------------------------------------------------------
export function useBusinessProfile() {
  const user = useUser()
  return useQuery({
    queryKey: businessKey(user.id),
    queryFn: () => unwrap(supabase.from('business_profiles').select('*').maybeSingle()),
  })
}

export function useSaveBusinessProfile() {
  const user = useUser()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: TablesUpdate<'business_profiles'>) =>
      unwrap(supabase.from('business_profiles').upsert({ ...values, user_id: user.id }, { onConflict: 'user_id' }).select().single()),
    onSuccess: (data) => queryClient.setQueryData(businessKey(user.id), data),
  })
}

export function sellerFrom(profile: BusinessProfile | null | undefined): Seller {
  return {
    business_name: profile?.business_name ?? null,
    address: profile?.address ?? null,
    email: profile?.email ?? null,
    phone: profile?.phone ?? null,
    website: profile?.website ?? null,
    tax_id: profile?.tax_id ?? null,
    legal_note: profile?.legal_note ?? null,
    payment_instructions: profile?.payment_instructions ?? null,
  }
}

// ---------------------------------------------------------------------------
// Drafts prefilled from a gig, or copied from another document
// ---------------------------------------------------------------------------
type GigClient = { id: string; name: string; company: string | null; email: string | null; billing_address?: string | null }

export function draftFromGig(
  kind: DocumentKind,
  gig: Pick<GigDetail, 'id' | 'title' | 'starts_at' | 'event_type' | 'fee' | 'deposit_amount' | 'payment_status' | 'currency'> & {
    client: GigClient | null
  },
  business: BusinessProfile | null | undefined,
): TablesInsert<'documents'> {
  const when = formatDate(gig.starts_at, { day: 'numeric', month: 'long', year: 'numeric' })
  const deposit = Number(gig.deposit_amount ?? 0)
  const depositReceived = kind === 'invoice' && ['deposit_paid', 'invoiced'].includes(gig.payment_status) ? deposit : 0
  return {
    kind,
    gig_id: gig.id,
    client_id: gig.client?.id ?? null,
    currency: gig.currency,
    issue_date: todayISO(),
    title: gig.title,
    buyer_name: gig.client?.name ?? null,
    buyer_company: gig.client?.company ?? null,
    buyer_email: gig.client?.email ?? null,
    buyer_address: gig.client?.billing_address ?? null,
    lines: [
      {
        description: `Magic performance — ${gig.event_type ? `${gig.event_type}, ` : ''}${when}`,
        quantity: 1,
        unit_price: Number(gig.fee ?? 0),
      },
    ] as unknown as Json,
    tax_rate: Number(business?.default_tax_rate ?? 0),
    deposit_paid: depositReceived,
    notes:
      kind === 'quote' && deposit > 0
        ? `A deposit of ${formatCurrency(deposit, gig.currency)} confirms the booking.`
        : null,
  }
}

export function blankDraft(kind: DocumentKind, business: BusinessProfile | null | undefined, currency: string): TablesInsert<'documents'> {
  return {
    kind,
    currency,
    issue_date: todayISO(),
    lines: [] as unknown as Json,
    tax_rate: Number(business?.default_tax_rate ?? 0),
  }
}

/** A new draft with the same content (used for "Duplicate" and "Convert to invoice"). */
export function copyAsDraft(doc: DocumentRow, kind: DocumentKind = doc.kind): TablesInsert<'documents'> {
  return {
    kind,
    gig_id: doc.gig_id,
    client_id: doc.client_id,
    currency: doc.currency,
    issue_date: todayISO(),
    title: doc.title,
    buyer_name: doc.buyer_name,
    buyer_company: doc.buyer_company,
    buyer_address: doc.buyer_address,
    buyer_email: doc.buyer_email,
    lines: doc.lines as unknown as Json,
    tax_rate: doc.tax_rate,
    deposit_paid: kind === doc.kind ? doc.deposit_paid : 0,
    notes: doc.notes,
  }
}
