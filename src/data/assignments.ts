import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { addContributor } from './contributors'
import { menuKey, type Category } from './menu'
import type { AssignmentStatus } from './status'

/**
 * Assignment changes move item statuses, which show on the menu, event cards,
 * search and contributor pages, so they refresh everything event- and
 * contributor-shaped.
 */
function useInvalidateAssignments() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['events'] }),
      queryClient.invalidateQueries({ queryKey: ['contributors'] }),
    ])
}

export type NewAssignment = {
  itemId: string
  /** An existing contributor, or a new one to add to the household first. */
  contributor: { id: string } | { name: string; phone: string | null }
  quantity: number | null
  status: AssignmentStatus
}

/** Assigns a contributor to an item. Resolves to the contributor's name. */
export function useAssign(eventId: string) {
  const invalidate = useInvalidateAssignments()
  return useMutation({
    mutationFn: async ({ itemId, contributor, quantity, status }: NewAssignment) => {
      const contributorId =
        'id' in contributor
          ? contributor.id
          : (await addContributor({ name: contributor.name.trim(), phone: contributor.phone, whatsapp: null, notes: null })).id
      const { data, error } = await supabase
        .from('assignment')
        .insert({ event_id: eventId, item_id: itemId, contributor_id: contributorId, quantity, status })
        .select('contributor(name)')
        .single()
      if (error) throw error
      return (data as unknown as { contributor: { name: string } }).contributor.name
    },
    onSuccess: invalidate,
  })
}

/**
 * One-tap status change. The menu shows the new status at once; if the save
 * fails it goes back, and the caller offers a retry.
 */
export function useSetAssignmentStatus(eventId: string) {
  const queryClient = useQueryClient()
  const invalidate = useInvalidateAssignments()
  const key = menuKey(eventId)
  return useMutation({
    mutationFn: async ({ assignmentId, status }: { assignmentId: string; status: AssignmentStatus }) => {
      const { error } = await supabase
        .from('assignment')
        .update({ status })
        .eq('id', assignmentId)
        .select('id')
        .single()
      if (error) throw error
    },
    onMutate: async ({ assignmentId, status }) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<Category[]>(key)
      if (previous) {
        queryClient.setQueryData<Category[]>(
          key,
          previous.map((category) => ({
            ...category,
            items: category.items.map((item) => ({
              ...item,
              assignments: item.assignments.map((a) => (a.id === assignmentId ? { ...a, status } : a)),
            })),
          })),
        )
      }
      return { previous }
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous)
    },
    onSettled: invalidate,
  })
}

/** Changes an assignment's quantity and status. */
export function useUpdateAssignment(eventId: string) {
  const invalidate = useInvalidateAssignments()
  return useMutation({
    mutationFn: async ({
      assignmentId,
      quantity,
      status,
    }: {
      assignmentId: string
      quantity: number | null
      status: AssignmentStatus
    }) => {
      const { error } = await supabase
        .from('assignment')
        .update({ quantity, status })
        .eq('id', assignmentId)
        .eq('event_id', eventId)
        .select('id')
        .single()
      if (error) throw error
    },
    onSuccess: invalidate,
  })
}

/** Removes an assignment. The contributor stays in the household's list. */
export function useRemoveAssignment(eventId: string) {
  const invalidate = useInvalidateAssignments()
  return useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase.from('assignment').delete().eq('id', assignmentId).eq('event_id', eventId)
      if (error) throw error
    },
    onSuccess: invalidate,
  })
}
