import { useParams } from 'react-router'
import { BackHeader } from '../../components/BackHeader'
import { CategoryListEditor } from '../../components/CategoryListEditor'
import {
  useAddEventCategory,
  useEventCategories,
  useRemoveEventCategory,
  useRenameEventCategory,
  useSwapEventCategories,
  type EventCategory,
} from '../../data/eventCategories'
import { useEventSummary } from '../../data/events'
import { NotFoundScreen } from '../not-found/NotFoundScreen'
import styles from './EventCategoriesScreen.module.css'

/** /events/:eventId/categories: this event's own categories, in menu order. */
export function EventCategoriesScreen() {
  const { eventId = '' } = useParams()
  const event = useEventSummary(eventId)
  const categories = useEventCategories(eventId)
  const add = useAddEventCategory(eventId)
  const rename = useRenameEventCategory(eventId)
  const swap = useSwapEventCategories(eventId)
  const remove = useRemoveEventCategory(eventId)

  if (event.isSuccess && !event.data) return <NotFoundScreen />

  const loading = event.isPending || categories.isPending
  const failed = event.isError || categories.isError

  return (
    <main className={styles.screen}>
      <BackHeader title="Edit Categories" backTo={`/events/${eventId}`} />
      <p className={styles.intro}>වෙනස්කම් මෙම දානයට පමණක් අදාළයි.</p>
      {loading && !failed && <p className={styles.message}>…</p>}
      {failed && <p role="alert" className={styles.message}>පූරණය කිරීමට නොහැකි විය</p>}
      {event.data && categories.data && (
        <CategoryListEditor
          categories={categories.data}
          add={add}
          rename={rename}
          swap={swap}
          remove={remove}
          removeHint={removeHint}
        />
      )}
    </main>
  )
}

function removeHint(category: EventCategory) {
  return category.itemCount > 0 ? `මෙම කාණ්ඩයේ Item ${category.itemCount}ක් ද මැකී යයි.` : null
}
