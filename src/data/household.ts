import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export type Household = { id: string; name: string }

/** The households the organizer belongs to (one in V1). Row-level security does the filtering. */
export function useHouseholds() {
  return useQuery({
    queryKey: ['households'],
    queryFn: async (): Promise<Household[]> => {
      const { data, error } = await supabase.from('household').select('id, name').order('name')
      if (error) throw error
      return data
    },
  })
}
