import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

/**
 * A household-level default category. New events copy the templates when
 * they're created, so changing a template never touches existing events.
 */
export type CategoryTemplate = { id: string; name: string; position: number }

const KEY = ['category-templates']

/** The household's category templates, in the order new events get them. */
export function useCategoryTemplates() {
  return useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<CategoryTemplate[]> => {
      const { data, error } = await supabase
        .from('category_template')
        .select('id, name, position')
        .order('position')
        .order('created_at')
      if (error) throw error
      return data
    },
  })
}

/** Adds a template after the household's last one. */
export function useAddCategoryTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (name: string) => {
      const { data: household, error: householdError } = await supabase
        .from('household')
        .select('id')
        .limit(1)
        .single()
      if (householdError) throw householdError
      const { data: last, error: lastError } = await supabase
        .from('category_template')
        .select('position')
        .order('position', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (lastError) throw lastError
      const { error } = await supabase
        .from('category_template')
        .insert({ household_id: household.id, name: name.trim(), position: (last?.position ?? 0) + 1 })
      if (error) throw error
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: KEY }),
  })
}

export function useRenameCategoryTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase.from('category_template').update({ name: name.trim() }).eq('id', id)
      if (error) throw error
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: KEY }),
  })
}
