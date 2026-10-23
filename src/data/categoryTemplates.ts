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
