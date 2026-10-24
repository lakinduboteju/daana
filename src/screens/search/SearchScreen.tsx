import { Link, useSearchParams } from 'react-router'
import { CancelledBadge } from '../../components/CancelledBadge'
import { PageHeader } from '../../components/PageHeader'
import { StatusBadge } from '../../components/StatusBadge'
import { MEAL_LABEL } from '../../data/meal'
import { useSearch, type SearchResult } from '../../data/search'
import { STATUS_LABEL, type ItemStatus } from '../../data/status'
import { formatQuantity } from '../../data/units'
import { formatDayMonth } from '../../lib/dates'
import { SearchFilters } from './SearchFilters'
import styles from './SearchScreen.module.css'

/** /search: items across all events, by free text and filters kept in the URL. */
export function SearchScreen() {
  const [searchParams, setSearchParams] = useSearchParams()
  const q = searchParams.get('q') ?? ''
  const from = validDate(searchParams.get('from'))
  const to = validDate(searchParams.get('to'))
  const status = searchParams.get('status') ?? ''
  const statuses = parseStatuses(status)
  const monasteryId = validId(searchParams.get('monastery'))
  const contributorId = validId(searchParams.get('contributor'))
  const hasCriteria =
    q.trim() !== '' || from !== null || to !== null || statuses !== null || monasteryId !== null || contributorId !== null
  const search = useSearch({ q, from, to, statuses, monasteryId, contributorId }, hasCriteria)

  /** Sets (or, when empty, removes) query params; typing replaces history, choosing a filter pushes. */
  function setParams(changes: Record<string, string | null>, replace = false) {
    const next = new URLSearchParams(searchParams)
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    setSearchParams(next, { replace })
  }

  const results = hasCriteria ? search.data : undefined

  return (
    <>
      <PageHeader title="සොයන්න" />
      <div className={styles.search}>
        <label htmlFor="search-q" className={styles.visuallyHidden}>සියලු දාන තුළ සොයන්න</label>
        <input
          id="search-q"
          type="search"
          placeholder="සියලු දාන තුළ සොයන්න"
          value={q}
          onChange={(event) => setParams({ q: event.target.value }, true)}
          className={styles.searchInput}
        />
        <svg className={styles.searchIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
      </div>

      <SearchFilters
        filters={{ from, to, status, monasteryId, contributorId }}
        onChange={(changes) => setParams(changes)}
      />

      {!hasCriteria && (
        <p className={styles.message}>අයිතමයක්, දායකයෙක්, අසපුවක් හෝ දානය භාරගත් අය සොයන්න, නැත්නම් පෙරහනක් තෝරන්න.</p>
      )}
      {hasCriteria && search.isPending && <p className={styles.message}>පූරණය වෙමින්…</p>}
      {hasCriteria && search.isError && <p role="alert" className={styles.message}>සෙවීමට නොහැකි විය.</p>}

      {searchParams.size > 0 && (
        <div className={styles.countRow}>
          <span className={styles.count}>{results && `ප්‍රතිඵල ${results.length}`}</span>
          <button type="button" className={styles.clear} onClick={() => setSearchParams({})}>
            Clear
          </button>
        </div>
      )}

      {results && (
        <>
          {results.length === 0 && <p className={styles.message}>ගැළපෙන අයිතම නැත.</p>}
          <div className={styles.groups}>
            {groupByEvent(results).map((group) => (
              <EventGroup key={group[0].event_id} results={group} />
            ))}
          </div>
        </>
      )}
    </>
  )
}

const ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function validId(value: string | null): string | null {
  return value && ID_PATTERN.test(value) ? value : null
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function validDate(value: string | null): string | null {
  return value && DATE_PATTERN.test(value) ? value : null
}

/** 'pending,partial' → ['pending', 'partial']; unknown statuses are ignored, none means all. */
function parseStatuses(value: string): ItemStatus[] | null {
  const statuses = value.split(',').filter((s): s is ItemStatus => s in STATUS_LABEL)
  return statuses.length > 0 ? statuses : null
}

/** Consecutive results of the same event (results come in event order). */
function groupByEvent(results: SearchResult[]): SearchResult[][] {
  const groups: SearchResult[][] = []
  for (const result of results) {
    const last = groups[groups.length - 1]
    if (last && last[0].event_id === result.event_id) last.push(result)
    else groups.push([result])
  }
  return groups
}

function EventGroup({ results }: { results: SearchResult[] }) {
  const event = results[0]
  const titleId = `search-event-${event.event_id}`
  const subtitleId = `${titleId}-sub`
  return (
    <section aria-labelledby={`${titleId} ${subtitleId}`} className={styles.group}>
      <Link to={`/events/${event.event_id}`} className={styles.groupHeader}>
        <span id={titleId} className={styles.groupTitle}>
          {formatDayMonth(event.event_date)} · {MEAL_LABEL[event.meal]}
        </span>
        <span id={subtitleId} className={styles.groupSubtitle}>
          {event.host ? `${event.host} · ${event.monastery_name}` : event.monastery_name}
        </span>
        {event.cancelled_at && <CancelledBadge />}
      </Link>
      <ul className={styles.items}>
        {results.map((result) => (
          <li key={result.item_id}>
            <ResultRow result={result} />
          </li>
        ))}
      </ul>
    </section>
  )
}

function ResultRow({ result }: { result: SearchResult }) {
  const quantity = formatQuantity(result)
  const unassigned = result.contributor_names.length === 0
  return (
    <Link to={`/events/${result.event_id}/items/${result.item_id}`} className={styles.item}>
      <span className={styles.itemName}>{result.item_name}</span>
      <span className={unassigned ? styles.itemSubMissing : styles.itemSub}>
        {unassigned ? 'දායකයෙකු තවම නැත' : contributorNames(result.contributor_names)}
        {quantity && ` · ${quantity}`}
      </span>
      <StatusBadge status={result.status} className={styles.badge} />
    </Link>
  )
}

/** One contributor by full name; several by first names (as on the menu). */
function contributorNames(names: string[]): string {
  if (names.length === 1) return names[0]
  return names.map((n) => n.split(' ')[0]).join(', ')
}
