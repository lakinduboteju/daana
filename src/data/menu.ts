import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export type Category = {
  id: string
  name: string
}

export function menuKey(eventId: string) {
  return ['events', eventId, 'menu']
}

/** The event's categories in order. */
export function useMenu(eventId: string) {
  return useQuery({
    queryKey: menuKey(eventId),
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase
        .from('category')
        .select('id, name')
        .eq('event_id', eventId)
        .order('position')
        .order('created_at')
      if (error) throw error
      return data as Category[]
    },
  })
}
