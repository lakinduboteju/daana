import { useParams } from 'react-router'
import { BackHeader } from '../../components/BackHeader'
import { useEventSummary } from '../../data/events'
import { MEAL_LABEL } from '../../data/meal'
import { formatDayMonth, formatWeekday } from '../../lib/dates'
import { NotFoundScreen } from '../not-found/NotFoundScreen'
import styles from './EventScreen.module.css'

/**
 * /events/:eventId. A placeholder until the event screen (menu) ticket lands:
 * it shows which event this is, or not found for another household's event.
 */
export function EventScreen() {
  const { eventId = '' } = useParams()
  const event = useEventSummary(eventId)

  if (event.isPending) return <p className={styles.status}>…</p>
  if (event.isError) return <p role="alert" className={styles.status}>පූරණය කිරීමට නොහැකි විය</p>
  if (!event.data) return <NotFoundScreen />

  const e = event.data
  return (
    <main className={styles.screen}>
      <BackHeader title={`${e.monastery_name} · ${MEAL_LABEL[e.meal]}`} backTo="/events" />
      <div className={styles.body}>
        <p className={styles.date}>{formatDayMonth(e.date)} · {formatWeekday(e.date)}</p>
        {e.host && <p className={styles.host}>{e.host}</p>}
      </div>
    </main>
  )
}
