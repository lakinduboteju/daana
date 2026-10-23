import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { EventSummary } from './events'
import type { Unit } from './menu'
import type { AssignmentStatus } from './status'

export type ContributorAssignment = {
  id: string
  quantity: number | null
  status: AssignmentStatus
  item: { id: string; name: string; unit: Unit; custom_unit: string | null }
}

/** One event the contributor has assignments in, with those assignments. */
export type ContributorEventGroup = {
  event: EventSummary
  assignments: ContributorAssignment[]
}

export function contributorAssignmentsKey(contributorId: string) {
  return ['contributors', 'assignments', contributorId]
}

const EVENT_COLUMNS = 'id, date, meal, host, monk_count, layperson_count, monastery_name, days_away, is_past, cancelled_at'

/**
 * Everything a contributor has taken on, grouped by event: upcoming events
 * first (soonest first), then past ones (latest first).
 */
export function useContributorAssignments(contributorId: string) {
  return useQuery({
    queryKey: contributorAssignmentsKey(contributorId),
    queryFn: async (): Promise<ContributorEventGroup[]> => {
      const { data, error } = await supabase
        .from('assignment')
        .select('id, event_id, quantity, status, created_at, item(id, name, unit, custom_unit, position, created_at)')
        .eq('contributor_id', contributorId)
        .order('created_at')
      // A malformed id is a contributor that doesn't exist; the page shows not found.
      if (error?.code === '22P02') return []
      if (error) throw error
      const rows = data as unknown as (ContributorAssignment & {
        event_id: string
        item: ContributorAssignment['item'] & { position: number; created_at: string }
      })[]
      if (rows.length === 0) return []

      const eventIds = [...new Set(rows.map((row) => row.event_id))]
      const { data: events, error: eventsError } = await supabase
        .from('event_summary')
        .select(EVENT_COLUMNS)
        .in('id', eventIds)
      if (eventsError) throw eventsError

      const groups = (events as EventSummary[]).map((event) => ({
        event,
        assignments: rows
          .filter((row) => row.event_id === event.id)
          .sort((a, b) => a.item.position - b.item.position || a.item.created_at.localeCompare(b.item.created_at))
          .map(({ id, quantity, status, item }) => ({
            id,
            quantity,
            status,
            item: { id: item.id, name: item.name, unit: item.unit, custom_unit: item.custom_unit },
          })),
      }))
      return groups.sort((a, b) => {
        if (a.event.is_past !== b.event.is_past) return a.event.is_past ? 1 : -1
        const byDate = a.event.date.localeCompare(b.event.date)
        return a.event.is_past ? -byDate : byDate
      })
    },
  })
}

/**
 * One-tap "✓ එකඟ වුණා": confirms a pending assignment. The contributor page
 * shows it at once; if the save fails it goes back and the caller offers a
 * retry. Item statuses move, so events and contributors are refreshed.
 */
export function useConfirmAssignment(contributorId: string) {
  const queryClient = useQueryClient()
  const key = contributorAssignmentsKey(contributorId)
  return useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase
        .from('assignment')
        .update({ status: 'confirmed' })
        .eq('id', assignmentId)
        .select('id')
        .single()
      if (error) throw error
    },
    onMutate: async (assignmentId) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<ContributorEventGroup[]>(key)
      if (previous) {
        queryClient.setQueryData<ContributorEventGroup[]>(
          key,
          previous.map((group) => ({
            ...group,
            assignments: group.assignments.map((a) =>
              a.id === assignmentId ? { ...a, status: 'confirmed' as const } : a,
            ),
          })),
        )
      }
      return { previous }
    },
    onError: (_error, _id, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous)
    },
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['events'] }),
        queryClient.invalidateQueries({ queryKey: ['contributors'] }),
      ]),
  })
}
