import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export type Monastery = { id: string; name: string }

/** The household's monasteries that aren't archived, most recently used first. */
export function useRecentMonasteries() {
  return useQuery({
    queryKey: ['monasteries', 'recent'],
    queryFn: async (): Promise<Monastery[]> => {
      const { data, error } = await supabase
        .from('monastery_recent')
        .select('id, name')
        .order('last_used_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export async function createMonastery(householdId: string, name: string): Promise<string> {
  const { data, error } = await supabase
    .from('monastery')
    .insert({ household_id: householdId, name: name.trim() })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}
