import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { eventDocumentPaths, removeDocumentFiles } from './documents'
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
  cancelled_at: string | null
} & EventProgress

/** How many of the event's items are in each item status, from the event_summary view. */
export type EventProgress = {
  item_count: number
  unassigned_count: number
  pending_count: number
  partial_count: number
  confirmed_count: number
  received_count: number
  /** Confirmed plus received. */
  ready_count: number
  /** Unassigned plus pending; 0 for past or cancelled events. */
  attention_count: number
  /** Partial items; 0 for past or cancelled events. */
  short_count: number
}

const PROGRESS_COLUMNS =
  'item_count, unassigned_count, pending_count, partial_count, confirmed_count, received_count, ready_count, attention_count, short_count'
const SUMMARY_COLUMNS = `id, date, meal, host, monk_count, layperson_count, monastery_name, days_away, is_past, cancelled_at, ${PROGRESS_COLUMNS}`

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

/** What the event form edits. */
export type EventFields = {
  date: string
  meal: Meal
  /** The monastery name as typed. An existing household monastery with the same trimmed name is reused. */
  monasteryName: string
  host: string
  monkCount: number
  laypersonCount: number
  organizerName: string
  organizerPhone: string
  notes: string
  instructions: string
}

export type NewEvent = EventFields & { householdId: string }

/** The household's monastery with this trimmed name, or a new one. */
async function resolveMonastery(householdId: string, name: string): Promise<string> {
  const trimmed = name.trim()
  const { data, error } = await supabase.from('monastery').select('id, name')
  if (error) throw error
  const existing = (data ?? []).find((monastery) => monastery.name.trim() === trimmed)
  if (existing) return existing.id
  return createMonastery(householdId, trimmed)
}

/** Creates an event with the household's category templates as its categories. Resolves to its id. */
export function useCreateEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (event: NewEvent): Promise<string> => {
      const monasteryId = await resolveMonastery(event.householdId, event.monasteryName)
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

export type CopiedEvent = NewEvent & { sourceEventId: string }

/**
 * Creates an event from the form's fields with a copy of another event's menu:
 * categories, items and contributors, every assignment pending again. Money and
 * documents aren't copied. Resolves to the new event's id.
 */
export function useCopyEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (event: CopiedEvent): Promise<string> => {
      const monasteryId = await resolveMonastery(event.householdId, event.monasteryName)
      const { data, error } = await supabase.rpc('copy_event', {
        p_source_event_id: event.sourceEventId,
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
      void queryClient.invalidateQueries({ queryKey: ['contributors'] })
    },
  })
}

/** Everything the event form shows, for editing. */
export type EventDetails = {
  id: string
  household_id: string
  date: string
  meal: Meal
  monastery_id: string
  monastery_name: string
  host: string | null
  monk_count: number
  layperson_count: number
  organizer_name: string | null
  organizer_phone: string | null
  notes: string | null
  instructions: string | null
  cancelled_at: string | null
}

const DETAIL_COLUMNS =
  'id, household_id, date, meal, monastery_id, host, monk_count, layperson_count, organizer_name, organizer_phone, notes, instructions, cancelled_at'

/** One event's editable details, or null when it doesn't exist or belongs to another household. */
export function useEventDetails(eventId: string) {
  return useQuery({
    queryKey: ['events', eventId, 'details'],
    queryFn: async (): Promise<EventDetails | null> => {
      const { data, error } = await supabase.from('event').select(DETAIL_COLUMNS).eq('id', eventId).maybeSingle()
      if (error) {
        if (error.code === '22P02') return null
        throw error
      }
      if (!data) return null
      const { data: monastery, error: monasteryError } = await supabase
        .from('monastery')
        .select('name')
        .eq('id', data.monastery_id)
        .single()
      if (monasteryError) throw monasteryError
      return { ...data, monastery_name: monastery.name } as EventDetails
    },
  })
}

/** Saves the form's fields over an existing event. Its categories and menu stay as they are. */
export function useUpdateEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ eventId, householdId, fields }: { eventId: string; householdId: string; fields: EventFields }) => {
      const monasteryId = await resolveMonastery(householdId, fields.monasteryName)
      const { error } = await supabase
        .from('event')
        .update({
          date: fields.date,
          meal: fields.meal,
          monastery_id: monasteryId,
          host: blankToNull(fields.host),
          monk_count: fields.monkCount,
          layperson_count: fields.laypersonCount,
          organizer_name: blankToNull(fields.organizerName),
          organizer_phone: blankToNull(fields.organizerPhone),
          notes: blankToNull(fields.notes),
          instructions: blankToNull(fields.instructions),
        })
        .eq('id', eventId)
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['events'] })
      void queryClient.invalidateQueries({ queryKey: ['monasteries'] })
    },
  })
}

/** Cancels an event (keeping everything in it) or undoes the cancellation. */
export function useSetEventCancelled() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ eventId, cancelled }: { eventId: string; cancelled: boolean }) => {
      const { error } = await supabase
        .from('event')
        .update({ cancelled_at: cancelled ? new Date().toISOString() : null })
        .eq('id', eventId)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] }),
  })
}

/** Deletes an event and everything in it (categories, items, assignments, money, documents). */
export function useDeleteEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (eventId: string) => {
      const files = await eventDocumentPaths(eventId)
      const { error } = await supabase.from('event').delete().eq('id', eventId)
      if (error) throw error
      // The delete cascades to the document records; their files go after.
      await removeDocumentFiles(files)
    },
    onSuccess: (_, eventId) => {
      queryClient.removeQueries({ queryKey: ['events', eventId] })
      void queryClient.invalidateQueries({ queryKey: ['events'] })
      void queryClient.invalidateQueries({ queryKey: ['monasteries'] })
    },
  })
}

function blankToNull(value: string): string | null {
  return value.trim() || null
}
