import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Meal } from './meal'
import { createMonastery } from './monasteries'

export type EventSummary = {
  id: string
  date: string
  meal: Meal
  host: string | null
  monk_count: number
  layperson_count: number
  monastery_name: string
  days_away: number
  is_past: boolean
}

const SUMMARY_COLUMNS = 'id, date, meal, host, monk_count, layperson_count, monastery_name, days_away, is_past'

/** All the household's events, by date. Upcoming or past comes from the database (Sri Lanka date). */
export function useEventSummaries() {
  return useQuery({
    queryKey: ['events'],
    queryFn: async (): Promise<EventSummary[]> => {
      const { data, error } = await supabase
        .from('event_summary')
        .select(SUMMARY_COLUMNS)
        .order('date')
        .order('meal')
        .order('created_at')
      if (error) throw error
      return data as EventSummary[]
    },
  })
}

/** One event, or null when it doesn't exist or belongs to another household. */
export function useEventSummary(eventId: string) {
  return useQuery({
    queryKey: ['events', eventId],
    queryFn: async (): Promise<EventSummary | null> => {
      const { data, error } = await supabase
        .from('event_summary')
        .select(SUMMARY_COLUMNS)
        .eq('id', eventId)
        .maybeSingle()
      if (error) {
        // A malformed id is just an event that doesn't exist.
        if (error.code === '22P02') return null
        throw error
      }
      return data as EventSummary | null
    },
  })
}

export type NewEvent = {
  householdId: string
  date: string
  meal: Meal
  /** An existing monastery, or a new one to create first. */
  monastery: { id: string } | { name: string; location: string }
  host: string
  monkCount: number
  laypersonCount: number
  organizerName: string
  organizerPhone: string
  notes: string
  instructions: string
}

/** Creates an event with the household's category templates as its categories. Resolves to its id. */
export function useCreateEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (event: NewEvent): Promise<string> => {
      const monasteryId =
        'id' in event.monastery
          ? event.monastery.id
          : await createMonastery(event.householdId, event.monastery.name, event.monastery.location)
      const { data, error } = await supabase.rpc('create_event', {
        p_household_id: event.householdId,
        p_date: event.date,
        p_meal: event.meal,
        p_monastery_id: monasteryId,
        p_host: event.host,
        p_monk_count: event.monkCount,
        p_layperson_count: event.laypersonCount,
        p_organizer_name: event.organizerName,
        p_organizer_phone: event.organizerPhone,
        p_notes: event.notes,
        p_instructions: event.instructions,
      })
      if (error) throw error
      return data as string
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['events'] })
      void queryClient.invalidateQueries({ queryKey: ['monasteries'] })
    },
  })
}
