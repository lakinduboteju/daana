import { Outlet, useParams } from 'react-router'
import { useEventSummary } from '../../data/events'
import { NotFoundScreen } from '../not-found/NotFoundScreen'
import { EventHeader } from './EventHeader'
import styles from './EventScreen.module.css'

/**
 * /events/:eventId and its tabs. The header and tabs stay put while the tab
 * routes (menu, money, details) render below them through the outlet.
 */
export function EventScreen() {
  const { eventId = '' } = useParams()
  const event = useEventSummary(eventId)

  if (event.isPending) return <p className={styles.status}>…</p>
  if (event.isError) return <p role="alert" className={styles.status}>පූරණය කිරීමට නොහැකි විය</p>
  if (!event.data) return <NotFoundScreen />

  return (
    <main className={styles.screen}>
      <EventHeader event={event.data} />
      <Outlet />
    </main>
  )
}
