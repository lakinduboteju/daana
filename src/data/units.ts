import type { Item, Unit } from './menu'

/** How each unit reads next to a quantity, e.g. "කි.ග්‍රෑ. 3". Pieces are just the number. */
const UNIT_LABEL: Record<Exclude<Unit, 'other'>, string> = {
  kg: 'කි.ග්‍රෑ.',
  l: 'ලීටර්',
  pieces: '',
}

/** The unit choices in the item sheet. */
export const UNIT_OPTIONS: { value: Unit; label: string }[] = [
  { value: 'kg', label: 'කි.ග්‍රෑ. (kg)' },
  { value: 'l', label: 'ලීටර් (l)' },
  { value: 'pieces', label: 'ගණන (pieces)' },
  { value: 'other', label: 'වෙනත්' },
]

/** An item's required quantity with its unit, e.g. "කි.ග්‍රෑ. 3", "40", "කට්ටල 12"; null when not known. */
export function formatQuantity(item: Pick<Item, 'required_quantity' | 'unit' | 'custom_unit'>): string | null {
  if (item.required_quantity == null) return null
  const unit = item.unit === 'other' ? (item.custom_unit ?? '') : UNIT_LABEL[item.unit]
  return unit ? `${unit} ${item.required_quantity}` : String(item.required_quantity)
}
