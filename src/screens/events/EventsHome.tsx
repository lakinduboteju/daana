import { Link } from 'react-router'
import { useEventSummaries, type EventSummary } from '../../data/events'
import { CancelledBadge } from '../../components/CancelledBadge'
import { ProgressBar } from '../../components/Progress'
import { MEAL_LABEL } from '../../data/meal'
import { formatDayMonth, formatDaysAway, formatWeekday } from '../../lib/dates'
import { EventCardMenu } from './EventCardMenu'
import styles from './EventsHome.module.css'

export function EventsHome() {
  const events = useEventSummaries()

  return (
    <>
      <header className={styles.header}>
        <div>
          <div className={styles.greeting}>නමෝ බුද්ධාය!</div>
          <h1 className={styles.title}>දාන</h1>
        </div>
        <Link to="/settings" aria-label="Settings" className={styles.settings}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>
        </Link>
      </header>

      {events.isPending && <p className={styles.status}>…</p>}
      {events.isError && <p role="alert" className={styles.status}>දාන පූරණය කිරීමට නොහැකි විය</p>}
      {events.data && (
        <div className={styles.list}>
          <EventList events={events.data} />
        </div>
      )}

      <Link to="/events/new" className={styles.create}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
        අළුත් දානයක්
      </Link>
    </>
  )
}

function EventList({ events }: { events: EventSummary[] }) {
  if (events.length === 0) {
    return (
      <section className={styles.empty}>
        <h2 className={styles.emptyTitle}>තවම දාන කිසිවක් නැත</h2>
      </section>
    )
  }

  const upcoming = events.filter((e) => !e.is_past)
  const past = events.filter((e) => e.is_past).reverse()

  return (
    <>
      <section aria-labelledby="upcoming-title">
        <h2 id="upcoming-title" className={styles.sectionTitle}>ඉදිරි දාන</h2>
        {upcoming.length === 0 && <p className={styles.none}>ඉදිරි දාන නැත.</p>}
        {groupByDate(upcoming).map(([date, dayEvents]) => (
          <DateGroup key={date} date={date} daysAway={dayEvents[0].days_away} events={dayEvents} />
        ))}
      </section>

      {past.length > 0 && (
        <section aria-labelledby="past-title">
          <h2 id="past-title" className={styles.sectionTitle}>පසුගිය දාන</h2>
          <ul className={styles.pastList}>
            {past.map((event) => (
              <li key={event.id}>
                <PastRow event={event} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}

function DateGroup({ date, daysAway, events }: { date: string; daysAway: number; events: EventSummary[] }) {
  const titleId = `day-${date}`
  return (
    <section className={styles.day} aria-labelledby={titleId}>
      <div className={styles.dayHeader}>
        <h3 id={titleId} className={styles.dayTitle}>
          <span className={styles.dayDate}>{formatDayMonth(date)}</span>{' '}
          <span className={styles.dayWeekday}>{formatWeekday(date)}</span>
        </h3>
        <span className={styles.dayAway}>{formatDaysAway(daysAway)}</span>
      </div>
      <ul className={styles.cards}>
        {events.map((event) => (
          <li key={event.id}>
            <EventCard event={event} />
          </li>
        ))}
      </ul>
    </section>
  )
}

/** A count of zero is omitted. The total is omitted only when both are zero. */
function CountLine({ event }: { event: EventSummary }) {
  const total = event.monk_count + event.layperson_count
  if (total === 0) return null
  return (
    <span className={styles.counts}>
      {event.monk_count > 0 && <span>ස්වාමීන් වහන්සේලා <b>{event.monk_count}</b></span>}
      {event.layperson_count > 0 && <span>ගිහි පිරිස <b>{event.layperson_count}</b></span>}
      <span>මුළු <b>{total}</b></span>
    </span>
  )
}

function EventCard({ event }: { event: EventSummary }) {
  return (
    <div className={styles.cardWrap}>
      <Link to={`/events/${event.id}`} className={styles.card}>
        <span className={styles.cardTop}>
          <span className={styles.meal}>{MEAL_LABEL[event.meal]}</span>
          {event.cancelled_at && <CancelledBadge />}
        </span>
        {event.host ? (
          <>
            <span className={styles.cardTitle}>{event.host}</span>
            <span className={styles.monastery}>{event.monastery_name}</span>
          </>
        ) : (
          <span className={styles.cardTitle}>{event.monastery_name}</span>
        )}
        <CountLine event={event} />
        <CardProgress event={event} />
      </Link>
      <EventCardMenu event={event} />
    </div>
  )
}

/** Ready out of all items, what to chase (upcoming, non-cancelled only), or that there's no menu yet. */
function CardProgress({ event }: { event: EventSummary }) {
  if (event.item_count === 0) return <span className={styles.noMenu}>මෙනුවක් නැත</span>

  const attention = [
    event.attention_count > 0 && event.unassigned_count > 0 && `පවරා නැති ${event.unassigned_count}`,
    event.attention_count > 0 && event.pending_count > 0 && `තහවුරු නොවූ ${event.pending_count}`,
  ].filter(Boolean)
  return (
    <>
      <span className={styles.progress}>
        <span className={styles.progressRow}>
          <span className={styles.progressTitle}>සූදානම</span>
          <span className={styles.progressCount}>
            {event.ready_count} / {event.item_count} තහවුරුයි
          </span>
        </span>
        <ProgressBar value={event.ready_count} max={event.item_count} label="සූදානම" />
      </span>
      {(attention.length > 0 || event.short_count > 0) && (
        <span className={styles.attention}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v6M12 16.5v.5" /></svg>
          <span>
            {attention.length > 0 && <span className={styles.attentionLine}>{attention.join(' · ')}</span>}
            {event.short_count > 0 && (
              <span className={styles.shortLine}>අර්ධ වශයෙන් තහවුරු {event.short_count}</span>
            )}
          </span>
        </span>
      )}
      {event.ready_count === event.item_count && (
        <span className={styles.allReady}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="m5 12 5 5 9-10" /></svg>
          සියලු අයිතම තහවුරුයි
        </span>
      )}
    </>
  )
}

function PastRow({ event }: { event: EventSummary }) {
  return (
    <div className={styles.cardWrap}>
      <Link to={`/events/${event.id}`} className={styles.pastRow}>
        <span className={styles.pastTitle}>{event.host ?? event.monastery_name}</span>
        <span className={styles.pastMeta}>
          {formatDayMonth(event.date)} {formatWeekday(event.date)} · {MEAL_LABEL[event.meal]} · {event.monastery_name}
        </span>
        {event.cancelled_at && <CancelledBadge />}
      </Link>
      <EventCardMenu event={event} />
    </div>
  )
}

/** Events already sorted by date, as [date, events on that date] in order. */
function groupByDate(events: EventSummary[]): [string, EventSummary[]][] {
  const groups = new Map<string, EventSummary[]>()
  for (const event of events) {
    const group = groups.get(event.date)
    if (group) group.push(event)
    else groups.set(event.date, [event])
  }
  return [...groups]
}
