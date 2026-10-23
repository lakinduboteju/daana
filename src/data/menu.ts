import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export type Unit = 'kg' | 'l' | 'pieces' | 'other'

export type Item = {
  id: string
  category_id: string
  name: string
  required_quantity: number | null
  unit: Unit
  custom_unit: string | null
  notes: string | null
}

export type Category = {
  id: string
  name: string
  items: Item[]
}

const ITEM_COLUMNS = 'id, category_id, name, required_quantity, unit, custom_unit, notes'

/** The event's categories in order, each with its items. */
export function useMenu(eventId: string) {
  return useQuery({
    queryKey: ['events', eventId, 'menu'],
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase
        .from('category')
        .select(`id, name, items:item(${ITEM_COLUMNS})`)
        .eq('event_id', eventId)
        .order('position')
        .order('created_at')
        .order('position', { referencedTable: 'item' })
        .order('created_at', { referencedTable: 'item' })
      if (error) throw error
      return data as Category[]
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
