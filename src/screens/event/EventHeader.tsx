import { NavLink } from 'react-router'
import { BackHeader } from '../../components/BackHeader'
import { AttentionBox } from '../../components/AttentionBox'
import { CancelledBadge } from '../../components/CancelledBadge'
import { StackedProgress } from '../../components/Progress'
import type { EventSummary } from '../../data/events'
import { MEAL_LABEL } from '../../data/meal'
import { formatDayMonth, formatWeekday } from '../../lib/dates'
import styles from './EventHeader.module.css'

/**
 * The top of every event tab: date and meal, monastery and weekday, host,
 * the people counts, readiness and the tabs (මෙනුව, money, details).
 */
export function EventHeader({ event }: { event: EventSummary }) {
  const base = `/events/${event.id}`
  return (
    <>
      <BackHeader title={`${formatDayMonth(event.date)} · ${MEAL_LABEL[event.meal]}`} backTo="/events" />
      <section aria-labelledby="event-title" className={styles.summary}>
        <h2 id="event-title" className={styles.title}>
          {event.monastery_name} · {formatWeekday(event.date)}
        </h2>
        {event.host && <p className={styles.host}>{event.host}</p>}
        {event.cancelled_at && <CancelledBadge />}
        <CountChips event={event} />
        {event.item_count > 0 && (
          <div className={styles.readiness}>
            <div className={styles.readinessRow}>
              <span className={styles.readinessTitle}>සූදානම</span>
              <span>
                <b className={styles.readyCount}>{event.ready_count}</b> / {event.item_count} අයිතම තහවුරුයි
              </span>
            </div>
            <StackedProgress progress={event} />
          </div>
        )}
        <AttentionBox progress={event} />
      </section>
      <nav aria-label="දාන කොටස්" className={styles.tabs}>
        <NavLink to={base} end className={tabClass}>මෙනුව</NavLink>
        <NavLink to={`${base}/money`} className={tabClass}>මුදල් හා ලේඛන</NavLink>
        <NavLink to={`${base}/edit`} className={tabClass}>විස්තර</NavLink>
      </nav>
    </>
  )
}

/** A count of zero is omitted. The total is omitted only when both are zero. */
function CountChips({ event }: { event: EventSummary }) {
  const total = event.monk_count + event.layperson_count
  if (total === 0) return null
  return (
    <div className={styles.chips}>
      {event.monk_count > 0 && <Chip label="ස්වාමීන් වහන්සේලා" count={event.monk_count} />}
      {event.layperson_count > 0 && <Chip label="ගිහි" count={event.layperson_count} />}
      <Chip label="මුළු" count={total} />
    </div>
  )
}

function Chip({ label, count }: { label: string; count: number }) {
  return (
    <span className={styles.chip}>
      <span>{label}</span> <b>{count}</b>
    </span>
  )
}

function tabClass({ isActive }: { isActive: boolean }) {
  return isActive ? `${styles.tab} ${styles.active}` : styles.tab
}
