import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useUser } from '@/features/auth/auth-provider'
import { unwrap } from '@/lib/db'
import { supabase } from '@/lib/supabase'
import type { Tables, TablesInsert, TablesUpdate } from '@/types/database'

export type InventoryRow = Tables<'inventory_overview'>
export type InventoryItem = Tables<'inventory_items'>
export type InventoryFile = Tables<'inventory_files'>

export const BUCKET = 'inventory'
export const MAX_FILE_BYTES = 10 * 1024 * 1024

export const inventoryKeys = {
  all: ['inventory'] as const,
  list: ['inventory', 'list'] as const,
  detail: (id: string) => ['inventory', 'detail', id] as const,
  thumbs: ['inventory', 'thumbs'] as const,
}

export function useInventory() {
  return useQuery({
    queryKey: inventoryKeys.list,
    queryFn: () => unwrap(supabase.from('inventory_overview').select('*').order('item_name')),
  })
}

export function useInventoryItem(id: string | undefined) {
  return useQuery({
    queryKey: inventoryKeys.detail(id ?? ''),
    enabled: Boolean(id),
    queryFn: () =>
      unwrap(
        supabase
          .from('inventory_items')
          .select('*, inventory_files(*), trick_props(id, quantity_needed, trick:tricks(id, name, status))')
          .eq('id', id!)
          .order('created_at', { referencedTable: 'inventory_files' })
          .maybeSingle(),
      ),
  })
}

/** Invalidate everything that shows inventory data (lists, details, tricks' props). */
function useInvalidateInventory() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: inventoryKeys.all })
    void queryClient.invalidateQueries({ queryKey: ['tricks'] })
  }
}

export function useSaveInventoryItem() {
  const invalidate = useInvalidateInventory()
  return useMutation({
    mutationFn: async ({ id, values }: { id?: string; values: TablesInsert<'inventory_items'> }) => {
      if (id) {
        return unwrap(
          supabase
            .from('inventory_items')
            .update(values as TablesUpdate<'inventory_items'>)
            .eq('id', id)
            .select()
            .single(),
        )
      }
      return unwrap(supabase.from('inventory_items').insert(values).select().single())
    },
    onSuccess: invalidate,
  })
}

/** +1 / −1 buttons, with an optimistic update of the list. */
export function useAdjustQuantity() {
  const queryClient = useQueryClient()
  const invalidate = useInvalidateInventory()
  return useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) =>
      unwrap(
        supabase
          .from('inventory_items')
          .update({ quantity: Math.max(0, quantity) })
          .eq('id', id)
          .select()
          .single(),
      ),
    onMutate: async ({ id, quantity }) => {
      await queryClient.cancelQueries({ queryKey: inventoryKeys.list })
      const previous = queryClient.getQueryData<InventoryRow[]>(inventoryKeys.list)
      queryClient.setQueryData<InventoryRow[]>(inventoryKeys.list, (rows) =>
        rows?.map((row) => (row.id === id ? { ...row, quantity: Math.max(0, quantity) } : row)),
      )
      return { previous }
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(inventoryKeys.list, context.previous)
    },
    onSettled: invalidate,
  })
}

/** Deletes the item's files from Storage, then the item (cascades links and file rows). */
export async function deleteInventoryItem(id: string) {
  const files = await unwrap(supabase.from('inventory_files').select('storage_path').eq('item_id', id))
  if (files.length) {
    const { error } = await supabase.storage.from(BUCKET).remove(files.map((f) => f.storage_path))
    if (error) throw error
  }
  await unwrap(supabase.from('inventory_items').delete().eq('id', id))
}

function safeFileName(name: string) {
  return name
    .normalize('NFKD')
    .replace(/[^\w.-]+/g, '-')
    .replace(/-+/g, '-')
    .slice(-80)
}

export function useUploadFiles(itemId: string) {
  const user = useUser()
  const invalidate = useInvalidateInventory()
  return useMutation({
    mutationFn: async (files: File[]) => {
      for (const file of files) {
        if (file.size > MAX_FILE_BYTES) throw new Error(`“${file.name}” is larger than 10 MB.`)
      }
      for (const file of files) {
        const path = `${user.id}/${itemId}/${crypto.randomUUID()}-${safeFileName(file.name)}`
        const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type })
        if (error) throw error
        const { error: rowError } = await supabase.from('inventory_files').insert({
          item_id: itemId,
          storage_path: path,
          file_name: file.name,
          mime_type: file.type || null,
          size_bytes: file.size,
          kind: file.type.startsWith('image/') ? 'photo' : 'file',
        })
        if (rowError) {
          await supabase.storage.from(BUCKET).remove([path])
          throw rowError
        }
      }
    },
    onSettled: invalidate,
  })
}

export function useDeleteFile() {
  const invalidate = useInvalidateInventory()
  return useMutation({
    mutationFn: async (file: Pick<InventoryFile, 'id' | 'storage_path'>) => {
      const { error } = await supabase.storage.from(BUCKET).remove([file.storage_path])
      if (error) throw error
      await unwrap(supabase.from('inventory_files').delete().eq('id', file.id))
    },
    onSettled: invalidate,
  })
}

/** Temporary URLs (1 h) for files of the private bucket. */
export function useSignedUrls(paths: string[]) {
  const sorted = [...paths].sort()
  return useQuery({
    queryKey: ['signed-urls', sorted],
    enabled: sorted.length > 0,
    staleTime: 50 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(sorted, 3600)
      if (error) throw error
      const map: Record<string, string> = {}
      data.forEach((entry) => {
        if (entry.path && entry.signedUrl) map[entry.path] = entry.signedUrl
      })
      return map
    },
  })
}

/** First photo of each item, for list thumbnails. */
export function useInventoryThumbs() {
  const photos = useQuery({
    queryKey: inventoryKeys.thumbs,
    queryFn: () =>
      unwrap(
        supabase.from('inventory_files').select('item_id, storage_path').eq('kind', 'photo').order('created_at'),
      ),
  })
  const firstByItem = new Map<string, string>()
  photos.data?.forEach((p) => {
    if (!firstByItem.has(p.item_id)) firstByItem.set(p.item_id, p.storage_path)
  })
  const urls = useSignedUrls([...firstByItem.values()])
  const result = new Map<string, string>()
  firstByItem.forEach((path, itemId) => {
    const url = urls.data?.[path]
    if (url) result.set(itemId, url)
  })
  return result
}

/** Adds catalog props to the inventory in one request. */
export function useAddCatalogItems() {
  const invalidate = useInvalidateInventory()
  return useMutation({
    mutationFn: (items: TablesInsert<'inventory_items'>[]) =>
      unwrap(supabase.from('inventory_items').insert(items).select()),
    onSettled: invalidate,
  })
}
