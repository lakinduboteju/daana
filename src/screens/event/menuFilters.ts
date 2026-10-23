import type { Category, Item } from '../../data/menu'
import type { ItemStatus } from '../../data/status'

/** The status chips, in order. "pending" also takes partial items (docs/design.md). */
export const STATUS_FILTERS = ['unassigned', 'pending', 'confirmed', 'received'] as const
export type StatusFilter = (typeof STATUS_FILTERS)[number]

export const STATUS_FILTER_LABEL: Record<StatusFilter | 'all', string> = {
  all: 'සියල්ල',
  unassigned: 'පවරා නැත',
  pending: 'තහවුරු කර නැත',
  confirmed: 'තහවුරුයි',
  received: 'ලැබී ඇත',
}

const STATUSES_OF: Record<StatusFilter, ItemStatus[]> = {
  unassigned: ['unassigned'],
  pending: ['pending', 'partial'],
  confirmed: ['confirmed'],
  received: ['received'],
}

/** The menu filters, as kept in the query string (docs/routes.md). */
export type MenuFilters = {
  status: StatusFilter | null
}

export const FILTER_PARAMS = ['status'] as const

export function readFilters(params: URLSearchParams): MenuFilters {
  const status = params.get('status')
  return {
    status: STATUS_FILTERS.includes(status as StatusFilter) ? (status as StatusFilter) : null,
  }
}

export function isFiltered(filters: MenuFilters): boolean {
  return filters.status !== null
}

function matchesStatus(item: Item, status: StatusFilter | null): boolean {
  return status === null || STATUSES_OF[status].includes(item.status)
}

/** How many items each status chip would show. */
export function statusCounts(menu: Category[]): Record<StatusFilter | 'all', number> {
  const items = menu.flatMap((c) => c.items)
  const counts = { all: items.length } as Record<StatusFilter | 'all', number>
  for (const status of STATUS_FILTERS) counts[status] = items.filter((i) => matchesStatus(i, status)).length
  return counts
}

/** The menu narrowed to matching items. When filtered, categories with no matches are left out. */
export function filterMenu(menu: Category[], filters: MenuFilters): Category[] {
  if (!isFiltered(filters)) return menu
  return menu
    .map((category) => ({ ...category, items: category.items.filter((i) => matchesStatus(i, filters.status)) }))
    .filter((category) => category.items.length > 0)
}
