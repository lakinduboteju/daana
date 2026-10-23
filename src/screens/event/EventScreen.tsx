import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router'
import { BackHeader } from '../../components/BackHeader'
import { useEventSummary } from '../../data/events'
import { MEAL_LABEL } from '../../data/meal'
import { formatDayMonth, formatWeekday } from '../../lib/dates'
import { supabase } from '../../lib/supabase'
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
        <EventCategories eventId={e.id} />
      </div>
    </main>
  )
}

/** The event's categories in order. A placeholder until the menu ticket (#5) replaces this screen. */
function EventCategories({ eventId }: { eventId: string }) {
  const categories = useQuery({
    queryKey: ['events', eventId, 'categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('category')
        .select('id, name')
        .eq('event_id', eventId)
        .order('position')
      if (error) throw error
      return data
    },
  })
  return (
    <ul aria-label="කාණ්ඩ" className={styles.categories}>
      {categories.data?.map((category) => <li key={category.id}>{category.name}</li>)}
    </ul>
  )
}
