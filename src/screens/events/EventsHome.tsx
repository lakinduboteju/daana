import { Link } from 'react-router'
import { useEventSummaries, type EventSummary } from '../../data/events'
import { CancelledBadge } from '../../components/CancelledBadge'
import { MEAL_LABEL } from '../../data/meal'
import { formatDayMonth, formatDaysAway, formatWeekday } from '../../lib/dates'
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
        <Link to="/settings" aria-label="සැකසුම්" className={styles.settings}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" /></svg>
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
        <p className={styles.emptyText}>ඔබේ පළමු දානය සැලසුම් කිරීමට අළුත් දානයක් එක් කරන්න.</p>
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

function EventCard({ event }: { event: EventSummary }) {
  return (
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
      <span className={styles.counts}>
        <span>ස්වාමීන් වහන්සේලා <b>{event.monk_count}</b></span>{' '}
        <span>ගිහි පිරිස <b>{event.layperson_count}</b></span>
      </span>
      {/* Items arrive with the menu ticket; until then no event has any. */}
      <span className={styles.noMenu}>මෙනුවක් නැත</span>
    </Link>
  )
}

function PastRow({ event }: { event: EventSummary }) {
  return (
    <Link to={`/events/${event.id}`} className={styles.pastRow}>
      <span className={styles.pastTitle}>{event.host ?? event.monastery_name}</span>
      <span className={styles.pastMeta}>
        {formatDayMonth(event.date)} {formatWeekday(event.date)} · {MEAL_LABEL[event.meal]} · {event.monastery_name}
      </span>
      {event.cancelled_at && <CancelledBadge />}
    </Link>
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
