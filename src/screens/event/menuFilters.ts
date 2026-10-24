import { useState } from 'react'
import { useSearchParams } from 'react-router'
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
  /** Category id. */
  category: string | null
  /** Contributor id. */
  contributor: string | null
  /** Search text, as typed. */
  q: string
}

export const FILTER_PARAMS = ['status', 'category', 'contributor', 'q'] as const

export function readFilters(params: URLSearchParams): MenuFilters {
  const status = params.get('status')
  return {
    status: STATUS_FILTERS.includes(status as StatusFilter) ? (status as StatusFilter) : null,
    category: params.get('category') || null,
    contributor: params.get('contributor') || null,
    q: params.get('q') ?? '',
  }
}

export function isFiltered(filters: MenuFilters): boolean {
  return filters.status !== null || filters.category !== null || filters.contributor !== null || filters.q.trim() !== ''
}

/** Everyone assigned to something on this menu, by name. */
export function menuContributors(menu: Category[]): { id: string; name: string }[] {
  const byId = new Map<string, string>()
  for (const item of menu.flatMap((c) => c.items)) {
    for (const a of item.assignments) byId.set(a.contributor.id, a.contributor.name)
  }
  return [...byId].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name))
}

/** Category, contributor and search: every filter except status. */
function matchesOthers(item: Item, filters: MenuFilters): boolean {
  if (filters.category && item.category_id !== filters.category) return false
  if (filters.contributor && !item.assignments.some((a) => a.contributor.id === filters.contributor)) return false
  const q = filters.q.trim().toLocaleLowerCase()
  if (q) {
    const names = [item.name, ...item.assignments.map((a) => a.contributor.name)]
    if (!names.some((name) => name.toLocaleLowerCase().includes(q))) return false
  }
  return true
}

function matchesStatus(item: Item, status: StatusFilter | null): boolean {
  return status === null || STATUSES_OF[status].includes(item.status)
}

/** How many items each status chip would show, given the other filters. */
export function statusCounts(menu: Category[], filters: MenuFilters): Record<StatusFilter | 'all', number> {
  const items = menu.flatMap((c) => c.items).filter((i) => matchesOthers(i, filters))
  const counts = { all: items.length } as Record<StatusFilter | 'all', number>
  for (const status of STATUS_FILTERS) counts[status] = items.filter((i) => matchesStatus(i, status)).length
  return counts
}

/** The menu narrowed to matching items. When filtered, categories with no matches are left out. */
export function filterMenu(menu: Category[], filters: MenuFilters): Category[] {
  if (!isFiltered(filters)) return menu
  return menu
    .map((category) => ({ ...category, items: category.items.filter((i) => matchesStatus(i, filters.status) && matchesOthers(i, filters)) }))
    .filter((category) => category.items.length > 0)
}

/**
 * The menu's filters, read from and written to the query string. While a sheet
 * or item is open over the menu (onMenu false), the URL is the child route's
 * (items/new uses ?category= for something else), so the menu keeps the
 * filters it last had.
 */
export function useMenuFilters(onMenu: boolean) {
  const [params, setParams] = useSearchParams()
  const search = params.toString()
  const [menuSearch, setMenuSearch] = useState(onMenu ? search : '')
  if (onMenu && search !== menuSearch) setMenuSearch(search)
  const filters = readFilters(onMenu ? params : new URLSearchParams(menuSearch))

  /** Sets (or with null, removes) one filter param, keeping the others. Replaces the history entry. */
  function set(name: (typeof FILTER_PARAMS)[number], value: string | null) {
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        if (value) next.set(name, value)
        else next.delete(name)
        return next
      },
      { replace: true },
    )
  }

  function clear() {
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        for (const name of FILTER_PARAMS) next.delete(name)
        return next
      },
      { replace: true },
    )
  }

  return { filters, set, clear }
}

/** Link state for an item opened from the (maybe filtered) menu, so its back button keeps the filters. */
export function fromMenu(search: string) {
  return { menuSearch: search }
}

/** Where an item's back button goes: the menu, with the filters it was opened from. */
export function menuPath(eventId: string, state: unknown): string {
  const search = (state as ReturnType<typeof fromMenu> | null)?.menuSearch
  return `/events/${eventId}${typeof search === 'string' ? search : ''}`
}
