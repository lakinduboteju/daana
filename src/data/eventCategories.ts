import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

/**
 * One of an event's own categories. Events copy the organizer's templates
 * when they're created, so editing these never touches the templates or other
 * events.
 */
export type EventCategory = { id: string; name: string; position: number; itemCount: number }

const key = (eventId: string) => ['events', eventId, 'categories']

/** The event's categories in menu order, with how many items each has. */
export function useEventCategories(eventId: string) {
  return useQuery({
    queryKey: key(eventId),
    queryFn: async (): Promise<EventCategory[]> => {
      const { data, error } = await supabase
        .from('category')
        .select('id, name, position, item(count)')
        .eq('event_id', eventId)
        .order('position')
        .order('created_at')
      if (error) throw error
      return data.map(({ item, ...category }) => ({ ...category, itemCount: item[0]?.count ?? 0 }))
    },
  })
}

/** Category changes show on the menu too. */
function useInvalidateEvent(eventId: string) {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['events', eventId] })
}

/** Adds a category after the event's last one. */
export function useAddEventCategory(eventId: string) {
  const invalidate = useInvalidateEvent(eventId)
  return useMutation({
    mutationFn: async (name: string) => {
      const { data: last, error: lastError } = await supabase
        .from('category')
        .select('position')
        .eq('event_id', eventId)
        .order('position', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (lastError) throw lastError
      const { error } = await supabase
        .from('category')
        .insert({ event_id: eventId, name: name.trim(), position: (last?.position ?? 0) + 1 })
      if (error) throw error
    },
    onSettled: invalidate,
  })
}

export function useRenameEventCategory(eventId: string) {
  const invalidate = useInvalidateEvent(eventId)
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase.from('category').update({ name: name.trim() }).eq('id', id).eq('event_id', eventId)
      if (error) throw error
    },
    onSettled: invalidate,
  })
}

/**
 * Swaps two neighbouring categories, e.g. to move one up, and saves straight
 * away. The whole list is renumbered so categories that shared a position
 * still move.
 */
export function useSwapEventCategories(eventId: string) {
  const queryClient = useQueryClient()
  const invalidate = useInvalidateEvent(eventId)

  return useMutation({
    mutationFn: async (pair: [EventCategory, EventCategory]) => {
      const { data: current, error: currentError } = await supabase
        .from('category')
        .select('id, position')
        .eq('event_id', eventId)
        .order('position')
        .order('created_at')
      if (currentError) throw currentError
      const positions = new Map(current.map((c) => [c.id, c.position]))
      const changed = swapped(current, pair).filter((c) => positions.get(c.id) !== c.position)
      const results = await Promise.all(
        changed.map((c) => supabase.from('category').update({ position: c.position }).eq('id', c.id).eq('event_id', eventId)),
      )
      const error = results.find((result) => result.error)?.error
      if (error) throw error
    },
    onMutate: async (pair) => {
      await queryClient.cancelQueries({ queryKey: key(eventId) })
      queryClient.setQueryData<EventCategory[]>(key(eventId), (categories) => categories && swapped(categories, pair))
    },
    onSettled: invalidate,
  })
}

/** The list with the two categories' places swapped, numbered 1, 2, 3… */
function swapped<T extends { id: string; position: number }>(categories: T[], [a, b]: [{ id: string }, { id: string }]): T[] {
  const byId = new Map(categories.map((c) => [c.id, c]))
  return categories
    .map((c) => (c.id === a.id ? byId.get(b.id)! : c.id === b.id ? byId.get(a.id)! : c))
    .map((c, index) => ({ ...c, position: index + 1 }))
}

/** Removes a category and the items in it. */
export function useRemoveEventCategory(eventId: string) {
  const invalidate = useInvalidateEvent(eventId)
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('category').delete().eq('id', id).eq('event_id', eventId)
      if (error) throw error
    },
    onSettled: invalidate,
  })
}
