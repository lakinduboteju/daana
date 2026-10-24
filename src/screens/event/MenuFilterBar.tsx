import { useState } from 'react'
import type { Category } from '../../data/menu'
import {
  STATUS_FILTER_LABEL,
  STATUS_FILTERS,
  isFiltered,
  menuContributors,
  statusCounts,
  type StatusFilter,
  type useMenuFilters,
} from './menuFilters'
import styles from './MenuFilterBar.module.css'

type Props = {
  menu: Category[]
  shown: number
  filters: ReturnType<typeof useMenuFilters>
}

/**
 * Status chips with counts, category and contributor pickers, and in-menu
 * search; "Nක් පෙන්වයි" and Clear while filtered.
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
          <span>{shown}ක් පෙන්වයි</span>
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
