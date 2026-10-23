import { useState } from 'react'
import { useSearchParams } from 'react-router'
import type { Category } from '../../data/menu'
import {
  FILTER_PARAMS,
  STATUS_FILTER_LABEL,
  STATUS_FILTERS,
  isFiltered,
  menuContributors,
  readFilters,
  statusCounts,
  type StatusFilter,
} from './menuFilters'
import styles from './MenuFilterBar.module.css'

/** The menu's filters, read from and written to the query string. */
export function useMenuFilters() {
  const [params, setParams] = useSearchParams()
  const filters = readFilters(params)

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

type Props = {
  menu: Category[]
  shown: number
  filters: ReturnType<typeof useMenuFilters>
}

/**
 * Status chips with counts, category and contributor pickers, and in-menu
 * search; "අයිතම Nක් පෙන්වයි" and Clear while filtered.
 */
export function MenuFilterBar({ menu, shown, filters: { filters, set, clear } }: Props) {
  const [searching, setSearching] = useState(false)
  const counts = statusCounts(menu, filters)
  const contributors = menuContributors(menu)
  const showSearch = searching || filters.q !== ''
  const chip = (status: StatusFilter | null) => {
    const key = status ?? 'all'
    const on = filters.status === status
    return (
      <button
        key={key}
        type="button"
        aria-pressed={on}
        className={on ? styles.chipOn : styles.chip}
        onClick={() => set('status', status)}
      >
        {`${STATUS_FILTER_LABEL[key]} · ${counts[key]}`}
      </button>
    )
  }

  return (
    <div className={styles.bar}>
      <div role="group" aria-label="තත්ත්වය අනුව" className={styles.chips}>
        {chip(null)}
        {STATUS_FILTERS.map(chip)}
      </div>
      <div className={styles.pickers}>
        <select
          aria-label="කාණ්ඩය"
          value={filters.category ?? ''}
          onChange={(event) => set('category', event.target.value || null)}
          className={filters.category ? styles.pickerOn : styles.picker}
        >
          <option value="">සියලු කාණ්ඩ</option>
          {menu.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
        <select
          aria-label="දායකයා"
          value={filters.contributor ?? ''}
          onChange={(event) => set('contributor', event.target.value || null)}
          className={filters.contributor ? styles.pickerOn : styles.picker}
        >
          <option value="">සියලු දායකයන්</option>
          {contributors.map((contributor) => (
            <option key={contributor.id} value={contributor.id}>{contributor.name}</option>
          ))}
        </select>
        {!showSearch && (
          <button type="button" aria-label="මෙනුව තුළ සොයන්න" className={styles.searchToggle} onClick={() => setSearching(true)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          </button>
        )}
      </div>
      {showSearch && (
        <div className={styles.search}>
          <input
            type="search"
            aria-label="මෙනුව තුළ සොයන්න"
            placeholder="Item හෝ දායකයා"
            autoFocus={searching}
            onFocus={() => setSearching(true)}
            value={filters.q}
            onChange={(event) => set('q', event.target.value || null)}
            className={styles.searchInput}
          />
        </div>
      )}
      {isFiltered(filters) && (
        <div className={styles.summary}>
          <span>අයිතම {shown}ක් පෙන්වයි</span>
          <button
            type="button"
            className={styles.clear}
            onClick={() => {
              setSearching(false)
              clear()
            }}
          >
            Clear
          </button>
        </div>
      )}
    </div>
  )
}
