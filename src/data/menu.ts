import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { AssignmentStatus, ItemStatus } from './status'

export type Unit = 'kg' | 'l' | 'pieces' | 'other'

/** One contributor's part of an item. */
export type Assignment = {
  id: string
  item_id: string
  quantity: number | null
  status: AssignmentStatus
  contributor: {
    id: string
    name: string
    phone: string | null
    whatsapp: string | null
  }
}

type ItemRow = {
  id: string
  category_id: string
  name: string
  required_quantity: number | null
  unit: Unit
  custom_unit: string | null
  notes: string | null
}

export type Item = ItemRow & {
  /** From the database's item_status view. */
  status: ItemStatus
  /** Sum of the confirmed and received quantities. */
  confirmed_quantity: number
  /** Required minus confirmed quantity, or null when either isn't known. */
  shortfall: number | null
  /** Oldest first. */
  assignments: Assignment[]
}

/** From the database's category_progress view: ready = confirmed or received. */
export type CategoryProgress = { item_count: number; ready_count: number }

export type Category = {
  id: string
  name: string
  /** Saved as soon as the organizer taps the category header. */
  collapsed: boolean
  items: Item[]
  /** Counts all the category's items, whatever the menu filters show. */
  progress: CategoryProgress
}

const ITEM_COLUMNS = 'id, category_id, name, required_quantity, unit, custom_unit, notes'
const ASSIGNMENT_COLUMNS = 'id, item_id, quantity, status, contributor(id, name, phone, whatsapp)'

type StatusRow = { item_id: string; status: ItemStatus; confirmed_quantity: number; shortfall: number | null }

export function menuKey(eventId: string) {
  return ['events', eventId, 'menu']
}

/** The event's categories in order, each with its items, their statuses and assignments. */
export function useMenu(eventId: string) {
  return useQuery({
    queryKey: menuKey(eventId),
    queryFn: async (): Promise<Category[]> => {
      const [categories, statuses, assignments, progress] = await Promise.all([
        supabase
          .from('category')
          .select(`id, name, collapsed, items:item(${ITEM_COLUMNS})`)
          .eq('event_id', eventId)
          .order('position')
          .order('created_at')
          .order('position', { referencedTable: 'item' })
          .order('created_at', { referencedTable: 'item' }),
        supabase.from('item_status').select('item_id, status, confirmed_quantity, shortfall').eq('event_id', eventId),
        supabase.from('assignment').select(ASSIGNMENT_COLUMNS).eq('event_id', eventId).order('created_at'),
        supabase.from('category_progress').select('category_id, item_count, ready_count').eq('event_id', eventId),
      ])
      if (categories.error) throw categories.error
      if (statuses.error) throw statuses.error
      if (assignments.error) throw assignments.error
      if (progress.error) throw progress.error

      const statusOf = new Map((statuses.data as StatusRow[]).map((s) => [s.item_id, s]))
      const assignmentsOf = new Map<string, Assignment[]>()
      for (const a of assignments.data as unknown as Assignment[]) {
        assignmentsOf.set(a.item_id, [...(assignmentsOf.get(a.item_id) ?? []), a])
      }
      const progressOf = new Map(
        (progress.data as ({ category_id: string } & CategoryProgress)[]).map((p) => [p.category_id, p]),
      )
      return (categories.data as { id: string; name: string; collapsed: boolean; items: ItemRow[] }[]).map((category) => ({
        ...category,
        progress: {
          item_count: progressOf.get(category.id)?.item_count ?? 0,
          ready_count: progressOf.get(category.id)?.ready_count ?? 0,
        },
        items: category.items.map((item) => {
          const status = statusOf.get(item.id)
          return {
            ...item,
            status: status?.status ?? 'unassigned',
            confirmed_quantity: status?.confirmed_quantity ?? 0,
            shortfall: status?.shortfall ?? null,
            assignments: assignmentsOf.get(item.id) ?? [],
          }
        }),
      }))
    },
  })
}

/** What the item sheet edits. Blank optional fields are saved as nothing. */
export type ItemFields = {
  categoryId: string
  name: string
  requiredQuantity: number | null
  unit: Unit
  customUnit: string
  notes: string
}

function itemRow(fields: ItemFields) {
  return {
    category_id: fields.categoryId,
    name: fields.name.trim(),
    required_quantity: fields.requiredQuantity,
    unit: fields.unit,
    custom_unit: fields.unit === 'other' ? fields.customUnit.trim() : null,
    notes: fields.notes.trim() || null,
  }
}

/** Item changes show on the menu, and on cards once they count items. */
function useInvalidateEvent() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['events'] })
}

export function useAddItem(eventId: string) {
  const invalidate = useInvalidateEvent()
  return useMutation({
    mutationFn: async (fields: ItemFields) => {
      const { error } = await supabase.from('item').insert({ event_id: eventId, ...itemRow(fields) })
      if (error) throw error
    },
    onSuccess: invalidate,
  })
}

export function useUpdateItem(eventId: string) {
  const invalidate = useInvalidateEvent()
  return useMutation({
    mutationFn: async ({ itemId, fields }: { itemId: string; fields: ItemFields }) => {
      const { error } = await supabase.from('item').update(itemRow(fields)).eq('id', itemId).eq('event_id', eventId)
      if (error) throw error
    },
    onSuccess: invalidate,
  })
}

/** The item with this id in a loaded menu, or null when it isn't on this event's menu. */
export function findItem(menu: Category[], itemId: string): Item | null {
  for (const category of menu) {
    const item = category.items.find((i) => i.id === itemId)
    if (item) return item
  }
  return null
}

/** Deletes an item. Its assignments go with it; its money records and documents stay on the event. */
export function useDeleteItem(eventId: string) {
  const invalidate = useInvalidateEvent()
  return useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase.from('item').delete().eq('id', itemId).eq('event_id', eventId)
      if (error) throw error
    },
    onSuccess: invalidate,
  })
}

/** Collapses or opens a category on the menu, straight away (optimistic), rolling back if saving fails. */
export function useSetCategoryCollapsed(eventId: string) {
  const queryClient = useQueryClient()
  const key = menuKey(eventId)
  return useMutation({
    mutationFn: async ({ categoryId, collapsed }: { categoryId: string; collapsed: boolean }) => {
      const { error } = await supabase
        .from('category')
        .update({ collapsed })
        .eq('id', categoryId)
        .eq('event_id', eventId)
        .select('id')
        .single()
      if (error) throw error
    },
    onMutate: async ({ categoryId, collapsed }) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<Category[]>(key)
      if (previous) {
        queryClient.setQueryData<Category[]>(
          key,
          previous.map((c) => (c.id === categoryId ? { ...c, collapsed } : c)),
        )
      }
      return { previous }
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous)
    },
  })
}
