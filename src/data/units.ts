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
  return formatAmount(item.required_quantity, item)
}

/** Any amount in the item's unit (an assignment's quantity, a shortfall), e.g. "කි.ග්‍රෑ. 2"; null when not known. */
export function formatAmount(amount: number | null, item: Pick<Item, 'unit' | 'custom_unit'>): string | null {
  if (amount == null) return null
  const unit = unitName(item)
  return unit ? `${unit} ${amount}` : String(amount)
}

/** The item's unit as it reads next to a number: "කි.ග්‍රෑ.", "ලීටර්", a typed unit, or '' for pieces. */
export function unitName(item: Pick<Item, 'unit' | 'custom_unit'>): string {
  return item.unit === 'other' ? (item.custom_unit ?? '') : UNIT_LABEL[item.unit]
}
