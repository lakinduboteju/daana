import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Meal } from './meal'
import type { Unit } from './menu'
import type { ItemStatus } from './status'

/** What /search's query string asks for. */
export type SearchCriteria = {
  q: string
  /** 'YYYY-MM-DD', inclusive. */
  from: string | null
  to: string | null
  /** Any of these item statuses; null for all. */
  statuses: ItemStatus[] | null
  monasteryId: string | null
  contributorId: string | null
}

/** One matching item, with its event. */
export type SearchResult = {
  item_id: string
  item_name: string
  required_quantity: number | null
  unit: Unit
  custom_unit: string | null
  status: ItemStatus
  /** Oldest assignment first. */
  contributor_names: string[]
  event_id: string
  event_date: string
  meal: Meal
  host: string | null
  monastery_name: string
  cancelled_at: string | null
}

/** Items across all the household's events that match, in event order then menu order. */
export function useSearch(criteria: SearchCriteria, enabled: boolean) {
  const q = criteria.q.trim()
  const { from, to, statuses, monasteryId, contributorId } = criteria
  return useQuery({
    queryKey: ['search', { q, from, to, statuses, monasteryId, contributorId }],
    queryFn: async (): Promise<SearchResult[]> => {
      const { data, error } = await supabase.rpc('search_items', {
        p_q: q || null,
        p_from: from,
        p_to: to,
        p_statuses: statuses,
        p_monastery_id: monasteryId,
        p_contributor_id: contributorId,
      })
      if (error) throw error
      return data as SearchResult[]
    },
    enabled,
    placeholderData: (previous) => previous,
  })
}
