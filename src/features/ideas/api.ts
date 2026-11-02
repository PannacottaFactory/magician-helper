import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { unwrap } from '@/lib/db'
import { supabase } from '@/lib/supabase'
import type { TablesInsert } from '@/types/database'

export const ideaKeys = {
  all: ['ideas'] as const,
  list: ['ideas', 'list'] as const,
}

function fetchIdeas() {
  return unwrap(supabase.from('ideas').select('*, trick:tricks(id, name)').order('updated_at', { ascending: false }))
}
export type Idea = Awaited<ReturnType<typeof fetchIdeas>>[number]

export function useIdeas() {
  return useQuery({ queryKey: ideaKeys.list, queryFn: fetchIdeas })
}

export function useIdeaTagSuggestions() {
  const { data } = useIdeas()
  return useMemo(
    () => [...new Set(data?.flatMap((idea) => idea.tags) ?? [])].sort((a, b) => a.localeCompare(b)),
    [data],
  )
}

function useInvalidateIdeas() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: ideaKeys.all })
    void queryClient.invalidateQueries({ queryKey: ['tricks'] })
  }
}

export function useSaveIdea() {
  const invalidate = useInvalidateIdeas()
  return useMutation({
    mutationFn: async ({ id, values }: { id?: string; values: TablesInsert<'ideas'> }) =>
      id
        ? unwrap(supabase.from('ideas').update(values).eq('id', id).select().single())
        : unwrap(supabase.from('ideas').insert(values).select().single()),
    onSettled: invalidate,
  })
}

/** Creates a trick from the idea (title, text, tags) and links them. Returns the trick id. */
export function useConvertIdeaToTrick() {
  const invalidate = useInvalidateIdeas()
  return useMutation({
    mutationFn: (ideaId: string) => unwrap(supabase.rpc('convert_idea_to_trick', { p_idea_id: ideaId })),
    onSettled: invalidate,
  })
}

export async function deleteIdea(id: string) {
  await unwrap(supabase.from('ideas').delete().eq('id', id))
}
