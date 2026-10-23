import { useSearchParams } from 'react-router'
import type { Category } from '../../data/menu'
import {
  FILTER_PARAMS,
  STATUS_FILTER_LABEL,
  STATUS_FILTERS,
  isFiltered,
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

/** Status chips with counts; "අයිතම Nක් පෙන්වයි" and Clear while filtered. */
export function MenuFilterBar({ menu, shown, filters: { filters, set, clear } }: Props) {
  const counts = statusCounts(menu)
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
      {isFiltered(filters) && (
        <div className={styles.summary}>
          <span>අයිතම {shown}ක් පෙන්වයි</span>
          <button type="button" className={styles.clear} onClick={clear}>Clear</button>
        </div>
      )}
    </div>
  )
}
